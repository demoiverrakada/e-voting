const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const requireOrgToken = require('../middleware/requireOrgToken');
const { Organization } = require('../models');
const logger = require('../lib/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /billing/status — get current plan info
router.get('/status', requireOrgToken, async (req, res) => {
  try {
    const org = req.org;
    return res.json({
      plan: org.plan,
      elections_created: org.elections_created || 0,
      plan_activated_at: org.plan_activated_at || null,
    });
  } catch (err) {
    logger.error('billing status error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /billing/create-order — create a Razorpay order for upgrade
router.post('/create-order', requireOrgToken, async (req, res) => {
  try {
    const org = req.org;
    if (org.plan === 'paid') {
      return res.status(400).json({ error: 'Already on paid plan' });
    }

    const order = await razorpay.orders.create({
      amount: 99900, // ₹999 in paise
      currency: 'INR',
      receipt: `org_${org._id}_${Date.now()}`,
      notes: { org_id: org._id.toString(), org_name: org.name },
    });

    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      org_name: org.name,
      org_email: org.email,
    });
  } catch (err) {
    logger.error('create-order error', { err: err.message });
    return res.status(500).json({ error: 'Could not create payment order' });
  }
});

// POST /billing/verify — verify payment signature and upgrade plan
router.post('/verify', requireOrgToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment fields' });
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      logger.warn('payment signature mismatch', { org_id: req.org._id });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    await Organization.findByIdAndUpdate(req.org._id, {
      plan: 'paid',
      razorpay_payment_id,
      plan_activated_at: new Date(),
    });

    logger.info('plan upgraded to paid', { org_id: req.org._id, payment_id: razorpay_payment_id });
    return res.json({ success: true, plan: 'paid' });
  } catch (err) {
    logger.error('verify error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
