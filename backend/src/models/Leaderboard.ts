import { query } from '../config/database';

export interface LeaderboardEntry {
  id: number;
  hackathon_id: number;
  team_id: number;
  team_name: string;
  total_score: number;
  rank: number;
  last_updated: Date;
}

export interface DetailedLeaderboardEntry extends LeaderboardEntry {
  exercise_scores: Array<{
    exercise_id: number;
    exercise_title: string;
    score: number;
    max_score: number;
  }>;
}

export class LeaderboardModel {
  /**
   * Calculate and update leaderboard for a hackathon
   */
  static async updateLeaderboard(hackathonId: number): Promise<void> {
    // Calculate scores for each team
    const scoresResult = await query(
      `SELECT
        t.id as team_id,
        t.name as team_name,
        COALESCE(SUM(avg_grades.avg_score), 0) as total_score
       FROM teams t
       LEFT JOIN team_exercises te ON t.id = te.team_id
       LEFT JOIN submissions s ON te.id = s.team_exercise_id
       LEFT JOIN (
         SELECT submission_id, AVG(score) as avg_score
         FROM grades
         GROUP BY submission_id
       ) avg_grades ON s.id = avg_grades.submission_id
       WHERE t.hackathon_id = $1
       GROUP BY t.id, t.name
       ORDER BY total_score DESC`,
      [hackathonId]
    );

    // Update or insert leaderboard entries with rankings
    for (let i = 0; i < scoresResult.rows.length; i++) {
      const { team_id, total_score } = scoresResult.rows[i];
      const rank = i + 1;

      await query(
        `INSERT INTO leaderboard (hackathon_id, team_id, total_score, rank, last_updated)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (hackathon_id, team_id)
         DO UPDATE SET total_score = $3, rank = $4, last_updated = CURRENT_TIMESTAMP`,
        [hackathonId, team_id, total_score, rank]
      );
    }
  }

  /**
   * Get leaderboard for a hackathon
   */
  static async getLeaderboard(hackathonId: number): Promise<LeaderboardEntry[]> {
    // First, update the leaderboard to ensure it's current
    await this.updateLeaderboard(hackathonId);

    const result = await query(
      `SELECT l.*, t.name as team_name
       FROM leaderboard l
       JOIN teams t ON l.team_id = t.id
       WHERE l.hackathon_id = $1
       ORDER BY l.rank`,
      [hackathonId]
    );

    return result.rows;
  }

  /**
   * Get detailed leaderboard with exercise-wise breakdown
   */
  static async getDetailedLeaderboard(hackathonId: number): Promise<DetailedLeaderboardEntry[]> {
    const leaderboard = await this.getLeaderboard(hackathonId);

    const detailedEntries: DetailedLeaderboardEntry[] = [];

    for (const entry of leaderboard) {
      const exerciseScoresResult = await query(
        `SELECT
          e.id as exercise_id,
          e.title as exercise_title,
          e.max_score,
          COALESCE(AVG(g.score), 0) as score
         FROM exercises e
         LEFT JOIN team_exercises te ON e.id = te.exercise_id AND te.team_id = $1
         LEFT JOIN submissions s ON te.id = s.team_exercise_id
         LEFT JOIN grades g ON s.id = g.submission_id
         WHERE e.hackathon_id = $2
         GROUP BY e.id, e.title, e.max_score
         ORDER BY e.start_time, e.created_at`,
        [entry.team_id, hackathonId]
      );

      detailedEntries.push({
        ...entry,
        exercise_scores: exerciseScoresResult.rows,
      });
    }

    return detailedEntries;
  }

  /**
   * Get top N teams (podium)
   */
  static async getTopTeams(hackathonId: number, limit: number = 3): Promise<LeaderboardEntry[]> {
    await this.updateLeaderboard(hackathonId);

    const result = await query(
      `SELECT l.*, t.name as team_name
       FROM leaderboard l
       JOIN teams t ON l.team_id = t.id
       WHERE l.hackathon_id = $1
       ORDER BY l.rank
       LIMIT $2`,
      [hackathonId, limit]
    );

    return result.rows;
  }

  /**
   * Get team's position in leaderboard
   */
  static async getTeamRank(teamId: number, hackathonId: number): Promise<LeaderboardEntry | null> {
    await this.updateLeaderboard(hackathonId);

    const result = await query(
      `SELECT l.*, t.name as team_name
       FROM leaderboard l
       JOIN teams t ON l.team_id = t.id
       WHERE l.team_id = $1 AND l.hackathon_id = $2`,
      [teamId, hackathonId]
    );

    return result.rows[0] || null;
  }
}
