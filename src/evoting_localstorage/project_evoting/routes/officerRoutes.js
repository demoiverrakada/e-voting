const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PollingOfficer, PollingBooth, Voter, Election } = require('../models');
const requireOfficerToken = require('../middleware/requireOfficerToken');
const { jwtkey } = require('../keys');
const logger = require('../lib/logger');
const { v4: uuidv4 } = require('uuid');

// POST /officer/login
router.post('/officer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const officer = await PollingOfficer.findOne({ email });
    if (!officer) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await officer.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ officerId: officer._id, orgId: officer.org_id }, jwtkey, { expiresIn: '12h' });
    logger.info('officer login', { officerId: officer._id });
    return res.json({ token, officer: { id: officer._id, name: officer.name, email: officer.email } });
  } catch (err) {
    logger.error('officer login error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /officer/booth/activate  — officer activates a booth using activation code
router.post('/officer/booth/activate', requireOfficerToken, async (req, res) => {
  try {
    const { activation_code } = req.body;
    if (!activation_code) return res.status(400).json({ error: 'activation_code required' });

    const booth = await PollingBooth.findOne({ activation_code, org_id: req.officer.org_id });
    if (!booth) return res.status(404).json({ error: 'Booth not found or does not belong to your organisation' });
    if (booth.is_active) return res.status(400).json({ error: 'Booth is already active' });

    // Check election exists and is open
    const election = await Election.findOne({ org_id: req.officer.org_id, election_id: booth.election_id });
    if (!election) return res.status(404).json({ error: 'Election not found' });
    if (election.status !== 'open') return res.status(400).json({ error: 'Election is not open' });
    if (election.mode !== 'booth') return res.status(400).json({ error: 'Election is not a booth election' });

    const session_token = uuidv4();
    booth.is_active = true;
    booth.officer_id = req.officer._id;
    booth.session_token = session_token;
    booth.activated_at = new Date();
    booth.deactivated_at = null;
    await booth.save();

    logger.info('booth activated', { boothId: booth._id, officerId: req.officer._id });
    return res.json({ session_token, booth: { id: booth._id, name: booth.name, election_id: booth.election_id } });
  } catch (err) {
    logger.error('booth activate error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /officer/booth/deactivate
router.post('/officer/booth/deactivate', requireOfficerToken, async (req, res) => {
  try {
    const booth = await PollingBooth.findOne({ officer_id: req.officer._id, is_active: true });
    if (!booth) return res.status(404).json({ error: 'No active booth found for this officer' });

    booth.is_active = false;
    booth.session_token = null;
    booth.deactivated_at = new Date();
    await booth.save();

    logger.info('booth deactivated', { boothId: booth._id });
    return res.json({ message: 'Booth deactivated successfully' });
  } catch (err) {
    logger.error('booth deactivate error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /officer/booth/session — check current session status
router.get('/officer/booth/session', requireOfficerToken, async (req, res) => {
  try {
    const booth = await PollingBooth.findOne({ officer_id: req.officer._id, is_active: true });
    if (!booth) return res.json({ active: false });

    const election = await Election.findOne({ org_id: req.officer.org_id, election_id: booth.election_id });
    return res.json({
      active: true,
      session_token: booth.session_token,
      booth: { id: booth._id, name: booth.name },
      election: { election_id: election.election_id, election_name: election.election_name, status: election.status },
    });
  } catch (err) {
    logger.error('booth session check error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /officer/voters — list voters for the active booth's election
router.get('/officer/voters', requireOfficerToken, async (req, res) => {
  try {
    const booth = await PollingBooth.findOne({ officer_id: req.officer._id, is_active: true });
    if (!booth) return res.status(400).json({ error: 'No active booth. Please activate a booth first.' });

    const { search } = req.query;
    const query = { org_id: req.officer.org_id, election_id: booth.election_id };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { voter_id: { $regex: search, $options: 'i' } },
      ];
    }

    const voters = await Voter.find(query)
      .select('voter_id name vote verified_at')
      .sort({ name: 1 });

    return res.json({ voters });
  } catch (err) {
    logger.error('officer voters list error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /officer/voters/:voter_id/verify — verify voter identity and issue token
router.post('/officer/voters/:voter_id/verify', requireOfficerToken, async (req, res) => {
  try {
    const booth = await PollingBooth.findOne({ officer_id: req.officer._id, is_active: true });
    if (!booth) return res.status(400).json({ error: 'No active booth' });

    const voter = await Voter.findOne({
      org_id: req.officer.org_id,
      election_id: booth.election_id,
      voter_id: req.params.voter_id,
    });
    if (!voter) return res.status(404).json({ error: 'Voter not found' });
    if (voter.vote) return res.status(409).json({ error: 'Voter has already voted' });
    if (voter.token_id) return res.status(409).json({ error: 'Token already issued for this voter' });

    // Issue a one-time token
    const token = uuidv4();
    voter.token_id = token;
    voter.verified_at = new Date();
    await voter.save();

    logger.info('voter verified and token issued', {
      voterId: voter.voter_id,
      boothId: booth._id,
      officerId: req.officer._id,
    });

    return res.json({
      token,
      voter: { voter_id: voter.voter_id, voter_name: voter.name },
      message: 'Token issued. Show this to the voter.',
    });
  } catch (err) {
    logger.error('voter verify error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
