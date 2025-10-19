import { query } from '../config/database';

export interface Hackathon {
  id: number;
  name: string;
  description: string | null;
  start_time: Date | null;
  end_time: Date | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by: number | null;
  created_at: Date;
}

export interface CreateHackathonInput {
  name: string;
  description?: string;
  start_time?: Date;
  end_time?: Date;
  created_by: number;
}

export class HackathonModel {
  /**
   * Create a new hackathon
   */
  static async create(input: CreateHackathonInput): Promise<Hackathon> {
    const result = await query(
      `INSERT INTO hackathons (name, description, start_time, end_time, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.name,
        input.description || null,
        input.start_time || null,
        input.end_time || null,
        input.created_by,
      ]
    );
    return result.rows[0];
  }

  /**
   * Find hackathon by ID
   */
  static async findById(id: number): Promise<Hackathon | null> {
    const result = await query('SELECT * FROM hackathons WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all hackathons
   */
  static async findAll(): Promise<Hackathon[]> {
    const result = await query(
      'SELECT * FROM hackathons ORDER BY created_at DESC'
    );
    return result.rows;
  }

  /**
   * Get hackathons by status
   */
  static async findByStatus(status: Hackathon['status']): Promise<Hackathon[]> {
    const result = await query(
      'SELECT * FROM hackathons WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows;
  }

  /**
   * Update hackathon status
   */
  static async updateStatus(id: number, status: Hackathon['status']): Promise<Hackathon | null> {
    const result = await query(
      'UPDATE hackathons SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update hackathon
   */
  static async update(id: number, updates: Partial<CreateHackathonInput>): Promise<Hackathon | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.start_time !== undefined) {
      fields.push(`start_time = $${paramCount++}`);
      values.push(updates.start_time);
    }

    if (updates.end_time !== undefined) {
      fields.push(`end_time = $${paramCount++}`);
      values.push(updates.end_time);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `UPDATE hackathons SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Delete hackathon
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM hackathons WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get active hackathon (utility method)
   */
  static async getActive(): Promise<Hackathon | null> {
    const result = await query(
      `SELECT * FROM hackathons
       WHERE status = 'active'
       ORDER BY start_time DESC
       LIMIT 1`
    );
    return result.rows[0] || null;
  }
}
