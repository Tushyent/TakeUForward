import User from '../models/User.js';
import Post from '../models/Post.js';
import Resource from '../models/Resource.js';
import Community from '../models/Community.js';
import { sendDigestEmail } from '../config/mailer.js';

export const generateAndSendWeeklyDigests = async () => {
  console.log('Starting Weekly Digest Generation...');
  try {
    const generalCommunity = await Community.findOne({ type: 'general' });
    const globalCommunityIds = generalCommunity ? [generalCommunity._id] : [];

    const users = await User.find({ weeklyDigestOptIn: { $ne: false } });
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const user of users) {
      // Prevent double-fires if already sent in the last 5 days (adds buffer for slight cron timing shifts)
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      if (user.lastDigestSentAt && user.lastDigestSentAt > fiveDaysAgo) {
        skippedCount++;
        continue;
      }

      const relevantCommunityIds = [...globalCommunityIds];
      if (user.defaultCommunityId) {
        relevantCommunityIds.push(user.defaultCommunityId);
      }

      // Hot Score pipeline for Top Posts
      const pipeline = [
        { $match: { 
            isHidden: { $ne: true },
            communityId: { $in: relevantCommunityIds },
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
                { $divide: [ { $subtract: [ new Date(), "$createdAt" ] }, 3600000 ] }
              ]
            }
          }
        },
        {
          $addFields: {
            hotScore: { $divide: [ { $add: ["$upvoteCount", "$commentCount"] }, "$ageHours" ] }
          }
        },
        { $sort: { hotScore: -1, createdAt: -1 } },
        { $limit: 5 }
      ];

      const topPosts = await Post.aggregate(pipeline);

      const newResources = await Resource.find({
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }).limit(5);

      const upcomingEvents = await Post.find({
        isHidden: { $ne: true },
        communityId: { $in: relevantCommunityIds },
        type: { $in: ['announcement', 'event'] },
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }).limit(5);

      // Skip if 0 relevant content
      if (topPosts.length === 0 && newResources.length === 0 && upcomingEvents.length === 0) {
        skippedCount++;
        continue;
      }

      // Compose HTML Email
      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
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
        console.error(`Failed to send digest to ${user.email}:`, err);
        errorCount++;
      }
    }

    console.log(`Weekly Digest Run Complete. Sent: ${sentCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    return { sentCount, skippedCount, errorCount };

  } catch (error) {
    console.error('Critical Error in Weekly Digest Run:', error);
    throw error;
  }
};
