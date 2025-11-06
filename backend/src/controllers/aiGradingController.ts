import { Request, Response } from 'express';
import {
  gradeSubmission,
  gradeFileSubmission,
  batchGradeSubmissions,
  analyzeCode,
  isAIGradingAvailable,
  GradingCriteria,
} from '../services/aiGradingService';
import { SubmissionModel } from '../models/Submission';
import { ExerciseModel } from '../models/Exercise';
import { GradeModel } from '../models/Grade';
import { LeaderboardModel } from '../models/Leaderboard';
import { socketio } from '../server';

export class AIGradingController {
  /**
   * Check if AI grading is available
   */
  static async checkAvailability(req: Request, res: Response) {
    try {
      const available = isAIGradingAvailable();

      res.json({
        available,
        message: available
          ? 'AI grading is enabled and configured'
          : 'AI grading is not available. Check configuration.',
      });
    } catch (error: any) {
      console.error('Check availability error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Grade a submission using AI
   */
  static async gradeSubmission(req: Request, res: Response) {
    try {
      const { submission_id } = req.body;

      if (!submission_id) {
        return res.status(400).json({ error: 'submission_id is required' });
      }

      if (!isAIGradingAvailable()) {
        return res.status(503).json({ error: 'AI grading is not available' });
      }

      // Get submission with details
      const submission = await SubmissionModel.findByIdWithDetails(submission_id);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Get exercise details
      const exercise = await ExerciseModel.findById(submission.exercise_id);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      // Build grading criteria
      const criteria: GradingCriteria = {
        maxScore: exercise.max_score,
        exerciseTitle: exercise.title,
        exerciseDescription: exercise.description || '',
        exerciseType: exercise.type,
        rubric: exercise.rubric || undefined,
      };

      let gradingResult;

      // Grade based on submission type
      if (submission.submission_type === 'file' && submission.file_path) {
        // Grade file from MinIO/storage
        gradingResult = await gradeFileSubmission(submission.file_path, criteria);
      } else if (submission.content) {
        // Grade text/URL submission
        gradingResult = await gradeSubmission(submission.content, criteria);
      } else {
        return res.status(400).json({ error: 'No content available to grade' });
      }

      // Create grade record (as AI user)
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const grade = await GradeModel.createOrUpdate(
        submission_id,
        req.user.userId, // Judge/admin who initiated AI grading
        gradingResult.score,
        `AI Grading Result:\n\n${gradingResult.feedback}\n\nStrengths:\n- ${gradingResult.strengths.join('\n- ')}\n\nImprovements:\n- ${gradingResult.improvements.join('\n- ')}\n\nDetailed Analysis:\n${gradingResult.detailedAnalysis}\n\nConfidence: ${(gradingResult.confidence * 100).toFixed(1)}%`
      );

      // Update leaderboard
      await LeaderboardModel.updateLeaderboard(exercise.hackathon_id);

      // Broadcast leaderboard update via WebSocket
      const leaderboard = await LeaderboardModel.getLeaderboard(exercise.hackathon_id);
      socketio.to(`hackathon-${exercise.hackathon_id}`).emit('leaderboard-update', leaderboard);

      res.json({
        success: true,
        grade,
        aiResult: gradingResult,
      });
    } catch (error: any) {
      console.error('AI grading error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Batch grade multiple submissions for an exercise
   */
  static async batchGrade(req: Request, res: Response) {
    try {
      const { exercise_id } = req.body;

      if (!exercise_id) {
        return res.status(400).json({ error: 'exercise_id is required' });
      }

      if (!isAIGradingAvailable()) {
        return res.status(503).json({ error: 'AI grading is not available' });
      }

      // Get exercise
      const exercise = await ExerciseModel.findById(exercise_id);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      // Get all ungraded submissions for this exercise
      const submissions = await SubmissionModel.findUngraded(exercise.hackathon_id);

      // Filter for this specific exercise
      const exerciseSubmissions = submissions.filter(
        (s) => s.exercise_id === exercise_id
      );

      if (exerciseSubmissions.length === 0) {
        return res.json({
          success: true,
          message: 'No ungraded submissions found',
          graded: 0,
        });
      }

      const criteria: GradingCriteria = {
        maxScore: exercise.max_score,
        exerciseTitle: exercise.title,
        exerciseDescription: exercise.description || '',
        exerciseType: exercise.type,
        rubric: exercise.rubric || undefined,
      };

      const gradedCount = {
        success: 0,
        failed: 0,
      };

      // Grade each submission
      for (const submission of exerciseSubmissions) {
        try {
          let gradingResult;

          if (submission.submission_type === 'file' && submission.file_path) {
            gradingResult = await gradeFileSubmission(submission.file_path, criteria);
          } else if (submission.content) {
            gradingResult = await gradeSubmission(submission.content, criteria);
          } else {
            gradedCount.failed++;
            continue;
          }

          // Create grade
          await GradeModel.createOrUpdate(
            submission.id,
            req.user!.userId,
            gradingResult.score,
            `AI Batch Grading:\n\n${gradingResult.feedback}\n\nStrengths:\n- ${gradingResult.strengths.join('\n- ')}\n\nImprovements:\n- ${gradingResult.improvements.join('\n- ')}`
          );

          gradedCount.success++;

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to grade submission ${submission.id}:`, error);
          gradedCount.failed++;
        }
      }

      // Update leaderboard
      await LeaderboardModel.updateLeaderboard(exercise.hackathon_id);

      // Broadcast leaderboard update
      const leaderboard = await LeaderboardModel.getLeaderboard(exercise.hackathon_id);
      socketio.to(`hackathon-${exercise.hackathon_id}`).emit('leaderboard-update', leaderboard);

      res.json({
        success: true,
        total: exerciseSubmissions.length,
        graded: gradedCount.success,
        failed: gradedCount.failed,
      });
    } catch (error: any) {
      console.error('Batch grading error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Analyze code submission for issues
   */
  static async analyzeCode(req: Request, res: Response) {
    try {
      const { submission_id } = req.body;

      if (!submission_id) {
        return res.status(400).json({ error: 'submission_id is required' });
      }

      if (!isAIGradingAvailable()) {
        return res.status(503).json({ error: 'AI grading is not available' });
      }

      // Get submission
      const submission = await SubmissionModel.findByIdWithDetails(submission_id);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      if (!submission.content) {
        return res.status(400).json({ error: 'No code content to analyze' });
      }

      // Detect language from file extension or submission type
      let language = 'javascript';
      if (submission.file_path) {
        const ext = submission.file_path.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
          js: 'javascript',
          ts: 'typescript',
          py: 'python',
          java: 'java',
          cpp: 'c++',
          c: 'c',
          go: 'go',
          rs: 'rust',
          rb: 'ruby',
          php: 'php',
        };
        language = langMap[ext || ''] || 'javascript';
      }

      const analysis = await analyzeCode(submission.content, language);

      res.json({
        success: true,
        submission_id,
        language,
        analysis,
      });
    } catch (error: any) {
      console.error('Code analysis error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Re-grade submission (recalculate with AI)
   */
  static async regradeSubmission(req: Request, res: Response) {
    try {
      const { submission_id, criteria_override } = req.body;

      if (!submission_id) {
        return res.status(400).json({ error: 'submission_id is required' });
      }

      // Delete existing AI grades for this submission
      const existingGrades = await GradeModel.findBySubmission(submission_id);
      for (const grade of existingGrades) {
        await GradeModel.delete(grade.id);
      }

      // Re-grade using the standard grading endpoint logic
      req.body = { submission_id };
      return AIGradingController.gradeSubmission(req, res);
    } catch (error: any) {
      console.error('Re-grade error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get AI grading stats for a hackathon
   */
  static async getGradingStats(req: Request, res: Response) {
    try {
      const { hackathon_id } = req.query;

      if (!hackathon_id) {
        return res.status(400).json({ error: 'hackathon_id is required' });
      }

      const allSubmissions = await SubmissionModel.findByHackathon(
        parseInt(hackathon_id as string)
      );
      const ungradedSubmissions = await SubmissionModel.findUngraded(
        parseInt(hackathon_id as string)
      );

      res.json({
        total_submissions: allSubmissions.length,
        graded_submissions: allSubmissions.length - ungradedSubmissions.length,
        ungraded_submissions: ungradedSubmissions.length,
        ai_available: isAIGradingAvailable(),
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
