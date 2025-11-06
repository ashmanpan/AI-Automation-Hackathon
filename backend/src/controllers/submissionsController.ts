import { Request, Response } from 'express';
import { SubmissionModel } from '../models/Submission';
import { GradeModel } from '../models/Grade';
import { LeaderboardModel } from '../models/Leaderboard';
import { uploadFile } from '../services/fileStorageService';

export class SubmissionsController {
  static async getAll(req: Request, res: Response) {
    try {
      let { hackathon_id, ungraded, team_id } = req.query;

      // If no hackathon_id provided, use the active hackathon
      if (!hackathon_id) {
        const { default: pool } = await import('../config/database');
        const result = await pool.query(
          'SELECT id FROM hackathons WHERE status = $1 ORDER BY created_at DESC LIMIT 1',
          ['active']
        );
        hackathon_id = result.rows[0]?.id?.toString() || '1';
      }

      if (ungraded === 'true') {
        const submissions = hackathon_id
          ? await SubmissionModel.findUngraded(parseInt(hackathon_id as string))
          : await SubmissionModel.findUngraded();
        return res.json({ submissions });
      }

      let submissions = await SubmissionModel.findByHackathon(parseInt(hackathon_id as string));
      
      // Filter by team_id if provided
      if (team_id) {
        submissions = submissions.filter(s => s.team_id === parseInt(team_id as string));
      }
      
      return res.json({ submissions });
    } catch (error: any) {
      console.error('Get submissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await SubmissionModel.findByIdWithDetails(parseInt(id));

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      res.json({ submission });
    } catch (error: any) {
      console.error('Get submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { team_exercise_id, submission_type, content } = req.body;

      if (!team_exercise_id || !submission_type) {
        return res.status(400).json({ error: 'team_exercise_id and submission_type are required' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      let filePath = null;
      let fileUrl = null;

      // Handle file upload to MinIO/S3
      if (submission_type === 'file' && req.file) {
        try {
          const uploadResult = await uploadFile(req.file, 'submissions');
          filePath = uploadResult.fileName; // Store MinIO file name
          fileUrl = uploadResult.fileUrl; // Store accessible URL
        } catch (uploadError: any) {
          console.error('File upload error:', uploadError);
          return res.status(500).json({ error: 'File upload failed', details: uploadError.message });
        }
      }

      const submission = await SubmissionModel.create(
        team_exercise_id,
        req.user.userId,
        submission_type,
        content || null,
        filePath
      );

      // Add file URL to response
      const response = {
        ...submission,
        file_url: fileUrl,
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Create submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await SubmissionModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      res.json({ message: 'Submission deleted successfully' });
    } catch (error: any) {
      console.error('Delete submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export class GradesController {
  static async create(req: Request, res: Response) {
    try {
      const { submission_id, score, feedback } = req.body;

      if (!submission_id || score === undefined) {
        return res.status(400).json({ error: 'submission_id and score are required' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const grade = await GradeModel.createOrUpdate(
        submission_id,
        req.user.userId,
        score,
        feedback || null
      );

      // Update leaderboard after grading
      const submission = await SubmissionModel.findByIdWithDetails(submission_id);
      if (submission) {
        const exercise = await import('../models/Exercise').then(m => m.ExerciseModel.findById(submission.exercise_id));
        if (exercise) {
          await LeaderboardModel.updateLeaderboard(exercise.hackathon_id);
        }
      }

      res.status(201).json(grade);
    } catch (error: any) {
      console.error('Create grade error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBySubmission(req: Request, res: Response) {
    try {
      const { submission_id } = req.params;
      const grades = await GradeModel.findBySubmission(parseInt(submission_id));
      res.json(grades);
    } catch (error: any) {
      console.error('Get grades error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await GradeModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ error: 'Grade not found' });
      }

      res.json({ message: 'Grade deleted successfully' });
    } catch (error: any) {
      console.error('Delete grade error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export class LeaderboardController {
  static async get(req: Request, res: Response) {
    try {
      const { hackathon_id, detailed, podium } = req.query;

      if (!hackathon_id) {
        return res.status(400).json({ error: 'hackathon_id is required' });
      }

      if (podium === 'true') {
        const leaderboard = await LeaderboardModel.getTopTeams(
          parseInt(hackathon_id as string),
          3
        );
        return res.json(leaderboard);
      }

      if (detailed === 'true') {
        const leaderboard = await LeaderboardModel.getDetailedLeaderboard(
          parseInt(hackathon_id as string)
        );
        return res.json(leaderboard);
      }

      const leaderboard = await LeaderboardModel.getLeaderboard(
        parseInt(hackathon_id as string)
      );
      res.json(leaderboard);
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTeamRank(req: Request, res: Response) {
    try {
      const { team_id, hackathon_id } = req.query;

      if (!team_id || !hackathon_id) {
        return res.status(400).json({ error: 'team_id and hackathon_id are required' });
      }

      const rank = await LeaderboardModel.getTeamRank(
        parseInt(team_id as string),
        parseInt(hackathon_id as string)
      );

      if (!rank) {
        return res.status(404).json({ error: 'Team not found in leaderboard' });
      }

      res.json(rank);
    } catch (error: any) {
      console.error('Get team rank error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { hackathon_id } = req.body;

      if (!hackathon_id) {
        return res.status(400).json({ error: 'hackathon_id is required' });
      }

      await LeaderboardModel.updateLeaderboard(hackathon_id);
      const leaderboard = await LeaderboardModel.getLeaderboard(hackathon_id);

      res.json(leaderboard);
    } catch (error: any) {
      console.error('Refresh leaderboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
