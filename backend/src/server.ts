import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';
import pool from './config/database';
import { initMinIO } from './config/minio';
import { initS3 } from './config/s3';
import { getStorageType } from './services/fileStorageService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', routes);

// Socket.io for real-time leaderboard updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-hackathon', (hackathonId: number) => {
    socket.join(`hackathon-${hackathonId}`);
    console.log(`Client ${socket.id} joined hackathon ${hackathonId}`);
  });

  socket.on('leave-hackathon', (hackathonId: number) => {
    socket.leave(`hackathon-${hackathonId}`);
    console.log(`Client ${socket.id} left hackathon ${hackathonId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in controllers
export const socketio = io;

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('✓ Database connected successfully');
});

// Initialize storage on startup (S3 or MinIO)
(async () => {
  const storageType = getStorageType();

  if (storageType === 's3') {
    try {
      await initS3();
      console.log('✓ AWS S3 initialized successfully');
    } catch (error) {
      console.warn('⚠ AWS S3 initialization failed. File uploads will use local storage.');
      console.warn('  To use S3, ensure AWS credentials are configured correctly.');
    }
  } else if (storageType === 'minio') {
    try {
      await initMinIO();
      console.log('✓ MinIO initialized successfully');
    } catch (error) {
      console.warn('⚠ MinIO initialization failed. File uploads will use local storage.');
      console.warn('  To use MinIO, ensure it is running and configured correctly.');
    }
  } else {
    console.log('ℹ Using local file storage');
  }
})();

// Start server
httpServer.listen(PORT, () => {
  const storageType = getStorageType();
  const storageLabel = storageType === 's3' ? 'AWS S3' : storageType === 'minio' ? 'MinIO' : 'Local';

  console.log('==============================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI Grading: ${process.env.AI_GRADING_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`📦 Storage: ${storageLabel}`);
  console.log('==============================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    pool.end();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    pool.end();
    console.log('Server closed');
    process.exit(0);
  });
});
