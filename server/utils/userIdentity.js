import { logger } from './logger.js';

// Read from environment for rotation without a code deploy.
// The embedded fallback maintains backward compatibility — set SYSTEM_ADMIN_EMAIL in production.
export const SYSTEM_ADMIN_EMAIL = (
  process.env.SYSTEM_ADMIN_EMAIL || 'takeuforwardssn@gmail.com'
).trim().toLowerCase();

if (process.env.NODE_ENV === 'production' && !process.env.SYSTEM_ADMIN_EMAIL) {
  logger.warn('SYSTEM_ADMIN_EMAIL env var not set. Using embedded default. Set it for easy rotation without redeploy.');
}

export const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

export const isSystemAdminEmail = (email) => normalizeEmail(email) === SYSTEM_ADMIN_EMAIL;

export const isSystemAdminUser = (user) => Boolean(user?.isPlatformAdmin && isSystemAdminEmail(user.email));

export const deriveHandleFromEmail = (email) => {
  if (isSystemAdminEmail(email)) return 'admin';

  const localPart = normalizeEmail(email).split('@')[0] || 'user';
  return localPart.replace(/[^a-z0-9]/g, '') || 'user';
};

export const buildUniqueHandle = async (User, email, existingUserId) => {
  const baseHandle = deriveHandleFromEmail(email);
  let handle = baseHandle;
  let counter = 1;

  const buildQuery = (candidate) => ({
    $or: [{ username: candidate }, { handle: candidate }],
    ...(existingUserId && { _id: { $ne: existingUserId } })
  });

  let collision = await User.findOne(buildQuery(handle));
  while (collision) {
    handle = `${baseHandle}${counter}`;
    counter += 1;
    collision = await User.findOne(buildQuery(handle));
  }

  return handle;
};

const buildUniqueHandleFromBase = async (User, baseHandle, existingUserId) => {
  let handle = baseHandle;
  let counter = 1;

  const buildQuery = (candidate) => ({
    $or: [{ username: candidate }, { handle: candidate }],
    ...(existingUserId && { _id: { $ne: existingUserId } })
  });

  let collision = await User.findOne(buildQuery(handle));
  while (collision) {
    handle = `${baseHandle}${counter}`;
    counter += 1;
    collision = await User.findOne(buildQuery(handle));
  }

  return handle;
};

const moveAdminHandleCollision = async (User, adminUserId) => {
  const collision = await User.findOne({
    $or: [{ username: 'admin' }, { handle: 'admin' }],
    ...(adminUserId && { _id: { $ne: adminUserId } })
  });

  if (!collision) return;

  const preferredHandle = deriveHandleFromEmail(collision.email) === 'admin'
    ? 'admin1'
    : deriveHandleFromEmail(collision.email);
  const replacementHandle = await buildUniqueHandleFromBase(User, preferredHandle, collision._id);
  collision.username = replacementHandle;
  collision.handle = replacementHandle;
  await collision.save();
};

export const syncUserIdentity = async (User, user) => {
  let changed = false;

  if (isSystemAdminEmail(user.email)) {
    await moveAdminHandleCollision(User, user._id);
    if (user.username !== 'admin') {
      user.username = 'admin';
      changed = true;
    }
    if (user.handle !== 'admin') {
      user.handle = 'admin';
      changed = true;
    }
    if (user.role !== 'platform_admin') {
      user.role = 'platform_admin';
      changed = true;
    }
    if (!user.isPlatformAdmin) {
      user.isPlatformAdmin = true;
      changed = true;
    }
    return changed;
  }

  const expectedHandle = await buildUniqueHandle(User, user.email, user._id);
  if (!user.username || !user.handle || user.username !== user.handle || user.handle !== expectedHandle) {
    user.username = expectedHandle;
    user.handle = expectedHandle;
    changed = true;
  }

  if (user.isPlatformAdmin) {
    user.isPlatformAdmin = false;
    changed = true;
  }

  if (user.role === 'platform_admin') {
    user.role = 'student';
    changed = true;
  }

  return changed;
};
