import express from 'express';
import rateLimit from 'express-rate-limit';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityLogger.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Rate limiting: 30 messages per 10 minutes per IP/User
export const chatCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: { message: 'Too many messages sent. Please wait 10 minutes.' } }
});

// GET /api/chats - List all chats for logged in user
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name handle dept role isVerifiedAlumni username')
      .sort({ updatedAt: -1 });
    
    res.status(200).json(chats);
  } catch (err) {
    logger.error('Error fetching chats:', err);
    next(err);
  }
});

// GET /api/chats/:userId - Get or create a 1:1 chat
router.get('/:userId', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ error: { message: 'Cannot chat with yourself' } });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: { message: 'User not found' } });

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, targetUserId] }
    })
      .populate('participants', 'name handle isVerifiedAlumni username')
      .populate('messages.senderId', 'name handle');

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, targetUserId],
        messages: []
      });
      chat = await chat.populate('participants', 'name handle dept role isVerifiedAlumni');
    }

    // Optional: Mark messages from other user as read
    let updated = false;
    chat.messages.forEach(msg => {
      if (!msg.readAt && msg.senderId._id.toString() !== req.user._id.toString()) {
        msg.readAt = new Date();
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (err) {
    logger.error('Error fetching chat:', err);
    next(err);
  }
});

// POST /api/chats/:userId/message - Send a message
router.post('/:userId/message', chatCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: { message: 'Message text is required' } });
    if (text.length > 2000) return res.status(400).json({ error: { message: 'Message text must be 2000 characters or fewer' } });

    const targetUserId = req.params.userId;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ error: { message: 'Cannot chat with yourself' } });
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, targetUserId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, targetUserId],
        messages: []
      });
    }

    chat.messages.push({
      senderId: req.user._id,
      text
    });

    // Short-term safety limit to prevent document size limit crash.
    // Trims the array to keep only the 1,000 most recent messages.
    if (chat.messages.length > 1000) {
      chat.messages = chat.messages.slice(-1000);
    }

    await chat.save();

    await logActivity({ action: 'send_message', resource: 'Chat', resourceId: chat._id, description: 'Sent a message', req });

    // Create in-app notification for the target user
    await createNotification({
      userId: targetUserId,
      type: 'message',
      refId: req.user._id,
      isAnonymousSender: false,
      content: text,
      targetPath: `/chat/${req.user._id}`,
      actorName: req.user.handle ? `@${req.user.handle}` : req.user.name,
      contextTitle: '1:1 chat',
      contextType: 'chat message'
    });

    // Populate just the new message sender info to return
    await chat.populate('messages.senderId', 'name handle');

    res.status(201).json(chat);
  } catch (err) {
    logger.error('Error sending message:', err);
    next(err);
  }
});

export default router;
