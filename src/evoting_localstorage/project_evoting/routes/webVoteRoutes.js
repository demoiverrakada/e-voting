const crypto = require('crypto');
const express = require('express');
const { Candidate, Keys, Voter, WebVote } = require('../models');
const requireOrgToken = require('../middleware/requireOrgToken');
const logger = require('../lib/logger');

const router = express.Router();

const HASH_PATTERN = /^[a-f0-9]{64}$/i;
const MAX_CIPHERTEXT_LENGTH = 20000;

function normalizeElectionType(type) {
  if (type === 'preferential') return 'preferential';
  if (type === 'block') return 'block';
  return 'fptp';
}

function safeCandidate(candidate) {
  return {
    cand_id: candidate.cand_id,
    name: candidate.name,
    entry_number: candidate.entry_number,
  };
}

async function getActiveVoterByToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  return Voter.findOne({ token_id: token, vote: false }).populate('org_id');
}

async function getElectionPayload(voter) {
  const candidates = await Candidate.find({
    org_id: voter.org_id._id || voter.org_id,
    election_id: voter.election_id,
  }).sort({ entry_number: 1, cand_id: 1 });

  if (!candidates.length) {
    return null;
  }

  const meta = candidates[0];
  const keys = await Keys.findOne({
    org_id: voter.org_id._id || voter.org_id,
    election_id: voter.election_id,
  }).select('elg_pk');

  return {
    voter: {
      name: voter.name,
      election_id: voter.election_id,
    },
    org: {
      name: voter.org_id.name,
    },
    election: {
      id: meta.election_id,
      name: meta.election_name,
      type: normalizeElectionType(meta.election_type),
      number_of_preferences: meta.number_of_preferences,
      public_key: keys ? keys.elg_pk : null,
    },
    candidates: candidates.map(safeCandidate),
  };
}

function validateEncryptedVotePayload(body) {
  const { encrypted_vote, selection_hash, client_receipt_nonce, ballot_type } = body;

  if (!encrypted_vote || typeof encrypted_vote !== 'object') {
    return 'encrypted_vote is required';
  }
  if (encrypted_vote.algorithm !== 'AES-GCM-256') {
    return 'encrypted_vote.algorithm must be AES-GCM-256';
  }
  if (!encrypted_vote.iv || typeof encrypted_vote.iv !== 'string') {
    return 'encrypted_vote.iv is required';
  }
  if (!encrypted_vote.ciphertext || typeof encrypted_vote.ciphertext !== 'string') {
    return 'encrypted_vote.ciphertext is required';
  }
  if (encrypted_vote.ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
    return 'encrypted_vote.ciphertext is too large';
  }
  if (!HASH_PATTERN.test(selection_hash || '')) {
    return 'selection_hash must be a SHA-256 hex digest';
  }
  if (!client_receipt_nonce || typeof client_receipt_nonce !== 'string') {
    return 'client_receipt_nonce is required';
  }
  if (!['fptp', 'preferential', 'block'].includes(ballot_type)) {
    return 'ballot_type is invalid';
  }

  return null;
}

router.get('/api/voter/session', async (req, res) => {
  try {
    const voter = await getActiveVoterByToken(req.query.token);

    if (!voter) {
      return res.status(401).send({ error: 'Invalid, expired, or already used token' });
    }

    const payload = await getElectionPayload(voter);
    if (!payload) {
      return res.status(404).send({ error: 'Election candidates not found' });
    }

    return res.send(payload);
  } catch (err) {
    logger.error('Error loading voter session', err);
    return res.status(500).send({ error: 'Internal server error' });
  }
});

router.post('/api/vote/submit', async (req, res) => {
  const { token } = req.body;
  const validationError = validateEncryptedVotePayload(req.body);

  if (!token || typeof token !== 'string') {
    return res.status(400).send({ error: 'token is required' });
  }
  if (validationError) {
    return res.status(400).send({ error: validationError });
  }

  try {
    const voter = await getActiveVoterByToken(token);
    if (!voter) {
      return res.status(401).send({ error: 'Invalid, expired, or already used token' });
    }

    const electionPayload = await getElectionPayload(voter);
    if (!electionPayload) {
      return res.status(404).send({ error: 'Election candidates not found' });
    }

    if (req.body.ballot_type !== electionPayload.election.type) {
      return res.status(400).send({ error: 'ballot_type does not match election type' });
    }

    const now = new Date();
    const receipt_id = crypto.randomUUID();
    const receipt_hash = crypto
      .createHash('sha256')
      .update(`${receipt_id}:${req.body.selection_hash}:${req.body.client_receipt_nonce}:${now.toISOString()}`)
      .digest('hex');

    await WebVote.create({
      org_id: voter.org_id._id || voter.org_id,
      election_id: voter.election_id,
      voter_id: voter.voter_id,
      encrypted_vote: {
        algorithm: req.body.encrypted_vote.algorithm,
        iv: req.body.encrypted_vote.iv,
        ciphertext: req.body.encrypted_vote.ciphertext,
        key_id: req.body.encrypted_vote.key_id || 'browser-local',
      },
      selection_hash: req.body.selection_hash,
      ballot_type: req.body.ballot_type,
      receipt_id,
      receipt_hash,
      client_receipt_nonce: req.body.client_receipt_nonce,
      submitted_at: now,
    });

    await Voter.updateOne(
      { _id: voter._id, vote: false },
      { $set: { vote: true, time_stamp: now } }
    );

    return res.status(201).send({
      receipt: {
        id: receipt_id,
        hash: receipt_hash,
        issued_at: now.toISOString(),
        election_id: voter.election_id,
        election_name: electionPayload.election.name,
      },
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).send({ error: 'Vote has already been submitted' });
    }

    logger.error('Error submitting web vote', err);
    return res.status(500).send({ error: 'Internal server error' });
  }
});

router.get('/api/web-votes/results', requireOrgToken, async (req, res) => {
  const election_id = Number(req.query.election_id);
  if (!election_id) {
    return res.status(400).send({ error: 'election_id is required' });
  }

  try {
    const org_id = req.org._id;
    const [candidate, totalVoters, submittedVotes, markedVoted] = await Promise.all([
      Candidate.findOne({ org_id, election_id }),
      Voter.countDocuments({ org_id, election_id }),
      WebVote.countDocuments({ org_id, election_id }),
      Voter.countDocuments({ org_id, election_id, vote: true }),
    ]);

    if (!candidate) {
      return res.status(404).send({ error: 'Election not found' });
    }

    return res.send({
      election_id,
      election_name: candidate.election_name,
      election_type: normalizeElectionType(candidate.election_type),
      total_voters: totalVoters,
      submitted_web_votes: submittedVotes,
      marked_voted: markedVoted,
      turnout_percent: totalVoters ? Math.round((submittedVotes / totalVoters) * 10000) / 100 : 0,
    });
  } catch (err) {
    logger.error('Error loading web vote results', err);
    return res.status(500).send({ error: 'Internal server error' });
  }
});

module.exports = router;
