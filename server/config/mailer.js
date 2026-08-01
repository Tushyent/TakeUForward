import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import sendGridService, { SendGridError } from '../services/SendGridService.js';

dotenv.config();

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

const buildEmailFooter = () => `
<hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
<p style="font-size:13px;color:#777;line-height:1.5;margin:0 0 4px;">- Tushyent &amp; the TakeUForward Team</p>
<p style="font-size:13px;color:#777;margin:0 0 2px;"><a href="mailto:takeuforwardssn@gmail.com" style="color:#7C6AF7;text-decoration:none;">takeuforwardssn@gmail.com</a></p>
<p style="font-size:11px;color:#aaa;margin:12px 0 0;">If this email landed in your Spam folder, please mark it as "Not Spam" for future deliveries.</p>
<p style="font-size:11px;color:#aaa;margin:4px 0 0;">Received this in error? Report to <a href="mailto:takeuforwardssn@gmail.com" style="color:#7C6AF7;">takeuforwardssn@gmail.com</a></p>
`;

export const buildNotificationEmail = (user, type, isAnonymousSender, content = '', options = {}) => {
  const { targetPath = '/home', actorName, contextTitle, contextType } = options;

  const targetUrl = buildAbsoluteUrl(targetPath);
  const senderLabel = isAnonymousSender ? 'An anonymous user' : (actorName || 'Someone');
  const escapedSender = escapeHtml(senderLabel);
  const escapedRecipient = escapeHtml(user.name || user.email || 'there');
  const escapedContextType = escapeHtml(contextType || (type === 'message' ? 'chat message' : 'post'));
  const escapedContextTitle = contextTitle ? escapeHtml(contextTitle) : '';
  const escapedContent = content ? escapeHtml(content) : '';
  const htmlContent = escapedContent
    ? `<blockquote style="border-left:4px solid #7C6AF7;padding:10px 12px;color:#333;background:#f7f5ff;margin:12px 0;">${escapedContent}</blockquote>`
    : '';
  const contextLine = escapedContextTitle
    ? `<p style="margin:0 0 12px;color:#555;">Context: ${escapedContextType} in ${escapedContextTitle}</p>`
    : `<p style="margin:0 0 12px;color:#555;">Context: ${escapedContextType}</p>`;

  const footer = buildEmailFooter();

  if (type === 'mention') {
    return {
      subject: 'You were mentioned on TakeUForward',
      html: `<p>Hi ${escapedRecipient},</p><p>${escapedSender} mentioned you on TakeUForward.</p>${contextLine}${htmlContent}<p><a href="${targetUrl}" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">View it here</a></p><p style="color:#777;font-size:12px;">If the content was posted anonymously, TakeUForward does not reveal the author's identity.</p>${footer}`
    };
  }

  if (type === 'reply' || type === 'comment') {
    return {
      subject: 'New reply on TakeUForward',
      html: `<p>Hi ${escapedRecipient},</p><p>${escapedSender} replied to your post.</p>${contextLine}${htmlContent}<p><a href="${targetUrl}" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">View it here</a></p><p style="color:#777;font-size:12px;">Replies from anonymous users stay anonymous in this email and in the app.</p>${footer}`
    };
  }

  if (type === 'message') {
    return {
      subject: 'New message on TakeUForward',
      html: `<p>Hi ${escapedRecipient},</p><p>${escapedSender} sent you a message.</p>${contextLine}${htmlContent}<p><a href="${targetUrl}" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">Open the chat</a></p>${footer}`
    };
  }

  return null;
};

