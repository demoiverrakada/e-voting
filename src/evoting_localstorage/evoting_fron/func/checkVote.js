import RNFS from 'react-native-fs';
import crypto from 'crypto';
import React from 'react';
// Define the path to the JSON file to read from
const readFilePath = `data.json`;

const checkVote = async (commitments) => {
  try {
    // Read myData from the existing JSON file
    const fileContents = await RNFS.readFile(readFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    // Parse commitments and create hashedCommitments
    const comms = JSON.parse(commitments);
    const password = comms.join('');
    const ballot_id = crypto.createHash('sha256').update(password, 'utf8').digest('hex');

    // Find the existing vote
    const existingVote = myData.votes.find(vote => vote.ballot_id === ballot_id);
    if (!existingVote) {
      return { error: "You have not voted in the election" };
    } else {
      return {
        ballot_id: existingVote.ballot_id,
        preference: existingVote.preference,
        voter_id: existingVote.voter_id
      };
    }
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
};

export default checkVote;
