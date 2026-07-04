import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import './config/passport.js'; // initialize passport

import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import postRoutes from './routes/postRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/users', userRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
