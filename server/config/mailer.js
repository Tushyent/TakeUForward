import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,    // 10s to establish TCP connection
  greetingTimeout: 10000,      // 10s to receive SMTP greeting
  socketTimeout: 15000,        // 15s for send/receive
});

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildAbsoluteUrl = (targetPath = '/home') => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const safePath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  return `${clientUrl}${safePath}`;
};

export const buildNotificationEmail = (user, type, isAnonymousSender, content = '', options = {}) => {
  const {
    targetPath = '/home',
    actorName,
    contextTitle,
    contextType
  } = options;

  const targetUrl = buildAbsoluteUrl(targetPath);
  const senderLabel = isAnonymousSender ? 'An anonymous user' : (actorName || 'Someone');
  const escapedSender = escapeHtml(senderLabel);
  const escapedRecipient = escapeHtml(user.name || user.email || 'there');
  const escapedContextType = escapeHtml(contextType || (type === 'message' ? 'chat message' : 'post'));
  const escapedContextTitle = contextTitle ? escapeHtml(contextTitle) : '';
  const escapedContent = content ? escapeHtml(content) : '';
  const textContent = content ? `\n\n"${content}"\n\n` : '\n\n';
  const htmlContent = escapedContent
    ? `<blockquote style="border-left:4px solid #7C6AF7;padding:10px 12px;color:#333;background:#f7f5ff;margin:12px 0;">${escapedContent}</blockquote>`
    : '';
  const contextLine = escapedContextTitle
    ? `<p style="margin:0 0 12px;color:#555;">Context: ${escapedContextType} in ${escapedContextTitle}</p>`
    : `<p style="margin:0 0 12px;color:#555;">Context: ${escapedContextType}</p>`;
  const textContextLine = contextTitle
    ? `Context: ${contextType || 'post'} in ${contextTitle}\n`
    : `Context: ${contextType || (type === 'message' ? 'chat message' : 'post')}\n`;

  if (type === 'mention') {
    return {
      subject: 'You were mentioned on TakeUForward',
      text: `Hi ${user.name || user.email || 'there'},\n\n${senderLabel} mentioned you on TakeUForward.\n${textContextLine}${textContent}View it here: ${targetUrl}`,
      html: `<p>Hi ${escapedRecipient},</p><p>${escapedSender} mentioned you on TakeUForward.</p>${contextLine}${htmlContent}<p><a href="${targetUrl}" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">View it here</a></p><p style="color:#777;font-size:12px;">If the content was posted anonymously, TakeUForward does not reveal the author's identity.</p>`
    };
  }

  if (type === 'reply' || type === 'comment') {
    return {
      subject: 'New reply on TakeUForward',
      text: `Hi ${user.name || user.email || 'there'},\n\n${senderLabel} replied to your post.\n${textContextLine}${textContent}View it here: ${targetUrl}`,
      html: `<p>Hi ${escapedRecipient},</p><p>${escapedSender} replied to your post.</p>${contextLine}${htmlContent}<p><a href="${targetUrl}" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">View it here</a></p><p style="color:#777;font-size:12px;">Replies from anonymous users stay anonymous in this email and in the app.</p>`
    };
  }

  if (type === 'message') {
    return {
      subject: 'New message on TakeUForward',
      text: `Hi ${user.name || user.email || 'there'},\n\n${senderLabel} sent you a message.\n${textContextLine}${textContent}Open the chat: ${targetUrl}`,
      html: `<p>Hi ${escapedRecipient},</p><p>${escapedSender} sent you a message.</p>${contextLine}${htmlContent}<p><a href="${targetUrl}" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">Open the chat</a></p>`
    };
  }

  return null;
};

