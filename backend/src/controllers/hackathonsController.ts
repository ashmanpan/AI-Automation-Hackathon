import { Request, Response } from 'express';
import { HackathonModel } from '../models/Hackathon';

export class HackathonsController {
  static async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;

      const hackathons = status
        ? await HackathonModel.findByStatus(status as any)
        : await HackathonModel.findAll();

      res.json(hackathons);
    } catch (error: any) {
      console.error('Get hackathons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const hackathon = await HackathonModel.findById(parseInt(id));

      if (!hackathon) {
        return res.status(404).json({ error: 'Hackathon not found' });
      }

      res.json(hackathon);
    } catch (error: any) {
      console.error('Get hackathon error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getActive(req: Request, res: Response) {
    try {
      const hackathon = await HackathonModel.getActive();

      if (!hackathon) {
        return res.status(404).json({ error: 'No active hackathon found' });
      }

      res.json(hackathon);
    } catch (error: any) {
      console.error('Get active hackathon error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, description, start_time, end_time } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hackathon = await HackathonModel.create({
        name,
        description,
        start_time: start_time ? new Date(start_time) : undefined,
        end_time: end_time ? new Date(end_time) : undefined,
        created_by: req.user.userId,
      });

      res.status(201).json(hackathon);
    } catch (error: any) {
      console.error('Create hackathon error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.start_time) {
        updates.start_time = new Date(updates.start_time);
      }

      if (updates.end_time) {
        updates.end_time = new Date(updates.end_time);
      }

      const hackathon = await HackathonModel.update(parseInt(id), updates);

      if (!hackathon) {
        return res.status(404).json({ error: 'Hackathon not found' });
      }

      res.json(hackathon);
    } catch (error: any) {
      console.error('Update hackathon error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      const hackathon = await HackathonModel.updateStatus(parseInt(id), status);

      if (!hackathon) {
        return res.status(404).json({ error: 'Hackathon not found' });
      }

      res.json(hackathon);
    } catch (error: any) {
      console.error('Update hackathon status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await HackathonModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ error: 'Hackathon not found' });
      }

      res.json({ message: 'Hackathon deleted successfully' });
    } catch (error: any) {
      console.error('Delete hackathon error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
