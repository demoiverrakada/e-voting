const jwt = require('jsonwebtoken');
const { jwtkey } = require('../keys');
const { Organization } = require('../models');

const requireOrgToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).send({ error: 'You must be logged in.' });
  }

  const token = authorization.replace('Bearer ', '');
  jwt.verify(token, jwtkey, async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: 'You must be logged in.' });
    }

    const { orgId } = payload;
    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        return res.status(401).send({ error: 'Organization not found.' });
      }
      req.org = organization;
      next();
    } catch (err) {
      return res.status(401).send({ error: 'You must be logged in.' });
    }
  });
};

module.exports = requireOrgToken;
