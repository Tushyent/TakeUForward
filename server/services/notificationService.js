import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendNotificationEmail } from '../config/mailer.js';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// Configure web-push
// We use process.env here directly. VAPID keys must be set in Render environment.
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys not fully configured. Web push notifications will not work.');
}

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
        // Send email
        await sendNotificationEmail(user, type, refId, isAnonymousSender, content);

        // Send web push if configured and user has subscriptions
        if (process.env.VAPID_PUBLIC_KEY && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
          const payload = JSON.stringify({
            title: `New ${type} on TakeUForward`,
            body: isAnonymousSender ? `An anonymous user sent a ${type}.` : `Someone sent a ${type}.`,
            url: '/home'
          });

          // Send to all devices, filter out expired ones
          const validSubscriptions = [];
          for (const sub of user.pushSubscriptions) {
            try {
              await webpush.sendNotification(sub, payload);
              validSubscriptions.push(sub);
            } catch (err) {
              if (err.statusCode === 404 || err.statusCode === 410) {
                // Subscription expired, do nothing so it's removed
              } else {
                console.error('Error sending push notification:', err);
                validSubscriptions.push(sub); // Keep if it was a temporary error
              }
            }
          }

          if (validSubscriptions.length !== user.pushSubscriptions.length) {
            user.pushSubscriptions = validSubscriptions;
            await user.save();
          }
        }
      }
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
