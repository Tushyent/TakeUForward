import Community from '../models/Community.js';

/**
 * Finds a matching batch community for a given dept and year and returns its ID.
 * @param {string} dept 
 * @param {number|string} year 
 * @returns {Promise<ObjectId|null>}
 */
export const assignDefaultCommunity = async (dept, year) => {
  if (!dept || !year) return null;
  
  try {
    const communityName = `${dept}-${year}`.toUpperCase();
    const community = await Community.findOne({ name: communityName, type: 'batch' });
    return community ? community._id : null;
  } catch (err) {
    console.error('Error finding default community:', err);
    return null;
  }
};
