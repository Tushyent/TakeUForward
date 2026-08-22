import User from '../models/User.js';
import Post from '../models/Post.js';
import Resource from '../models/Resource.js';
import Community from '../models/Community.js';
import { sendDigestEmail } from '../config/mailer.js';
import { logger } from '../utils/logger.js';

export const generateAndSendWeeklyDigests = async () => {
  if (process.env.ENABLE_DIGEST !== 'true') {
    logger.info('Weekly digest is disabled (ENABLE_DIGEST != true) — skipping.');
    return { sentCount: 0, skippedCount: 0, errorCount: 0 };
  }

  try {
    const generalCommunity = await Community.findOne({ type: 'general' });
    const globalCommunityIds = generalCommunity ? [generalCommunity._id] : [];

    const users = await User.find({ weeklyDigestOptIn: { $ne: false } });

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Collect all relevant community IDs across all users (deduplicated)
    const allCommunityIds = new Set(globalCommunityIds);
    for (const user of users) {
      if (user.lastDigestSentAt && user.lastDigestSentAt > fiveDaysAgo) continue;
      if (user.defaultCommunityId) {
        allCommunityIds.add(user.defaultCommunityId.toString());
      }
    }
    const communityIds = [...new Set([...allCommunityIds].map(id => id.toString()))].map(
      id => globalCommunityIds.some(g => g.toString() === id)
        ? globalCommunityIds.find(g => g.toString() === id)
        : (users.find(u => u.defaultCommunityId?.toString() === id)?.defaultCommunityId)
    ).filter(Boolean);

    // Compute shared content pools ONCE
    const pipeline = [
      {
        $match: {
          isHidden: { $ne: true },
          communityId: { $in: communityIds },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $addFields: {
          upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
          commentCount: { $size: { $ifNull: ["$comments", []] } },
          ageHours: {
            $max: [
              1,
              { $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000] }
            ]
          }
        }
      },
      {
        $addFields: {
          hotScore: { $divide: [{ $add: ["$upvoteCount", "$commentCount"] }, "$ageHours"] }
        }
      },
      { $sort: { hotScore: -1, createdAt: -1 } },
      { $limit: 10 }
    ];

    const allTopPosts = await Post.aggregate(pipeline);

    const allNewResources = await Resource.find({
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    const allUpcomingEvents = await Post.find({
      isHidden: { $ne: true },
      communityId: { $in: communityIds },
      type: { $in: ['announcement', 'event'] },
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

    for (const user of users) {
      if (user.lastDigestSentAt && user.lastDigestSentAt > fiveDaysAgo) {
        skippedCount++;
        continue;
      }

      const relevantCommunityIds = [...globalCommunityIds];
      if (user.defaultCommunityId) {
        relevantCommunityIds.push(user.defaultCommunityId);
      }
      const relevantIdStrs = relevantCommunityIds.map(id => id.toString());

      // Filter shared pools to only this user's communities - in memory, no DB query
      const topPosts = allTopPosts
        .filter(p => relevantIdStrs.includes(p.communityId?.toString()))
        .slice(0, 5);

      const upcomingEvents = allUpcomingEvents
        .filter(e => relevantIdStrs.includes(e.communityId?.toString()))
        .slice(0, 5);

      const newResources = allNewResources.slice(0, 5);

      if (topPosts.length === 0 && newResources.length === 0 && upcomingEvents.length === 0) {
        skippedCount++;
        continue;
      }

      let html = `<h2>Your Weekly Digest on TakeUForward</h2>`;

      if (topPosts.length > 0) {
        html += `<h3>🔥 Top Posts in Your Communities</h3><ul>`;
        topPosts.forEach(p => {
          html += `<li><strong><a href="${clientUrl}/home">${p.content.substring(0, 60)}...</a></strong> (${Math.round(p.hotScore * 10) / 10} hot score)</li>`;
        });
        html += `</ul>`;
      }

      if (newResources.length > 0) {
        html += `<h3>📚 New Study Resources</h3><ul>`;
        newResources.forEach(r => {
          html += `<li><strong><a href="${clientUrl}/resources">${r.title}</a></strong> (${r.courseCode})</li>`;
        });
        html += `</ul>`;
      }

      if (upcomingEvents.length > 0) {
        html += `<h3>📅 Upcoming Events & Announcements</h3><ul>`;
        upcomingEvents.forEach(e => {
          html += `<li><strong><a href="${clientUrl}/home">${e.content.substring(0, 60)}...</a></strong></li>`;
        });
        html += `</ul>`;
      }

      html += `<p style="margin-top: 30px; font-size: 0.85em; color: #666;">
        You're receiving this because you opted into Weekly Digests.
        You can <a href="${clientUrl}/profile-settings">unsubscribe here</a>.
      </p>`;

      try {
        await sendDigestEmail(user, html);
        user.lastDigestSentAt = new Date();
        await user.save();
        sentCount++;
      } catch (err) {
        logger.error(`Failed to send digest to ${user.email}:`, err);
        errorCount++;
      }
    }

    return { sentCount, skippedCount, errorCount };

  } catch (error) {
    logger.error('Critical Error in Weekly Digest Run:', error);
    throw error;
  }
};