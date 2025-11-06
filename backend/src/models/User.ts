import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/passwordGenerator';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  full_name: string;
  role: 'admin' | 'judge' | 'participant';
  created_at: Date;
}

export interface CreateUserInput {
  username: string;
  password: string;
  email?: string;
  full_name: string;
  role: 'admin' | 'judge' | 'participant';
}

export class UserModel {
  /**
   * Create a new user
   */
  static async create(input: CreateUserInput): Promise<User> {
    const password_hash = await hashPassword(input.password);

    const result = await query(
      `INSERT INTO users (username, password_hash, email, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role, created_at`,
      [input.username, password_hash, input.email || null, input.full_name, input.role]
    );

    return result.rows[0];
  }

  /**
   * Create multiple users (for bulk import)
   */
  static async createMany(users: CreateUserInput[]): Promise<User[]> {
    const createdUsers: User[] = [];

    for (const user of users) {
      try {
        const created = await this.create(user);
        createdUsers.push(created);
      } catch (error: any) {
        // If username already exists, skip or handle accordingly
        if (error.code === '23505') { // Unique violation
          console.warn(`User ${user.username} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    return createdUsers;
  }

  /**
   * Find user by ID
   */
  static async findById(id: number): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all users with optional role filter
   */
  static async findAll(role?: string): Promise<User[]> {
    let sql = 'SELECT id, username, email, full_name, role, created_at FROM users';
    const params: any[] = [];

    if (role) {
      sql += ' WHERE role = $1';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Verify user credentials
   */
  static async verifyCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);

    if (!user) {
      return null;
    }

    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Update user password
   */
  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const password_hash = await hashPassword(newPassword);
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, id]
    );
  }

  /**
   * Update user
   */
  static async update(id: number, updates: Partial<CreateUserInput>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.username) {
      fields.push(`username = $${paramCount++}`);
      values.push(updates.username);
    }

    if (updates.password) {
      const password_hash = await hashPassword(updates.password);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(password_hash);
    }

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updates.full_name) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updates.full_name);
    }

    if (updates.role) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, full_name, role, created_at`;

    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Delete user
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
