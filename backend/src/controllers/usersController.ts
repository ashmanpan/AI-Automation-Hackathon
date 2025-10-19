import { Request, Response } from 'express';
import { UserModel, CreateUserInput } from '../models/User';
import { generateUsername, generatePassword } from '../utils/passwordGenerator';
import fs from 'fs';
import csvParser from 'csv-parser';

export class UsersController {
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
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'CSV file is required' });
      }

      const results: any[] = [];
      const credentials: any[] = [];

      // Parse CSV file
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(req.file!.path)
          .pipe(csvParser())
          .on('data', (row) => {
            // Expected columns: full_name, email, role (optional, defaults to 'participant')
            if (row.full_name) {
              results.push({
                full_name: row.full_name.trim(),
                email: row.email?.trim() || null,
                role: row.role?.trim() || 'participant',
              });
            }
          })
          .on('end', resolve)
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
            // Username exists, try with a number suffix
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
          } else {
            console.error('Error creating user:', error);
          }
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.status(201).json({
        message: `${credentials.length} users created successfully`,
        credentials,
      });
    } catch (error: any) {
      console.error('Bulk create users error:', error);
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
