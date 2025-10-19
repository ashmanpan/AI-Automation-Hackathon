import { query } from '../config/database';

export interface Grade {
  id: number;
  submission_id: number;
  graded_by: number;
  score: number;
  feedback: string | null;
  graded_at: Date;
}

export class GradeModel {
  /**
   * Create or update a grade
   */
  static async createOrUpdate(
    submissionId: number,
    gradedBy: number,
    score: number,
    feedback: string | null
  ): Promise<Grade> {
    const result = await query(
      `INSERT INTO grades (submission_id, graded_by, score, feedback)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (submission_id, graded_by)
       DO UPDATE SET score = $3, feedback = $4, graded_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [submissionId, gradedBy, score, feedback]
    );

    // Update team_exercise status to 'graded'
    await query(
      `UPDATE team_exercises te
       SET status = 'graded'
       FROM submissions s
       WHERE s.id = $1 AND s.team_exercise_id = te.id`,
      [submissionId]
    );

    return result.rows[0];
  }

  /**
   * Find grade by ID
   */
  static async findById(id: number): Promise<Grade | null> {
    const result = await query('SELECT * FROM grades WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get grades for a submission (may have multiple judges)
   */
  static async findBySubmission(submissionId: number): Promise<Grade[]> {
    const result = await query(
      'SELECT * FROM grades WHERE submission_id = $1 ORDER BY graded_at DESC',
      [submissionId]
    );
    return result.rows;
  }

  /**
   * Get average score for a submission
   */
  static async getAverageScore(submissionId: number): Promise<number> {
    const result = await query(
      'SELECT AVG(score) as avg_score FROM grades WHERE submission_id = $1',
      [submissionId]
    );
    return parseFloat(result.rows[0]?.avg_score || '0');
  }

  /**
   * Delete grade
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM grades WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