export const sendNotificationEmail = async (user, type, isAnonymousSender, content = '', options = {}) => {
  // Graceful fallback if SMTP isn't configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP variables not configured. Skipping email notification.');
    return;
  }

  const email = buildNotificationEmail(user, type, isAnonymousSender, content, options);
  if (!email) {
    // We explicitly do not send emails for other types.
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"TakeUForward SSN" <takeuforwardssn@gmail.com>',
      replyTo: process.env.REPLY_TO_EMAIL || 'takeuforwardssn@gmail.com',
      to: user.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  } catch (err) {
    logger.error({ to: user.email, errMsg: err.message, errCode: err.code }, 'Error sending notification email');
  }
};

export const sendDigestEmail = async (user, htmlContent) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"TakeUForward SSN" <takeuforwardssn@gmail.com>',
      to: user.email,
      subject: 'Your Weekly TakeUForward Digest',
      html: htmlContent
    });
  } catch (err) {
    logger.error({ to: user.email, errMsg: err.message, errCode: err.code }, 'Error sending digest email');
  }
};

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP variables not configured. Skipping email send.', { to, subject });
    return;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"TakeUForward SSN" <takeuforwardssn@gmail.com>',
      to,
      subject,
      html
    });
  } catch (err) {
    logger.error({ to, subject, errMsg: err.message, errCode: err.code, errCommand: err.command }, 'Error sending email');
  }
};

export const buildWelcomeEmailHtml = (name, memberCount) => {
  const safeName = escapeHtml(name || 'there');
  const clientUrl = (process.env.CLIENT_URL || 'https://takeuforward-ssn.vercel.app').replace(/\/+$/, '');
  return [
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">`,
    `<h1 style="color:#7C6AF7;">Welcome to TakeUForward!</h1>`,
    `<p>Hi ${safeName},</p>`,
    memberCount ? `<p>You are our <strong>#${memberCount}</strong>th member — share it with your peers!</p>` : '',
    `<p>Welcome to <strong>TakeUForward</strong> — the single place a student needs to survive and thrive in college. We built this platform right here at SSN to connect juniors with seniors and alumni for mentorship, centralize academic and placement knowledge that would otherwise be lost year after year, and create an anonymous-safe space for honest questions.</p>`,
    `<p>It means no more fragmented WhatsApp groups, no more losing senior knowledge the day they graduate, and no more having to rely on being in the 'right' group to get ahead.</p>`,
    `<p><strong>Here is what you can do here:</strong></p>`,
    `<ul>`,
    `<li>Ask questions anonymously — no fear of judgment</li>`,
    `<li>Share notes, PYQs, and resources with your batch and department</li>`,
    `<li>Find seniors and alumni for referrals and company-specific guidance</li>`,
    `<li>Discover club events, hackathons, and workshops in one feed</li>`,
    `<li>Join your batch and department communities</li>`,
    `</ul>`,
    `<p>Everything is organized by community — your batch, your department, or topic-based spaces. You can also find clubs and teams looking for members.</p>`,
    `<p>Your journey starts here:</p>`,
    `<a href="${clientUrl}/home" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Go to Your Dashboard</a>`,
    `<p style="margin-top:24px;color:#777;font-size:12px;">Have questions? Drop them in the General community or any batch community. Your seniors and alumni are here to help.</p>`,
    `<p style="color:#777;font-size:12px;">— The TakeUForward Team</p>`,
    `</div>`
  ].filter(Boolean).join('\n');
};

export const sendWelcomeEmail = async (user, memberCount) => {
  if (!user.email) return;
  const html = buildWelcomeEmailHtml(user.name || user.email, memberCount);
  await sendEmail({
    to: user.email,
    subject: memberCount
      ? `Welcome to TakeUForward — You're member #${memberCount}!`
      : 'Welcome to TakeUForward — Your Campus Community Awaits!',
    html,
  });
};

export const verifyTransporter = async () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { configured: false, message: 'SMTP env vars not set' };
  }
  try {
    await transporter.verify();
    return { configured: true, verified: true };
  } catch (err) {
    return { configured: true, verified: false, message: err.message };
  }
};
