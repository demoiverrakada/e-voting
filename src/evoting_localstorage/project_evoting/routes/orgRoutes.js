const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Organization, OtpVerification } = require('../models');
const { jwtkey } = require('../keys');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, verifyOtpSchema } = require('../validators/organizationValidator');
const requireOrgToken = require('../middleware/requireOrgToken');
const { sendOtpEmail } = require('../lib/mailer');
const logger = require('../lib/logger');

const router = express.Router();

router.post('/org/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if org already exists
    const existing = await Organization.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const slugExists = await Organization.findOne({ slug });
    if (slugExists) return res.status(409).json({ error: 'Organisation name too similar to an existing one, please choose a different name' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Upsert pending registration (replace if email already has a pending one)
    await OtpVerification.findOneAndUpdate(
      { email },
      { email, name, slug, passwordHash, otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true, new: true }
    );

    // Send OTP email
    await sendOtpEmail(email, name, otp);

    logger.info('OTP sent for registration', { email });
    return res.json({ message: 'OTP sent to your email. Please verify to complete registration.' });
  } catch (err) {
    logger.error('register error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/org/verify-otp', validate(verifyOtpSchema), async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pending = await OtpVerification.findOne({ email });
    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found. Please register again.' });
    }

    // Check expiry
    if (pending.expiresAt < new Date()) {
      await OtpVerification.deleteOne({ email });
      return res.status(400).json({ error: 'OTP has expired. Please register again.' });
    }

    // Verify OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== pending.otpHash) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Create the organisation
    const org = new Organization({
      name: pending.name,
      slug: pending.slug,
      email: pending.email,
      passwordHash: pending.passwordHash,
      isVerified: true,
    });
    // Skip the pre-save bcrypt hook since we already have the hash
    org.$locals.skipHash = true;
    await org.save();

    // Clean up pending record
    await OtpVerification.deleteOne({ email });

    // Issue JWT
    const token = jwt.sign({ orgId: org._id }, jwtkey, { expiresIn: '7d' });

    logger.info('org registered via OTP', { orgId: org._id, email });
    return res.json({ token, org: { id: org._id, name: org.name, slug: org.slug, plan: org.plan } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    logger.error('verify-otp error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
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
