const jwt = require('jsonwebtoken');
const { jwtkey } = require('../keys');
const { Organization } = require('../models');

const requireOrgToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).send({ error: 'You must be logged in.' });
  }

  const token = authorization.replace('Bearer ', '');
  
  try {
    const payload = jwt.verify(token, jwtkey);
    const { orgId } = payload;
    
    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(401).send({ error: 'Organization not found.' });
    }
    req.org = organization;
    next();
  } catch (err) {
    return res.status(401).send({ error: 'You must be logged in.' });
  }
};

module.exports = requireOrgToken;
