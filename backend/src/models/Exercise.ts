import { query } from '../config/database';

export interface Exercise {
  id: number;
  hackathon_id: number;
  title: string;
  description: string | null;
  instructions: string | null;  // Step-by-step user guide
  rubric: string | null;  // Grading criteria/rubric
  type: 'coding' | 'study' | 'presentation' | 'deployment' | 'other';
  max_score: number;
  time_limit_minutes: number | null;
  start_time: Date | null;
  end_time: Date | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: Date;
}

export interface CreateExerciseInput {
  hackathon_id: number;
  title: string;
  description?: string;
  instructions?: string;  // Step-by-step guide for participants
  rubric?: string;  // Grading criteria for judges/AI
  type: 'coding' | 'study' | 'presentation' | 'deployment' | 'other';
  max_score: number;
  time_limit_minutes?: number;
  start_time?: Date;
}

export class ExerciseModel {
  /**
   * Create a new exercise
   */
  static async create(input: CreateExerciseInput): Promise<Exercise> {
    const end_time = input.start_time && input.time_limit_minutes
      ? new Date(input.start_time.getTime() + input.time_limit_minutes * 60000)
      : null;

    const result = await query(
      `INSERT INTO exercises (hackathon_id, title, description, instructions, rubric, type, max_score, time_limit_minutes, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        input.hackathon_id,
        input.title,
        input.description || null,
        input.instructions || null,
        input.rubric || null,
        input.type,
        input.max_score,
        input.time_limit_minutes || null,
        input.start_time || null,
        end_time,
      ]
    );
    return result.rows[0];
  }

  /**
   * Find exercise by ID
   */
  static async findById(id: number): Promise<Exercise | null> {
    const result = await query('SELECT * FROM exercises WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all exercises for a hackathon
   */
  static async findByHackathon(hackathonId: number, status?: string): Promise<Exercise[]> {
    let sql = 'SELECT * FROM exercises WHERE hackathon_id = $1';
    const params: any[] = [hackathonId];

    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }

    sql += ' ORDER BY start_time, created_at';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Assign exercise to team
   */
  static async assignToTeam(exerciseId: number, teamId: number): Promise<void> {
    await query(
      `INSERT INTO team_exercises (team_id, exercise_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (team_id, exercise_id) DO NOTHING`,
      [teamId, exerciseId]
    );
  }

  /**
   * Assign exercise to all teams in hackathon
   */
  static async assignToAllTeams(exerciseId: number, hackathonId: number): Promise<void> {
    await query(
      `INSERT INTO team_exercises (team_id, exercise_id, status)
       SELECT t.id, $1, 'pending'
       FROM teams t
       WHERE t.hackathon_id = $2
       ON CONFLICT (team_id, exercise_id) DO NOTHING`,
      [exerciseId, hackathonId]
    );
  }

  /**
   * Get exercises for a specific team
   */
  static async findByTeam(teamId: number): Promise<any[]> {
    const result = await query(
      `SELECT e.*, te.id as team_exercise_id, te.status as assignment_status,
              te.assigned_at, te.started_at
       FROM exercises e
       JOIN team_exercises te ON e.id = te.exercise_id
       WHERE te.team_id = $1
       ORDER BY e.start_time, e.created_at`,
      [teamId]
    );
    return result.rows;
  }

  /**
   * Update exercise status (e.g., activate, complete)
   */
  static async updateStatus(id: number, status: Exercise['status']): Promise<Exercise | null> {
    const result = await query(
      'UPDATE exercises SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update team exercise status
   */
  static async updateTeamExerciseStatus(
    teamExerciseId: number,
    status: string,
    startedAt?: Date
  ): Promise<void> {
    let sql = 'UPDATE team_exercises SET status = $1';
    const params: any[] = [status];

    if (startedAt) {
      sql += ', started_at = $2 WHERE id = $3';
      params.push(startedAt, teamExerciseId);
    } else {
      sql += ' WHERE id = $2';
      params.push(teamExerciseId);
    }

    await query(sql, params);
  }

  /**
   * Update exercise
   */
  static async update(id: number, updates: Partial<CreateExerciseInput>): Promise<Exercise | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.instructions !== undefined) {
      fields.push(`instructions = $${paramCount++}`);
      values.push(updates.instructions);
    }

    if (updates.rubric !== undefined) {
      fields.push(`rubric = $${paramCount++}`);
      values.push(updates.rubric);
    }

    if (updates.type) {
      fields.push(`type = $${paramCount++}`);
      values.push(updates.type);
    }

    if (updates.max_score !== undefined) {
      fields.push(`max_score = $${paramCount++}`);
      values.push(updates.max_score);
    }

    if (updates.time_limit_minutes !== undefined) {
      fields.push(`time_limit_minutes = $${paramCount++}`);
      values.push(updates.time_limit_minutes);
    }

    if (updates.start_time !== undefined) {
      fields.push(`start_time = $${paramCount++}`);
      values.push(updates.start_time);

      if (updates.time_limit_minutes) {
        const end_time = new Date(updates.start_time.getTime() + updates.time_limit_minutes * 60000);
        fields.push(`end_time = $${paramCount++}`);
        values.push(end_time);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `UPDATE exercises SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Delete exercise
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM exercises WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
