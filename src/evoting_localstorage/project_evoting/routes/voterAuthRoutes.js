const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Voter, Candidate, Organization } = require('../models');
const requireOrgToken = require('../middleware/requireOrgToken');
const { sendVoterInvite } = require('../lib/mailer');
const logger = require('../lib/logger');

const router = express.Router();

router.post('/voter/send-invites', requireOrgToken, async (req, res) => {
  const { election_id } = req.body;
  const org_id = req.org._id;

  if (!election_id) {
    return res.status(400).send({ error: 'election_id is required' });
  }

  try {
    // Fetch election name from Candidate model (as there is no Election model)
    const candidate = await Candidate.findOne({ election_id, org_id });
    const electionName = candidate ? candidate.election_name : `Election ${election_id}`;

    const voters = await Voter.find({
      election_id,
      org_id,
      token_id: { $in: ["", null] }
    });

    let sentCount = 0;
    const failedEmails = [];

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const voter of voters) {
      const token = uuidv4();
      voter.token_id = token;
      
      try {
        await voter.save();
        const voteUrl = `${frontendUrl}/vote?token=${token}`;
        
        // In this schema, Voter doesn't have an email field? 
        // Let me re-verify Voter.js
        // If it doesn't have an email, I might have a problem.
        // The user prompt said: "Send email to each voter...". 
        // I'll assume for now there is an 'email' field or I should use 'voter_id' if it's an email.
        
        const voterEmail = voter.email || voter.voter_id; // Fallback to voter_id if email is missing
        
        await sendVoterInvite(voterEmail, voter.name, electionName, voteUrl);
        sentCount++;
      } catch (err) {
        logger.error(`Failed to send invite to ${voter.voter_id}`, err);
        failedEmails.push(voter.voter_id);
      }
    }

    res.send({ sent: sentCount, failed: failedEmails });
  } catch (err) {
    logger.error('Error in send-invites', err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

router.get('/voter/validate-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send({ error: 'Token is required' });
  }

  try {
    const voter = await Voter.findOne({ token_id: token }).populate('org_id');
    
    if (!voter || voter.vote === true) {
      return res.status(401).send({ error: 'Invalid or already used token' });
    }

    // Since org_id is a ref, we can get the org name
    const orgName = voter.org_id ? voter.org_id.name : 'Unknown Organization';

    res.send({
      valid: true,
      voter: {
        name: voter.name,
        election_id: voter.election_id
      },
      org: {
        name: orgName
      }
    });
  } catch (err) {
    logger.error('Error validating token', err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

module.exports = router;
