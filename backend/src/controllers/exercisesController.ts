import { Request, Response } from 'express';
import { ExerciseModel } from '../models/Exercise';
import { TeamModel } from '../models/Team';

export class ExercisesController {
  static async getAll(req: Request, res: Response) {
    try {
      const { hackathon_id, team_id } = req.query;

      if (team_id) {
        const exercises = await ExerciseModel.findByTeam(parseInt(team_id as string));
        return res.json(exercises);
      }

      if (hackathon_id) {
        const exercises = await ExerciseModel.findByHackathon(parseInt(hackathon_id as string));
        return res.json(exercises);
      }

      res.status(400).json({ error: 'hackathon_id or team_id is required' });
    } catch (error: any) {
      console.error('Get exercises error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exercise = await ExerciseModel.findById(parseInt(id));

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      res.json(exercise);
    } catch (error: any) {
      console.error('Get exercise error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { hackathon_id, title, description, type, max_score, time_limit_minutes, start_time, assign_to } = req.body;

      if (!hackathon_id || !title || !type || max_score === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const exercise = await ExerciseModel.create({
        hackathon_id,
        title,
        description,
        type,
        max_score,
        time_limit_minutes,
        start_time: start_time ? new Date(start_time) : undefined,
      });

      // Assign to teams
      if (assign_to === 'all') {
        await ExerciseModel.assignToAllTeams(exercise.id, hackathon_id);
      } else if (Array.isArray(assign_to)) {
        for (const teamId of assign_to) {
          await ExerciseModel.assignToTeam(exercise.id, teamId);
        }
      }

      res.status(201).json(exercise);
    } catch (error: any) {
      console.error('Create exercise error:', error);
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

      const exercise = await ExerciseModel.update(parseInt(id), updates);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      res.json(exercise);
    } catch (error: any) {
      console.error('Update exercise error:', error);
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

      const exercise = await ExerciseModel.updateStatus(parseInt(id), status);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      res.json(exercise);
    } catch (error: any) {
      console.error('Update exercise status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await ExerciseModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      res.json({ message: 'Exercise deleted successfully' });
    } catch (error: any) {
      console.error('Delete exercise error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async assignToTeams(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { team_ids, assign_all } = req.body;

      const exercise = await ExerciseModel.findById(parseInt(id));

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      if (assign_all) {
        await ExerciseModel.assignToAllTeams(exercise.id, exercise.hackathon_id);
      } else if (Array.isArray(team_ids)) {
        for (const teamId of team_ids) {
          await ExerciseModel.assignToTeam(exercise.id, teamId);
        }
      } else {
        return res.status(400).json({ error: 'team_ids array or assign_all flag is required' });
      }

      res.json({ message: 'Exercise assigned successfully' });
    } catch (error: any) {
      console.error('Assign exercise error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async startExercise(req: Request, res: Response) {
    try {
      const { team_exercise_id } = req.body;

      if (!team_exercise_id) {
        return res.status(400).json({ error: 'team_exercise_id is required' });
      }

      await ExerciseModel.updateTeamExerciseStatus(
        team_exercise_id,
        'in_progress',
        new Date()
      );

      res.json({ message: 'Exercise started' });
    } catch (error: any) {
      console.error('Start exercise error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
