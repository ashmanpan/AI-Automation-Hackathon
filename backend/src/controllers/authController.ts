import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';

export class AuthController {
  /**
   * Login
   */
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await UserModel.verifyCredentials(username, password);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get current user info
   */
  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await UserModel.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        }
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }

      const user = await UserModel.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validUser = await UserModel.verifyCredentials(user.username, currentPassword);

      if (!validUser) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      await UserModel.update(user.id, { password: newPassword });

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
