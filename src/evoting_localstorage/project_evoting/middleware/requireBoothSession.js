const { PollingBooth } = require('../models');
const logger = require('../lib/logger');

const requireBoothSession = async (req, res, next) => {
  try {
    const sessionToken = req.headers['x-booth-session'];
    if (!sessionToken) {
      return res.status(403).json({ error: 'No booth session. Votes must be cast from an active polling booth.' });
    }
    const booth = await PollingBooth.findOne({ session_token: sessionToken, is_active: true });
    if (!booth) {
      return res.status(403).json({ error: 'Invalid or inactive booth session.' });
    }
    req.booth = booth;
    next();
  } catch (err) {
    logger.error('requireBoothSession error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = requireBoothSession;
