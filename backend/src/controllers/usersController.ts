import { Request, Response } from 'express';
import { UserModel, CreateUserInput } from '../models/User';
import { generateUsername, generatePassword } from '../utils/passwordGenerator';
import fs from 'fs';
import csvParser from 'csv-parser';

export class UsersController {
  /**
   * Get user count (admin only)
   */
  static async getCount(req: Request, res: Response) {
    try {
      const { query } = require('../config/database');
      const result = await query('SELECT COUNT(*) as total FROM users');
      const roleResult = await query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
      res.json({
        total: parseInt(result.rows[0].total),
        by_role: roleResult.rows
      });
    } catch (error: any) {
      console.error('Get user count error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all users
   */
  static async getAll(req: Request, res: Response) {
    try {
      const { role } = req.query;
      const users = await UserModel.findAll(role as string);
      res.json(users);
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(parseInt(id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't send password hash
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create a new user
   */
  static async create(req: Request, res: Response) {
    try {
      const { username, password, email, full_name, role } = req.body;

      if (!username || !password || !full_name || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await UserModel.create({
        username,
        password,
        email,
        full_name,
        role,
      });

      const { password_hash, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error('Create user error:', error);

      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Bulk create users from CSV
   * CSV format: full_name,email,role
   * Auto-generates username and password
   */
  static async bulkCreate(req: Request, res: Response) {
    let filePath: string | undefined;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'CSV file is required' });
      }

      filePath = req.file.path;
      const results: any[] = [];
      const credentials: any[] = [];

      // Parse CSV file
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(req.file!.path)
          .pipe(csvParser())
          .on('data', (row) => {
            console.log('[CSV Row]', row); // Debug: log each row
            // Expected columns: full_name, email, role (optional, defaults to 'participant')
            // Handle both snake_case and variations (csv-parser converts headers to lowercase)
            const fullName = row.full_name || row['full name'] || row['Full Name'] || row.fullName || row.name;
            if (fullName && fullName.trim()) {
              const email = row.email || row['Email'] || null;
              const role = row.role || row['Role'] || 'participant';
              results.push({
                full_name: fullName.trim(),
                email: email?.trim() || null,
                role: role.trim().toLowerCase(),
              });
            }
          })
          .on('end', () => {
            console.log(`[CSV] Parsed ${results.length} rows from CSV`);
            resolve();
          })
          .on('error', reject);
      });

      // Create users with auto-generated credentials
      for (const userData of results) {
        const username = generateUsername(userData.full_name);
        const password = generatePassword();

        try {
          const user = await UserModel.create({
            username,
            password,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
          });

          credentials.push({
            id: user.id,
            username,
            password, // Plain text password to send back
            full_name: userData.full_name,
            email: userData.email,
            role: userData.role,
          });
        } catch (error: any) {
          if (error.code === '23505') {
            // Duplicate key - try with username suffix if it's username conflict
            if (error.constraint === 'users_username_key') {
              try {
                const usernameWithNumber = `${username}${Math.floor(Math.random() * 1000)}`;
                const user = await UserModel.create({
                  username: usernameWithNumber,
                  password,
                  email: userData.email,
                  full_name: userData.full_name,
                  role: userData.role,
                });

                credentials.push({
                  id: user.id,
                  username: usernameWithNumber,
                  password,
                  full_name: userData.full_name,
                  email: userData.email,
                  role: userData.role,
                });
              } catch (retryError: any) {
                console.error(`Failed to create user ${userData.full_name}: ${retryError.message}`);
                // Skip this user - email might be duplicate
              }
            } else {
              // Email or other constraint violation - skip this user
              console.error(`Skipping user ${userData.full_name}: duplicate ${error.constraint}`);
            }
          } else {
            console.error('Error creating user:', error);
          }
        }
      }

      // Clean up uploaded file
      if (filePath) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }
      }

      res.status(201).json({
        message: `${credentials.length} users created successfully`,
        credentials,
      });
    } catch (error: any) {
      console.error('Bulk create users error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        file: filePath
      });

      // Clean up uploaded file on error
      if (filePath) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error deleting temp file on error:', unlinkError);
        }
      }

      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  }

  /**
   * Reset user password (admin only)
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const newPassword = generatePassword();

      await UserModel.updatePassword(parseInt(id), newPassword);

      res.json({
        message: 'Password reset successfully',
        username: (await UserModel.findById(parseInt(id)))?.username,
        newPassword
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Export users to CSV (admin only)
   */
  static async exportToCSV(req: Request, res: Response) {
    try {
      const { role } = req.query;
      const users = await UserModel.findAll(role as string);

      // Create CSV content
      let csv = 'id,username,full_name,email,role,created_at\n';
      users.forEach(user => {
        csv += `${user.id},"${user.username}","${user.full_name}","${user.email || ''}","${user.role}","${user.created_at}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error: any) {
      console.error('Export users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update user
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await UserModel.update(parseInt(id), updates);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('Update user error:', error);

      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete user
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await UserModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate credentials for a user (admin only)
   */
  static async generateCredentials(req: Request, res: Response) {
    try {
      const { full_name, email, role } = req.body;

      if (!full_name || !role) {
        return res.status(400).json({ error: 'full_name and role are required' });
      }

      const username = generateUsername(full_name);
      const password = generatePassword();

      const user = await UserModel.create({
        username,
        password,
        email: email || undefined,
        full_name,
        role,
      });

      res.status(201).json({
        id: user.id,
        username,
        password, // Send plain text password once
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      });
    } catch (error: any) {
      console.error('Generate credentials error:', error);

      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username already exists' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
