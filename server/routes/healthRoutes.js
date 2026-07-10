import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const dbStatus = isConnected ? 'connected' : 'disconnected';
  const statusCode = isConnected ? 200 : 503;
  
  res.status(statusCode).json({
    status: isConnected ? 'ok' : 'error',
    db: dbStatus
  });
});

export default router;
