import { Request, Response } from 'express';
import { TeamModel } from '../models/Team';

export class TeamsController {
  static async getAll(req: Request, res: Response) {
    try {
      const { hackathon_id } = req.query;

      if (!hackathon_id) {
        return res.status(400).json({ error: 'hackathon_id is required' });
      }

      const teams = await TeamModel.findByHackathon(parseInt(hackathon_id as string));
      res.json({ teams });
    } catch (error: any) {
      console.error('Get teams error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const team = await TeamModel.findByIdWithMembers(parseInt(id));

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json({ team });
    } catch (error: any) {
      console.error('Get team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const team = await TeamModel.findByIdWithMembers(parseInt(id));

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json({ members: team.members });
    } catch (error: any) {
      console.error('Get team members error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, hackathon_id } = req.body;

      if (!name || !hackathon_id) {
        return res.status(400).json({ error: 'name and hackathon_id are required' });
      }

      const team = await TeamModel.create(name, hackathon_id);
      res.status(201).json({ team });
    } catch (error: any) {
      console.error('Create team error:', error);

      if (error.code === '23505') {
        return res.status(409).json({ error: 'Team name already exists in this hackathon' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      const team = await TeamModel.update(parseInt(id), name);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json({ team });
    } catch (error: any) {
      console.error('Update team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await TeamModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json({ message: 'Team deleted successfully' });
    } catch (error: any) {
      console.error('Delete team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async addMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      await TeamModel.addMember(parseInt(id), user_id);
      res.json({ message: 'Member added successfully' });
    } catch (error: any) {
      console.error('Add member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async removeMember(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const removed = await TeamModel.removeMember(parseInt(id), parseInt(userId));

      if (!removed) {
        return res.status(404).json({ error: 'Member not found in team' });
      }

      res.json({ message: 'Member removed successfully' });
    } catch (error: any) {
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUnassignedParticipants(req: Request, res: Response) {
    try {
      const { hackathon_id } = req.query;

      if (!hackathon_id) {
        return res.status(400).json({ error: 'hackathon_id is required' });
      }

      const participants = await TeamModel.getUnassignedParticipants(
        parseInt(hackathon_id as string)
      );
      res.json({ participants });
    } catch (error: any) {
      console.error('Get unassigned participants error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMyTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const team = await TeamModel.findByUserId(userId);

      if (!team) {
        return res.status(404).json({ error: 'No team assigned' });
      }

      res.json({ team });
    } catch (error: any) {
      console.error('Get my team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
