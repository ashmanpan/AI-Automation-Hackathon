import { query } from '../config/database';

export interface Team {
  id: number;
  name: string;
  hackathon_id: number;
  created_at: Date;
}

export interface TeamWithMembers extends Team {
  members: Array<{
    user_id: number;
    username: string;
    full_name: string;
    email: string | null;
  }>;
}

export class TeamModel {
  /**
   * Create a new team
   */
  static async create(name: string, hackathonId: number): Promise<Team> {
    const result = await query(
      `INSERT INTO teams (name, hackathon_id)
       VALUES ($1, $2)
       RETURNING *`,
      [name, hackathonId]
    );
    return result.rows[0];
  }

  /**
   * Find team by ID
   */
  static async findById(id: number): Promise<Team | null> {
    const result = await query('SELECT * FROM teams WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get team with members
   */
  static async findByIdWithMembers(id: number): Promise<TeamWithMembers | null> {
    const teamResult = await query('SELECT * FROM teams WHERE id = $1', [id]);

    if (teamResult.rows.length === 0) {
      return null;
    }

    const team = teamResult.rows[0];

    const membersResult = await query(
      `SELECT u.id, u.username, u.full_name, u.email, u.role,
              u.created_at, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at`,
      [id]
    );

    return {
      ...team,
      members: membersResult.rows,
    };
  }

  /**
   * Get all teams for a hackathon
   */
  static async findByHackathon(hackathonId: number): Promise<TeamWithMembers[]> {
    const teamsResult = await query(
      'SELECT * FROM teams WHERE hackathon_id = $1 ORDER BY name',
      [hackathonId]
    );

    const teams: TeamWithMembers[] = [];

    for (const team of teamsResult.rows) {
      const membersResult = await query(
        `SELECT u.id, u.username, u.full_name, u.email, u.role,
                u.created_at, tm.joined_at
         FROM team_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = $1
         ORDER BY tm.joined_at`,
        [team.id]
      );

      teams.push({
        ...team,
        members: membersResult.rows,
      });
    }

    return teams;
  }

  /**
   * Add member to team
   */
  static async addMember(teamId: number, userId: number): Promise<void> {
    await query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [teamId, userId]
    );
  }

  /**
   * Remove member from team
   */
  static async removeMember(teamId: number, userId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get team by user ID
   */
  static async findByUserId(userId: number, hackathonId?: number): Promise<Team | null> {
    let sql = `
      SELECT t.* FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
    `;

    const params: any[] = [userId];

    if (hackathonId) {
      sql += ' AND t.hackathon_id = $2';
      params.push(hackathonId);
    }

    sql += ' LIMIT 1';

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Update team
   */
  static async update(id: number, name: string): Promise<Team | null> {
    const result = await query(
      'UPDATE teams SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete team
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM teams WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get unassigned participants for a hackathon
   */
  static async getUnassignedParticipants(hackathonId: number): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.email
       FROM users u
       WHERE u.role = 'participant'
       AND u.id NOT IN (
         SELECT tm.user_id FROM team_members tm
         JOIN teams t ON tm.team_id = t.id
         WHERE t.hackathon_id = $1
       )
       ORDER BY u.full_name`,
      [hackathonId]
    );
    return result.rows;
  }
}
