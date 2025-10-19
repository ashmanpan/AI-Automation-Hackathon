import { query } from '../config/database';

export interface Submission {
  id: number;
  team_exercise_id: number;
  submitted_by: number;
  submission_type: 'file' | 'text' | 'url' | 'github';
  content: string | null;
  file_path: string | null;
  submitted_at: Date;
}

export interface SubmissionWithDetails extends Submission {
  team_id: number;
  team_name: string;
  exercise_id: number;
  exercise_title: string;
  submitter_name: string;
  grade?: {
    score: number;
    feedback: string;
    graded_by: string;
    graded_at: Date;
  };
}

export class SubmissionModel {
  /**
   * Create a new submission
   */
  static async create(
    teamExerciseId: number,
    submittedBy: number,
    submissionType: Submission['submission_type'],
    content: string | null,
    filePath: string | null
  ): Promise<Submission> {
    const result = await query(
      `INSERT INTO submissions (team_exercise_id, submitted_by, submission_type, content, file_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [teamExerciseId, submittedBy, submissionType, content, filePath]
    );

    // Update team_exercise status to 'submitted'
    await query(
      `UPDATE team_exercises SET status = 'submitted' WHERE id = $1`,
      [teamExerciseId]
    );

    return result.rows[0];
  }

  /**
   * Find submission by ID
   */
  static async findById(id: number): Promise<Submission | null> {
    const result = await query('SELECT * FROM submissions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get submission with full details including team, exercise, and grade
   */
  static async findByIdWithDetails(id: number): Promise<SubmissionWithDetails | null> {
    const result = await query(
      `SELECT
        s.*,
        te.team_id,
        t.name as team_name,
        e.id as exercise_id,
        e.title as exercise_title,
        u.full_name as submitter_name,
        g.score as grade_score,
        g.feedback as grade_feedback,
        gu.full_name as graded_by,
        g.graded_at
       FROM submissions s
       JOIN team_exercises te ON s.team_exercise_id = te.id
       JOIN teams t ON te.team_id = t.id
       JOIN exercises e ON te.exercise_id = e.id
       JOIN users u ON s.submitted_by = u.id
       LEFT JOIN grades g ON s.id = g.submission_id
       LEFT JOIN users gu ON g.graded_by = gu.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const submission: SubmissionWithDetails = {
      id: row.id,
      team_exercise_id: row.team_exercise_id,
      submitted_by: row.submitted_by,
      submission_type: row.submission_type,
      content: row.content,
      file_path: row.file_path,
      submitted_at: row.submitted_at,
      team_id: row.team_id,
      team_name: row.team_name,
      exercise_id: row.exercise_id,
      exercise_title: row.exercise_title,
      submitter_name: row.submitter_name,
    };

    if (row.grade_score !== null) {
      submission.grade = {
        score: row.grade_score,
        feedback: row.grade_feedback,
        graded_by: row.graded_by,
        graded_at: row.graded_at,
      };
    }

    return submission;
  }

  /**
   * Get submissions for a team exercise
   */
  static async findByTeamExercise(teamExerciseId: number): Promise<Submission[]> {
    const result = await query(
      'SELECT * FROM submissions WHERE team_exercise_id = $1 ORDER BY submitted_at DESC',
      [teamExerciseId]
    );
    return result.rows;
  }

  /**
   * Get all submissions for a hackathon
   */
  static async findByHackathon(hackathonId: number): Promise<SubmissionWithDetails[]> {
    const result = await query(
      `SELECT
        s.*,
        te.team_id,
        t.name as team_name,
        e.id as exercise_id,
        e.title as exercise_title,
        u.full_name as submitter_name,
        g.score as grade_score,
        g.feedback as grade_feedback,
        gu.full_name as graded_by,
        g.graded_at
       FROM submissions s
       JOIN team_exercises te ON s.team_exercise_id = te.id
       JOIN teams t ON te.team_id = t.id
       JOIN exercises e ON te.exercise_id = e.id
       JOIN users u ON s.submitted_by = u.id
       LEFT JOIN grades g ON s.id = g.submission_id
       LEFT JOIN users gu ON g.graded_by = gu.id
       WHERE e.hackathon_id = $1
       ORDER BY s.submitted_at DESC`,
      [hackathonId]
    );

    return result.rows.map(row => ({
      id: row.id,
      team_exercise_id: row.team_exercise_id,
      submitted_by: row.submitted_by,
      submission_type: row.submission_type,
      content: row.content,
      file_path: row.file_path,
      submitted_at: row.submitted_at,
      team_id: row.team_id,
      team_name: row.team_name,
      exercise_id: row.exercise_id,
      exercise_title: row.exercise_title,
      submitter_name: row.submitter_name,
      grade: row.grade_score !== null ? {
        score: row.grade_score,
        feedback: row.grade_feedback,
        graded_by: row.graded_by,
        graded_at: row.graded_at,
      } : undefined,
    }));
  }

  /**
   * Get ungraded submissions
   */
  static async findUngraded(hackathonId?: number): Promise<SubmissionWithDetails[]> {
    let sql = `
      SELECT
        s.*,
        te.team_id,
        t.name as team_name,
        e.id as exercise_id,
        e.title as exercise_title,
        u.full_name as submitter_name
       FROM submissions s
       JOIN team_exercises te ON s.team_exercise_id = te.id
       JOIN teams t ON te.team_id = t.id
       JOIN exercises e ON te.exercise_id = e.id
       JOIN users u ON s.submitted_by = u.id
       WHERE NOT EXISTS (
         SELECT 1 FROM grades g WHERE g.submission_id = s.id
       )
    `;

    const params: any[] = [];

    if (hackathonId) {
      sql += ' AND e.hackathon_id = $1';
      params.push(hackathonId);
    }

    sql += ' ORDER BY s.submitted_at DESC';

    const result = await query(sql, params);

    return result.rows.map(row => ({
      id: row.id,
      team_exercise_id: row.team_exercise_id,
      submitted_by: row.submitted_by,
      submission_type: row.submission_type,
      content: row.content,
      file_path: row.file_path,
      submitted_at: row.submitted_at,
      team_id: row.team_id,
      team_name: row.team_name,
      exercise_id: row.exercise_id,
      exercise_title: row.exercise_title,
      submitter_name: row.submitter_name,
    }));
  }

  /**
   * Delete submission
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM submissions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
