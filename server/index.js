import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import './config/passport.js'; // initialize passport

import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(passport.initialize());
// Note: session middleware (express-session) would be added here in a full implementation
// For MVP, if using JWT or session cookies, ensure proper setup before production.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

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
