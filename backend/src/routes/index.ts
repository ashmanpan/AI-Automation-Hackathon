import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/authController';
import { UsersController } from '../controllers/usersController';
import { TeamsController } from '../controllers/teamsController';
import { HackathonsController } from '../controllers/hackathonsController';
import { ExercisesController } from '../controllers/exercisesController';
import { SubmissionsController, GradesController, LeaderboardController } from '../controllers/submissionsController';
import { AIGradingController } from '../controllers/aiGradingController';
import { StatsController } from '../controllers/statsController';
import { authenticateToken, requireAdmin, requireAdminOrJudge } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
// Use /tmp for serverless environments (AWS Lambda), uploads/ for local
const uploadDir = process.env.AWS_EXECUTION_ENV ? '/tmp' : 'uploads/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

// ==================== Auth Routes ====================
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticateToken, AuthController.me);
router.post('/auth/change-password', authenticateToken, AuthController.changePassword);

// ==================== Users Routes ====================
router.get('/users/count', authenticateToken, requireAdmin, UsersController.getCount);
router.get('/users/export', authenticateToken, requireAdmin, UsersController.exportToCSV);
router.get('/users', authenticateToken, requireAdminOrJudge, UsersController.getAll);
router.get('/users/:id', authenticateToken, UsersController.getById);
router.post('/users', authenticateToken, requireAdmin, UsersController.create);
router.post('/users/bulk', authenticateToken, requireAdmin, upload.single('file'), UsersController.bulkCreate);
router.post('/users/generate', authenticateToken, requireAdmin, UsersController.generateCredentials);
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, UsersController.resetPassword);
router.put('/users/:id', authenticateToken, requireAdmin, UsersController.update);
router.delete('/users/:id', authenticateToken, requireAdmin, UsersController.delete);

// ==================== Hackathons Routes ====================
router.get('/hackathons', authenticateToken, HackathonsController.getAll);
router.get('/hackathons/active', authenticateToken, HackathonsController.getActive);
router.get('/hackathons/:id', authenticateToken, HackathonsController.getById);
router.post('/hackathons', authenticateToken, requireAdmin, HackathonsController.create);
router.put('/hackathons/:id', authenticateToken, requireAdmin, HackathonsController.update);
router.patch('/hackathons/:id/status', authenticateToken, requireAdmin, HackathonsController.updateStatus);
router.delete('/hackathons/:id', authenticateToken, requireAdmin, HackathonsController.delete);

// ==================== Teams Routes ====================
router.get('/teams', authenticateToken, TeamsController.getAll);
router.get('/teams/my-team', authenticateToken, TeamsController.getMyTeam);
router.get('/teams/unassigned', authenticateToken, requireAdmin, TeamsController.getUnassignedParticipants);
router.get('/teams/:id', authenticateToken, TeamsController.getById);
router.get('/teams/:id/members', authenticateToken, TeamsController.getMembers);
router.post('/teams', authenticateToken, requireAdmin, TeamsController.create);
router.put('/teams/:id', authenticateToken, requireAdmin, TeamsController.update);
router.delete('/teams/:id', authenticateToken, requireAdmin, TeamsController.delete);
router.post('/teams/:id/members', authenticateToken, requireAdmin, TeamsController.addMember);
router.delete('/teams/:id/members/:userId', authenticateToken, requireAdmin, TeamsController.removeMember);

// ==================== Exercises Routes ====================
router.get('/exercises/debug/all', authenticateToken, requireAdmin, ExercisesController.getAllDebug);
router.get('/exercises', authenticateToken, ExercisesController.getAll);
router.get('/exercises/:id', authenticateToken, ExercisesController.getById);
router.post('/exercises', authenticateToken, requireAdmin, ExercisesController.create);
router.put('/exercises/:id', authenticateToken, requireAdmin, ExercisesController.update);
router.patch('/exercises/:id/status', authenticateToken, requireAdmin, ExercisesController.updateStatus);
router.delete('/exercises/:id', authenticateToken, requireAdmin, ExercisesController.delete);
router.post('/exercises/:id/assign', authenticateToken, requireAdmin, ExercisesController.assignToTeams);
router.post('/exercises/start', authenticateToken, ExercisesController.startExercise);

// ==================== Submissions Routes ====================
router.get('/submissions', authenticateToken, SubmissionsController.getAll);
router.get('/submissions/:id', authenticateToken, SubmissionsController.getById);
router.post('/submissions', authenticateToken, upload.single('file'), SubmissionsController.create);
router.delete('/submissions/:id', authenticateToken, requireAdmin, SubmissionsController.delete);

// ==================== Grades Routes ====================
router.post('/grades', authenticateToken, requireAdminOrJudge, GradesController.create);
router.get('/grades/submission/:submission_id', authenticateToken, GradesController.getBySubmission);
router.delete('/grades/:id', authenticateToken, requireAdminOrJudge, GradesController.delete);

// ==================== Leaderboard Routes ====================
router.get('/leaderboard', authenticateToken, LeaderboardController.get);
router.get('/leaderboard/team-rank', authenticateToken, LeaderboardController.getTeamRank);
router.post('/leaderboard/refresh', authenticateToken, requireAdmin, LeaderboardController.refresh);

// ==================== AI Grading Routes ====================
router.get('/ai-grading/status', authenticateToken, AIGradingController.checkAvailability);
router.post('/ai-grading/grade', authenticateToken, requireAdminOrJudge, AIGradingController.gradeSubmission);
router.post('/ai-grading/batch', authenticateToken, requireAdmin, AIGradingController.batchGrade);
router.post('/ai-grading/analyze', authenticateToken, requireAdminOrJudge, AIGradingController.analyzeCode);
router.post('/ai-grading/regrade', authenticateToken, requireAdminOrJudge, AIGradingController.regradeSubmission);
router.get('/ai-grading/stats', authenticateToken, requireAdminOrJudge, AIGradingController.getGradingStats);

// ==================== Stats Routes ====================
router.get('/stats/admin', authenticateToken, requireAdmin, StatsController.getAdminStats);
router.get('/stats/judge', authenticateToken, requireAdminOrJudge, StatsController.getJudgeStats);
router.get('/stats/participant', authenticateToken, StatsController.getParticipantStats);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Build version check - shows current deployment info
router.get('/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    commit: process.env.GIT_COMMIT || 'unknown',
    buildTime: process.env.BUILD_TIME || 'unknown',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
