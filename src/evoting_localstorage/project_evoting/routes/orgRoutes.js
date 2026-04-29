const express = require('express');
const jwt = require('jsonwebtoken');
const { Organization } = require('../models');
const { jwtkey } = require('../keys');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/organizationValidator');
const requireOrgToken = require('../middleware/requireOrgToken');

const router = express.Router();

router.post('/org/register', validate(registerSchema), async (req, res) => {
  const { name, slug, email, password } = req.body;

  try {
    const existingOrg = await Organization.findOne({
      $or: [{ email }, { slug }],
    });

    if (existingOrg) {
      return res.status(409).send({ error: 'Email or slug already exists' });
    }

    const org = new Organization({
      name,
      slug,
      email,
      passwordHash: password, // Pre-save hook will hash this
    });

    await org.save();

    const token = jwt.sign({ orgId: org._id, email: org.email }, jwtkey, {
      expiresIn: '7d',
    });

    res.send({
      token,
      org: {
        id: org._id,
        name: org.name,
        slug: org.slug,
        email: org.email,
        plan: org.plan,
      },
    });
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

router.post('/org/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const org = await Organization.findOne({ email });
    if (!org) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    const isMatch = await org.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ orgId: org._id, email: org.email }, jwtkey, {
      expiresIn: '7d',
    });

    res.send({
      token,
      org: {
        id: org._id,
        name: org.name,
        slug: org.slug,
        email: org.email,
        plan: org.plan,
      },
    });
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

router.get('/org/me', requireOrgToken, async (req, res) => {
  const org = req.org;
  res.send({
    id: org._id,
    name: org.name,
    slug: org.slug,
    email: org.email,
    plan: org.plan,
    createdAt: org.createdAt,
  });
});

module.exports = router;
