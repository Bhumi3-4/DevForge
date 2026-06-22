const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for a given user ID.
 * @param {string} userId - MongoDB _id of the authenticated user
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },        // Payload — keep it minimal
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = generateToken;