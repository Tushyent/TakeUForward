import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import mongoose from 'mongoose';
import './config/passport.js'; // initialize passport

import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import postRoutes from './routes/postRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import userRoutes from './routes/userRoutes.js';
import alumniRoutes from './routes/alumniRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import mockInterviewRoutes from './routes/mockInterviewRoutes.js';
import interviewExperienceRoutes from './routes/interviewExperienceRoutes.js';
import teamRequestRoutes from './routes/teamRequestRoutes.js';
import electiveRoutes from './routes/electiveRoutes.js';
import careerRoadmapRoutes from './routes/careerRoadmapRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import privateFileRoutes from './routes/privateFileRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    }
  },
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/health',
  }
}));
// Trust proxy is required for secure cookies behind Render's load balancer
app.set('trust proxy', 1);

const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/+$/, '') : 'http://localhost:5173';

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      clientUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow any localhost:517x for Vite dev server port jumping
    if (/^http:\/\/(localhost|127\.0\.0\.1):517\d$/.test(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments for this project (e.g. *-tushyents-projects.vercel.app)
    if (/^https:\/\/takeuforward.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Safe in all browsers — cookie is first-party via Vercel reverse proxy in production
    httpOnly: true,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);

// Block unverified alumni from accessing any API except auth routes
import { requireApprovedUser } from './middleware/requireApprovedUser.js';
app.use('/api', requireApprovedUser);

app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/mock-interviews', mockInterviewRoutes);
app.use('/api/interview-experiences', interviewExperienceRoutes);
app.use('/api/team-requests', teamRequestRoutes);
app.use('/api/elective-suggestions', electiveRoutes);
app.use('/api/career-roadmaps', careerRoadmapRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/drive', privateFileRoutes);

// Error Handling
app.get('/', (req, res) => {
  res.send('TakeUForward API is running smoothly.');
});
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

// Connect to DB and start server
connectDB().then(() => {
  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  // Close HTTP server to stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  }

  // Close MongoDB connection
  try {
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during MongoDB shutdown');
    process.exit(1);
  }

  // Force shutdown if it takes longer than 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
