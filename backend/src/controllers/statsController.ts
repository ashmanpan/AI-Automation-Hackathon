import { Request, Response } from 'express';
import pool from '../config/database';

export class StatsController {
  static async getAdminStats(req: Request, res: Response) {
    try {
      // Get active hackathon
      const activeHackathon = await pool.query(
        'SELECT id FROM hackathons WHERE status = $1 ORDER BY created_at DESC LIMIT 1',
        ['active']
      );

      const hackathonId = activeHackathon.rows[0]?.id || 1;

      // Get total users count
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      const totalUsers = parseInt(usersResult.rows[0].count);

      // Get total teams count for the active hackathon
      const teamsResult = await pool.query(
        'SELECT COUNT(*) FROM teams WHERE hackathon_id = $1',
        [hackathonId]
      );
      const totalTeams = parseInt(teamsResult.rows[0].count);

      // Get total exercises count for the active hackathon
      const exercisesResult = await pool.query(
        'SELECT COUNT(*) FROM exercises WHERE hackathon_id = $1',
        [hackathonId]
      );
      const totalExercises = parseInt(exercisesResult.rows[0].count);

      // Get total submissions count
      const submissionsResult = await pool.query(
        `SELECT COUNT(*) FROM submissions s
         JOIN team_exercises te ON s.team_exercise_id = te.id
         JOIN exercises e ON te.exercise_id = e.id
         WHERE e.hackathon_id = $1`,
        [hackathonId]
      );
      const totalSubmissions = parseInt(submissionsResult.rows[0].count);

      // Get pending grading count
      const pendingResult = await pool.query(
        `SELECT COUNT(*) FROM submissions s
         JOIN team_exercises te ON s.team_exercise_id = te.id
         JOIN exercises e ON te.exercise_id = e.id
         LEFT JOIN grades g ON s.id = g.submission_id
         WHERE e.hackathon_id = $1 AND g.id IS NULL`,
        [hackathonId]
      );
      const pendingGrading = parseInt(pendingResult.rows[0].count);

      // Get recent activity (last 5 submissions)
      const recentActivity = await pool.query(
        `SELECT
          s.id,
          s.submitted_at,
          u.username,
          u.full_name,
          t.name as team_name,
          e.title as exercise_title
         FROM submissions s
         JOIN team_exercises te ON s.team_exercise_id = te.id
         JOIN teams t ON te.team_id = t.id
         JOIN exercises e ON te.exercise_id = e.id
         JOIN users u ON s.submitted_by = u.id
         WHERE e.hackathon_id = $1
         ORDER BY s.submitted_at DESC
         LIMIT 5`,
        [hackathonId]
      );

      res.json({
        total_users: totalUsers,
        total_teams: totalTeams,
        total_exercises: totalExercises,
        total_submissions: totalSubmissions,
        active_users: totalUsers, // TODO: Calculate actual active users
        pending_grading: pendingGrading,
        avg_score: 0, // TODO: Calculate average score
        recent_activity: recentActivity.rows
      });
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getJudgeStats(req: Request, res: Response) {
    try {
      const judgeId = (req as any).user.userId;

      // Get active hackathon
      const activeHackathon = await pool.query(
        'SELECT id FROM hackathons WHERE status = $1 ORDER BY created_at DESC LIMIT 1',
        ['active']
      );

      const hackathonId = activeHackathon.rows[0]?.id || 1;

      // Get submissions graded by this judge
      const gradedResult = await pool.query(
        `SELECT COUNT(*) FROM grades WHERE graded_by = $1`,
        [judgeId]
      );
      const totalGraded = parseInt(gradedResult.rows[0].count);

      // Get pending grading count
      const pendingResult = await pool.query(
        `SELECT COUNT(*) FROM submissions s
         JOIN team_exercises te ON s.team_exercise_id = te.id
         JOIN exercises e ON te.exercise_id = e.id
         LEFT JOIN grades g ON s.id = g.submission_id
         WHERE e.hackathon_id = $1 AND g.id IS NULL`,
        [hackathonId]
      );
      const pendingGrading = parseInt(pendingResult.rows[0].count);

      res.json({
        totalGraded,
        pendingGrading,
        activeHackathonId: hackathonId
      });
    } catch (error: any) {
      console.error('Get judge stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getParticipantStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      // Get user's team
      const teamResult = await pool.query(
        `SELECT t.id, t.name, t.hackathon_id
         FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = $1
         LIMIT 1`,
        [userId]
      );

      if (teamResult.rows.length === 0) {
        return res.json({
          hasTeam: false,
          total_exercises: 0,
          solved_exercises: 0,
          pending_submissions: 0,
          total_score: 0,
          team_rank: null
        });
      }

      const team = teamResult.rows[0];

      // Get total active exercises for this hackathon (ALL exercises, not just assigned)
      const totalExercisesResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM exercises
         WHERE hackathon_id = $1 AND status = 'active'`,
        [team.hackathon_id]
      );

      const totalExercises = parseInt(totalExercisesResult.rows[0]?.total || 0);

      // Get solved exercises (exercises with graded submissions for this team)
      const solvedExercisesResult = await pool.query(
        `SELECT COUNT(DISTINCT te.exercise_id) as solved
         FROM team_exercises te
         JOIN submissions s ON s.team_exercise_id = te.id
         JOIN grades g ON g.submission_id = s.id
         WHERE te.team_id = $1`,
        [team.id]
      );

      const solvedExercises = parseInt(solvedExercisesResult.rows[0]?.solved || 0);

      // Get pending submissions (submissions without grades)
      const pendingSubmissionsResult = await pool.query(
        `SELECT COUNT(DISTINCT s.id) as pending
         FROM team_exercises te
         JOIN submissions s ON s.team_exercise_id = te.id
         LEFT JOIN grades g ON g.submission_id = s.id
         WHERE te.team_id = $1 AND g.id IS NULL`,
        [team.id]
      );

      const pendingSubmissions = parseInt(pendingSubmissionsResult.rows[0]?.pending || 0);

      // Get team score and rank from leaderboard
      const leaderboard = await pool.query(
        `SELECT total_score, rank
         FROM leaderboard
         WHERE team_id = $1 AND hackathon_id = $2`,
        [team.id, team.hackathon_id]
      );

      const score = leaderboard.rows[0]?.total_score || 0;
      const rank = leaderboard.rows[0]?.rank || null;

      res.json({
        hasTeam: true,
        team_id: team.id,
        team_name: team.name,
        total_exercises: totalExercises,
        solved_exercises: solvedExercises,
        pending_submissions: pendingSubmissions,
        total_score: parseFloat(score),
        team_rank: rank ? parseInt(rank) : null
      });
    } catch (error: any) {
      console.error('Get participant stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
