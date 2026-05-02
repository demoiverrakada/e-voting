const jwt = require('jsonwebtoken');
const { PollingOfficer } = require('../models');
const { jwtkey } = require('../keys');
const logger = require('../lib/logger');

const requireOfficerToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Officer token required' });
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, jwtkey);
    const officer = await PollingOfficer.findById(payload.officerId);
    if (!officer) return res.status(401).json({ error: 'Officer not found' });
    req.officer = officer;
    next();
  } catch (err) {
    logger.warn('requireOfficerToken failed', { err: err.message });
    return res.status(401).json({ error: 'Invalid or expired officer token' });
  }
};

module.exports = requireOfficerToken;
