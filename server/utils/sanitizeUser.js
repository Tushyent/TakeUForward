/**
 * @file sanitizeUser.js
 * @description Strips internal/sensitive Mongoose fields before sending user data to clients.
 * Only explicitly whitelisted fields are included in the output.
 *
 * NEVER add googleId, pushSubscriptions, or any VAPID credential to this output.
 * Fields added here are visible to the authenticated user in their own session.
 */

/**
 * Returns a plain object containing only the fields the frontend should receive
 * for the currently authenticated user's own session (/api/auth/me, /api/auth/profile).
 *
 * @param {import('mongoose').Document} user - Mongoose User document
 * @returns {object} Sanitized user object safe for client consumption
 */
export function sanitizeUser(user) {
  const u = user.toObject ? user.toObject() : { ...user };

  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    username: u.username,
    handle: u.handle,
    role: u.role,
    dept: u.dept,
    year: u.year,
    graduationYear: u.graduationYear,
    currentCompany: u.currentCompany,
    previousCompany: u.previousCompany,
    higherEducation: u.higherEducation,
    isVerifiedAlumni: u.isVerifiedAlumni,
    isPlatformAdmin: u.isPlatformAdmin,
    isApproved: u.isApproved,
    clubId: u.clubId,
    bio: u.bio,
    about: u.about,
    interests: u.interests,
    skills: u.skills,
    experience: u.experience,
    projects: u.projects,
    whatsappNumber: u.whatsappNumber,
    socialLinks: u.socialLinks,
    profileVisibility: u.profileVisibility,
    isAnonymousDefault: u.isAnonymousDefault,
    reputation: u.reputation,
    defaultCommunityId: u.defaultCommunityId,
    weeklyDigestOptIn: u.weeklyDigestOptIn,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    // Explicitly excluded:
    // googleId      — OAuth provider ID, never needed by client
    // pushSubscriptions — VAPID write-only credentials
    // lastDigestSentAt  — internal operational metadata
    // __v               — Mongoose version key
  };
}
