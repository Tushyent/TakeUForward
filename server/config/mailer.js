import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendNotificationEmail = async (user, type, refId, isAnonymousSender, content = '') => {
  // Graceful fallback if SMTP isn't configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP variables not configured. Skipping email notification.');
    return;
  }

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  let subject = '';
  let text = '';
  let html = '';

  const senderLabel = isAnonymousSender ? 'An anonymous user' : 'Someone'; // We don't fetch the sender's actual name to ensure anonymity holds
  const displayContent = content ? `\n\n"${content}"\n\n` : ' ';
  const htmlContent = content ? `<blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #555; margin: 10px 0;">${content}</blockquote>` : '';

  if (type === 'mention') {
    subject = 'You were mentioned on TakeUForward';
    text = `${senderLabel} mentioned you in a post/comment:${displayContent}View it here: ${clientUrl}/home`;
    html = `<p>${senderLabel} mentioned you in a post/comment:</p>${htmlContent}<p><a href="${clientUrl}/home">View it here</a></p>`;
  } else if (type === 'reply' || type === 'comment') {
    subject = 'New reply on TakeUForward';
    text = `${senderLabel} replied to your post:${displayContent}View it here: ${clientUrl}/home`;
    html = `<p>${senderLabel} replied to your post:</p>${htmlContent}<p><a href="${clientUrl}/home">View it here</a></p>`;
  } else {
    // We explicitly do not send emails for other types.
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"TakeUForward" <noreply@takeuforward.com>',
      replyTo: 'noreply@takeuforward-ssn.com',
      to: user.email,
      subject,
      text,
      html,
    });
    console.log(`Notification email sent to ${user.email} (type: ${type})`);
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

export const sendDigestEmail = async (user, htmlContent) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"TakeUForward" <noreply@takeuforward.com>',
      to: user.email,
      subject: 'Your Weekly TakeUForward Digest',
      html: htmlContent
    });
  } catch (err) {
    console.error(`Error sending digest to ${user.email}:`, err);
  }
};