export const buildWelcomeEmailHtml = (name, memberCount) => {
  const safeName = escapeHtml(name || 'there');
  // const clientUrl = (process.env.CLIENT_URL || 'https://takeuforward-ssn.vercel.app').replace(/\/+$/, '');
  const clientUrl = (process.env.CLIENT_URL || 'https://takeuforward.blastorz.fun').replace(/\/+$/, '');
  return [
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">`,
    `<div style="text-align:center;padding:30px 0 24px;">`,
    `<h1 style="color:#7C6AF7;font-size:26px;margin:0 0 10px;">Welcome to TakeUForward!</h1>`,
    memberCount ? `<p style="color:#555;font-size:15px;margin:0;">You are our <strong style="color:#7C6AF7;">#${memberCount}</strong> member - share it with your peers!</p>` : '',
    `</div>`,
    `<p style="font-size:15px;color:#333;line-height:1.7;">Hi ${safeName},</p>`,
    `<p style="font-size:15px;color:#333;line-height:1.7;">College can feel overwhelming. There is always that nagging feeling - <em>Am I missing out on something? Is everyone else ahead of me? What should I even be doing right now?</em> We have all been there, wishing someone had told us earlier what actually matters, where to find resources, who to reach out to.</p>`,
    `<p style="font-size:15px;color:#333;line-height:1.7;"><strong>TakeUForward</strong> is here to close that gap. Built for SSN students, by SSN students, it is a single place to connect with seniors and alumni, access academic resources and placement insights that usually disappear after graduation, ask questions without hesitation, and stay in the loop - so you never have to say <em>"I wish I knew this sooner."</em></p>`,
    `<p style="font-size:15px;color:#333;line-height:1.7;">No more fragmented WhatsApp groups. No more losing years of senior knowledge overnight. No more relying on being in the right circle to get ahead.</p>`,
    `<div style="background:#f7f5ff;border-radius:12px;padding:18px 22px;margin:24px 0;">`,
    `<p style="font-size:14px;color:#444;margin:0 0 8px;"><strong>Here is what you can do here:</strong></p>`,
    `<table style="font-size:14px;color:#444;line-height:1.8;">`,
    `<tr><td style="padding:2px 12px 2px 0;color:#7C6AF7;font-weight:600;">\u2022</td><td style="padding:2px 0;">Ask questions anonymously - no fear of judgment</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;color:#7C6AF7;font-weight:600;">\u2022</td><td style="padding:2px 0;">Share notes, PYQs, and resources with your batch and department</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;color:#7C6AF7;font-weight:600;">\u2022</td><td style="padding:2px 0;">Find seniors and alumni for referrals and company guidance</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;color:#7C6AF7;font-weight:600;">\u2022</td><td style="padding:2px 0;">Discover club events, hackathons, and workshops in one feed</td></tr>`,
    `<tr><td style="padding:2px 12px 2px 0;color:#7C6AF7;font-weight:600;">\u2022</td><td style="padding:2px 0;">Join your batch and department communities</td></tr>`,
    `</table>`,
    `</div>`,
    `<div style="text-align:center;margin:28px 0;">`,
    `<a href="${clientUrl}/home" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:600;">Go to Your Dashboard</a>`,
    `</div>`,
    `<p style="font-size:14px;color:#555;line-height:1.6;">Have a thought, suggestion, or just want to talk? Reply to this email or drop your feedback in the <a href="${clientUrl}/support" style="color:#7C6AF7;">Support &amp; Feedback</a> section on the website - it all goes straight to us and helps make the platform better for everyone.</p>`,
    buildEmailFooter(),
    `</div>`
  ].filter(Boolean).join('\n');
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await sendGridService.sendWithRetry({ to, subject, html });
    logger.info({ emailId: result.id, to, subject }, 'sendEmail: delivered');
    return { success: true, emailId: result.id };
  } catch (err) {
    logger.error({
      to,
      subject,
      errMsg: err.message,
      errCode: err.code,
      errStatus: err.statusCode
    }, 'sendEmail: failed');
    throw err;
  }
};

export const sendWelcomeEmail = async (user, memberCount) => {
  if (!user?.email) {
    logger.warn('sendWelcomeEmail: user has no email, skipping');
    return;
  }

  const html = buildWelcomeEmailHtml(user.name || user.email, memberCount);
  const subject = memberCount
    ? `Welcome to TakeUForward - You're member #${memberCount}!`
    : 'Welcome to TakeUForward - Your Campus Community Awaits!';

  logger.info({ to: user.email, subject }, 'sendWelcomeEmail: sending welcome email');

  try {
    const result = await sendGridService.sendWithRetry({ to: user.email, subject, html });
    logger.info({ emailId: result.id, to: user.email }, 'sendWelcomeEmail: delivered');
    return { success: true, emailId: result.id };
  } catch (err) {
    logger.error({
      to: user.email,
      errMsg: err.message,
      errCode: err.code
    }, 'sendWelcomeEmail: failed');
  }
};

export const sendNotificationEmail = async (user, type, isAnonymousSender, content = '', options = {}) => {
  if (!user?.email) {
    logger.warn('sendNotificationEmail: user has no email, skipping');
    return;
  }

  const email = buildNotificationEmail(user, type, isAnonymousSender, content, options);
  if (!email) {
    return;
  }

  try {
    const result = await sendGridService.sendWithRetry({ to: user.email, subject: email.subject, html: email.html });
    logger.info({ emailId: result.id, to: user.email, type }, 'sendNotificationEmail: delivered');
    return { success: true, emailId: result.id };
  } catch (err) {
    logger.error({
      to: user.email,
      type,
      errMsg: err.message,
      errCode: err.code
    }, 'sendNotificationEmail: failed');
  }
};

export const sendDigestEmail = async (user, htmlContent) => {
  if (!user?.email) {
    logger.warn('sendDigestEmail: user has no email, skipping');
    return;
  }

  try {
    const result = await sendGridService.sendWithRetry({
      to: user.email,
      subject: 'Your Weekly TakeUForward Digest',
      html: htmlContent
    });
    logger.info({ emailId: result.id, to: user.email }, 'sendDigestEmail: delivered');
    return { success: true, emailId: result.id };
  } catch (err) {
    logger.error({
      to: user.email,
      errMsg: err.message,
      errCode: err.code
    }, 'sendDigestEmail: failed');
  }
};

export const verifyTransporter = async () => {
  try {
    const status = await sendGridService.verify();
    logger.info({ status }, 'verifyTransporter: result');
    return status;
  } catch (err) {
    logger.error({ errMsg: err.message }, 'verifyTransporter: unexpected error');
    return { configured: false, verified: false, message: err.message };
  }
};

export { SendGridError, buildEmailFooter };