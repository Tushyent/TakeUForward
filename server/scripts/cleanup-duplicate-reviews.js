import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward');
    logger.info('Connected to MongoDB');

    const duplicates = await Review.aggregate([
      {
        $group: {
          _id: { authorId: "$authorId", courseCode: "$courseCode", professorName: "$professorName" },
          count: { $sum: 1 },
          reviews: { $push: "$_id" },
          latestReviewId: { $last: "$_id" } // Assuming insertion order or default sort
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    let deletedCount = 0;
    for (const dup of duplicates) {
      logger.info(`Found duplicate for author ${dup._id.authorId}, course ${dup._id.courseCode}`);
      // Keep the latest one, delete the rest
      const idsToDelete = dup.reviews.filter(id => id.toString() !== dup.latestReviewId.toString());
      await Review.deleteMany({ _id: { $in: idsToDelete } });
      deletedCount += idsToDelete.length;
    }

    logger.info(`Cleanup complete. Deleted ${deletedCount} duplicate reviews.`);
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

run();
