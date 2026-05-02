const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const requireOrgToken = require('../middleware/requireOrgToken');
const { PollingBooth, PollingOfficer, Election } = require('../models');
const logger = require('../lib/logger');

router.use(requireOrgToken);

// POST /api/officers — create a polling officer
router.post('/api/officers', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });

    const existing = await PollingOfficer.findOne({ org_id: req.org._id, email });
    if (existing) return res.status(409).json({ error: 'Officer with this email already exists' });

    const officer = new PollingOfficer({ org_id: req.org._id, name, email, passwordHash: password });
    await officer.save();

    logger.info('officer created', { officerId: officer._id, orgId: req.org._id });
    return res.status(201).json({ officer: { id: officer._id, name: officer.name, email: officer.email } });
  } catch (err) {
    logger.error('create officer error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/officers — list all officers for this org
router.get('/api/officers', async (req, res) => {
  try {
    const officers = await PollingOfficer.find({ org_id: req.org._id }).select('name email created_at');
    return res.json({ officers });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/officers/:officer_id
router.delete('/api/officers/:officer_id', async (req, res) => {
  try {
    const officer = await PollingOfficer.findOneAndDelete({ _id: req.params.officer_id, org_id: req.org._id });
    if (!officer) return res.status(404).json({ error: 'Officer not found' });
    return res.json({ message: 'Officer removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/elections/:election_id/booths — create a booth
router.post('/api/elections/:election_id/booths', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Booth name required' });

    const election = await Election.findOne({ org_id: req.org._id, election_id: req.params.election_id });
    if (!election) return res.status(404).json({ error: 'Election not found' });
    if (election.mode !== 'booth') return res.status(400).json({ error: 'Election is not a booth election' });
    if (election.status === 'closed') return res.status(400).json({ error: 'Election is closed' });

    const activation_code = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

    const booth = new PollingBooth({
      org_id: req.org._id,
      election_id: Number(req.params.election_id),
      name,
      activation_code,
    });
    await booth.save();

    logger.info('booth created', { boothId: booth._id, electionId: req.params.election_id });
    return res.status(201).json({
      booth: {
        id: booth._id,
        name: booth.name,
        activation_code: booth.activation_code,
        is_active: booth.is_active,
      },
    });
  } catch (err) {
    logger.error('create booth error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/elections/:election_id/booths
router.get('/api/elections/:election_id/booths', async (req, res) => {
  try {
    const booths = await PollingBooth.find({
      org_id: req.org._id,
      election_id: Number(req.params.election_id),
    }).populate('officer_id', 'name email');

    return res.json({
      booths: booths.map(b => ({
        id: b._id,
        name: b.name,
        activation_code: b.activation_code,
        is_active: b.is_active,
        votes_cast: b.votes_cast,
        officer: b.officer_id ? { name: b.officer_id.name, email: b.officer_id.email } : null,
        activated_at: b.activated_at,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/elections/:election_id/booths/:booth_id/deactivate — admin force-deactivate
router.post('/api/elections/:election_id/booths/:booth_id/deactivate', async (req, res) => {
  try {
    const booth = await PollingBooth.findOne({ _id: req.params.booth_id, org_id: req.org._id });
    if (!booth) return res.status(404).json({ error: 'Booth not found' });

    booth.is_active = false;
    booth.session_token = null;
    booth.deactivated_at = new Date();
    await booth.save();

    return res.json({ message: 'Booth deactivated' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
