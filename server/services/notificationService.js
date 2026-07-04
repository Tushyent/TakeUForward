import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendNotificationEmail } from '../config/mailer.js';

export const createNotification = async ({ userId, type, refId, isAnonymousSender, content }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      refId,
    });

    if (type === 'reply' || type === 'mention' || type === 'comment') {
      const user = await User.findById(userId);
      if (user) {
        await sendNotificationEmail(user, type, refId, isAnonymousSender, content);
      }
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
