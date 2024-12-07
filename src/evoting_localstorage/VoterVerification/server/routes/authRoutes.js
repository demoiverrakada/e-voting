const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { jwtkey } = require('../keys');
const router = express.Router();
// PO and votes model
const {Votes,Voter} = require('../models/User');
const multer = require('multer');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');
// for votes upload

router.use(cors());
// for uploading voter receipt
router.post('/votes', async (req, res) => {
  const { voter_id,commitments } = req.body;
  console.log(commitments);
  var comms=JSON.parse(commitments);
  console.log(comms)
  const password = comms.join('');
  console.log(password)
  const ballot_id = crypto.createHash('sha256').update(password, 'utf8').digest('hex');
  try {
    const checkVoter=Votes.findOne({voter_id:voter_id})
    if(!checkVoter)
    {
        res.status(422).send("You have not voted in the election");
    }
    else
    {
        res.send({"voter_id":voter_id,"ballot_id":ballot_id,"preference":checkVoter.preference})
        console.log("data sent successfully")
    }
  } 
  catch (err) {
    console.log("b")
    console.log(err.message)
    return res.status(422).send(err.message);
  }
});

// Example code snippet to check voter existence during login
router.post('/voters/check/', async (req, res) => {
  const {entryNum} = req.body;
  if (!entryNum) {
    return res.status(422).send({ error: "Must provide entryNum" });
  }
  try {
    const existingVoter = await Voter.findOne({ entryNum });
    if (!existingVoter) {
      return res.status(422).send({ error: "Voter not found" });
    }
    else if(existingVoter.vote)
    {
      return res.status(422).send({error: "Voter has already voted"})
    }
    res.send({ message: "Voter exists and verified successfully" });
  } catch (err) {
    console.error(err);
    return res.status(422).send({ error: "Error in voter verification" });
  }
});

module.exports = router;
