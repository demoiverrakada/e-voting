const express = require('express');
const crypto = require('crypto');
const { Election, Candidate, Voter, WebVote } = require('../models');
const requireOrgToken = require('../middleware/requireOrgToken');
const { generateElectionId } = require('../lib/electionIdGenerator');
const { sendVoterInvite } = require('../lib/mailer');
const logger = require('../lib/logger');

const router = express.Router();

router.use(requireOrgToken);

// POST /api/elections - Create a new election
router.post('/api/elections', async (req, res) => {
  const { election_name, election_type, number_of_preferences } = req.body;

  if (!election_name || !election_type) {
    return res.status(400).send({ error: 'election_name and election_type are required' });
  }

  const validTypes = ['fptp', 'preferential', 'block'];
  if (!validTypes.includes(election_type)) {
    return res.status(400).send({ error: 'Invalid election_type' });
  }

  try {
    const election_id = await generateElectionId(req.org._id);
    const election = new Election({
      org_id: req.org._id,
      election_id,
      election_name,
      election_type,
      number_of_preferences: number_of_preferences || 1,
    });

    await election.save();
    res.status(201).send(election);
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

// GET /api/elections - List all elections for the organization
router.get('/api/elections', async (req, res) => {
  try {
    const elections = await Election.find({ org_id: req.org._id })
      .sort({ created_at: -1 })
      .select('election_id election_name election_type status total_voters created_at opened_at closed_at');

    res.send(elections);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// GET /api/elections/:election_id - Get details of a specific election
router.get('/api/elections/:election_id', async (req, res) => {
  try {
    const election = await Election.findOne({
      org_id: req.org._id,
      election_id: req.params.election_id,
    });

    if (!election) {
      return res.status(404).send({ error: 'Election not found' });
    }

    res.send(election);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// PATCH /api/elections/:election_id - Update a draft election
router.patch('/api/elections/:election_id', async (req, res) => {
  const { election_name, number_of_preferences } = req.body;

  try {
    const election = await Election.findOne({
      org_id: req.org._id,
      election_id: req.params.election_id,
    });

    if (!election) {
      return res.status(404).send({ error: 'Election not found' });
    }

    if (election.status !== 'draft') {
      return res.status(400).send({ error: 'Cannot edit an election that is already open or closed' });
    }

    if (election_name) election.election_name = election_name;
    if (number_of_preferences !== undefined) election.number_of_preferences = number_of_preferences;

    await election.save();
    res.send(election);
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

// --- CANDIDATE MANAGEMENT ---

// POST /api/elections/:election_id/candidates
router.post('/api/elections/:election_id/candidates', async (req, res) => {
  const { election_id } = req.params;
  const candidatesData = req.body;

  if (!Array.isArray(candidatesData)) {
    return res.status(400).send({ error: 'Body must be an array of candidates' });
  }

  try {
    const election = await Election.findOne({ org_id: req.org._id, election_id });
    if (!election) return res.status(404).send({ error: 'Election not found' });
    if (election.status !== 'draft') return res.status(400).send({ error: 'Can only add candidates to draft elections' });

    let addedCount = 0;
    for (const data of candidatesData) {
      if (!data.name || !data.entry_number || !data.cand_id) continue;

      await Candidate.findOneAndUpdate(
        { org_id: req.org._id, election_id, cand_id: data.cand_id },
        {
          org_id: req.org._id,
          election_id,
          election_name: election.election_name,
          election_type: election.election_type,
          number_of_preferences: election.number_of_preferences,
          name: data.name,
          entry_number: data.entry_number,
          cand_id: data.cand_id,
        },
        { upsert: true }
      );
      addedCount++;
    }

    res.send({ added: addedCount });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

// DELETE /api/elections/:election_id/candidates/:cand_id
router.delete('/api/elections/:election_id/candidates/:cand_id', async (req, res) => {
  const { election_id, cand_id } = req.params;

  try {
    const election = await Election.findOne({ org_id: req.org._id, election_id });
    if (!election) return res.status(404).send({ error: 'Election not found' });
    if (election.status !== 'draft') return res.status(400).send({ error: 'Can only delete candidates from draft elections' });

    const result = await Candidate.deleteOne({ org_id: req.org._id, election_id, cand_id });
    if (result.deletedCount === 0) return res.status(404).send({ error: 'Candidate not found' });

    res.send({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

// GET /api/elections/:election_id/candidates
router.get('/api/elections/:election_id/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find({ org_id: req.org._id, election_id: req.params.election_id })
      .sort({ entry_number: 1 });
    res.send(candidates);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// --- VOTER MANAGEMENT ---

// POST /api/elections/:election_id/voters
router.post('/api/elections/:election_id/voters', async (req, res) => {
  const { election_id } = req.params;
  const votersData = req.body;

  if (!Array.isArray(votersData)) {
    return res.status(400).send({ error: 'Body must be an array of voters' });
  }

  try {
    const election = await Election.findOne({ org_id: req.org._id, election_id });
    if (!election) return res.status(404).send({ error: 'Election not found' });
    if (election.status !== 'draft') return res.status(400).send({ error: 'Can only add voters to draft elections' });

    let addedCount = 0;
    const emailRegex = /^\S+@\S+\.\S+$/;

    for (const data of votersData) {
      if (!data.name || !data.voter_id || !data.email || !emailRegex.test(data.email)) continue;

      await Voter.findOneAndUpdate(
        { org_id: req.org._id, election_id, voter_id: data.voter_id },
        {
          org_id: req.org._id,
          election_id,
          name: data.name,
          voter_id: data.voter_id,
          email: data.email,
        },
        { upsert: true }
      );
      addedCount++;
    }

    const totalVoters = await Voter.countDocuments({ org_id: req.org._id, election_id });
    election.total_voters = totalVoters;
    await election.save();

    res.send({ added: addedCount, total_voters: totalVoters });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

// GET /api/elections/:election_id/voters
router.get('/api/elections/:election_id/voters', async (req, res) => {
  try {
    const voters = await Voter.find({ org_id: req.org._id, election_id: req.params.election_id });
    const maskedVoters = voters.map(v => ({
      name: v.name,
      voter_id: v.voter_id,
      email: v.email,
      vote: v.vote,
      token_id: v.token_id ? 'sent' : 'pending'
    }));
    res.send(maskedVoters);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// --- ELECTION STATUS MANAGEMENT ---

// POST /api/elections/:election_id/open
router.post('/api/elections/:election_id/open', async (req, res) => {
  const { election_id } = req.params;

  try {
    const election = await Election.findOne({ org_id: req.org._id, election_id });
    if (!election) return res.status(404).send({ error: 'Election not found' });
    if (election.status !== 'draft') return res.status(400).send({ error: 'Election must be in draft status' });

    const [candidateCount, voterCount] = await Promise.all([
      Candidate.countDocuments({ org_id: req.org._id, election_id }),
      Voter.countDocuments({ org_id: req.org._id, election_id })
    ]);

    if (candidateCount === 0 || voterCount === 0) {
      return res.status(400).send({ error: 'Election must have at least 1 candidate and 1 voter to open' });
    }

    const voters = await Voter.find({ org_id: req.org._id, election_id, token_id: "" });
    let invitesSent = 0;
    const failed = [];

    for (const voter of voters) {
      const token = crypto.randomUUID();
      voter.token_id = token;
      await voter.save();

      const voteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vote?token=${token}`;
      try {
        await sendVoterInvite(voter.email, voter.name, election.election_name, voteUrl);
        invitesSent++;
      } catch (err) {
        logger.error(`Failed to send invite to ${voter.email}`, err);
        failed.push(voter.email);
      }
    }

    election.status = 'open';
    election.opened_at = new Date();
    await election.save();

    res.send({ status: 'open', invites_sent: invitesSent, failed });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

// POST /api/elections/:election_id/close
router.post('/api/elections/:election_id/close', async (req, res) => {
  const { election_id } = req.params;

  try {
    const election = await Election.findOne({ org_id: req.org._id, election_id });
    if (!election) return res.status(404).send({ error: 'Election not found' });
    if (election.status !== 'open') return res.status(400).send({ error: 'Election must be open to close' });

    const votesCast = await WebVote.countDocuments({ org_id: req.org._id, election_id });

    election.status = 'closed';
    election.closed_at = new Date();
    await election.save();

    res.send({
      status: 'closed',
      final_voter_count: election.total_voters,
      votes_cast: votesCast
    });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
});

// GET /api/elections/:election_id/summary
router.get('/api/elections/:election_id/summary', async (req, res) => {
  const { election_id } = req.params;

  try {
    const [election, candidates, votesCast] = await Promise.all([
      Election.findOne({ org_id: req.org._id, election_id }),
      Candidate.find({ org_id: req.org._id, election_id }).sort({ entry_number: 1 }),
      WebVote.countDocuments({ org_id: req.org._id, election_id })
    ]);

    if (!election) return res.status(404).send({ error: 'Election not found' });

    const turnoutPercent = election.total_voters ? Math.round((votesCast / election.total_voters) * 10000) / 100 : 0;

    res.send({
      election,
      candidates,
      turnout: {
        total_voters: election.total_voters,
        votes_cast: votesCast,
        turnout_percent: turnoutPercent
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
