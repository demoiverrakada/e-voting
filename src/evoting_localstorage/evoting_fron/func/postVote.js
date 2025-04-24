import RNFS from 'react-native-fs';
import { sha256 } from 'react-native-sha256';
import React from 'react';
import { Alert } from 'react-native';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;
const readFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

const postVote = async (preference, commitments, booth_num, election_id) => {
  try {
    //Alert.alert('Booth Number', `The booth number is: ${booth_num}`);
    const timestamp = new Date().toISOString(); // Generate timestamp

    const fileContents = await RNFS.readFile(readFilePath, 'utf8');

    let myData;
    try {
      myData = JSON.parse(fileContents);
    } catch (parseError) {
      return { error: 'Error parsing JSON file' };
    }

    let comms2;
    try {
      const cleanedString = commitments.slice(1, -1);
      comms2 = cleanedString.split("', '");
    } catch (parseError) {
      Alert.alert("Error", `Error parsing commitments: ${parseError.message}`);
      return { error: 'Error parsing commitments' };
    }

    const cleanedString = commitments.slice(1, -1);
    const comms = cleanedString.split("', '");
    let password = comms.join('').replace(/[,'"]/g, '');
    
    let hashedCommitments;
    const countQuotes = (str) => {
      const quotes = str.match(/['"]/g);
      return quotes ? quotes.length : 0;
    };
    
    const n = countQuotes(commitments);
    const k = n / 2;
    const l = password.length;
    const t = l / k;

    let existingReceiptIndex = -1;
    let ballot_id;
    for (let i = 0; i < k; i++) {
      const s1 = password.slice(0, t);
      const s2 = password.slice(t, l);
      const result = s2 + s1;
      password = result;
      const hashResult = await sha256(result);
      hashedCommitments = hashResult;
      ballot_id = hashedCommitments;
      const index = myData.receipt.findIndex(receipt => receipt.ballot_id === hashResult);
      if (index !== -1) {
        existingReceiptIndex = index;
        break;
      }
    }

    const num = Number(JSON.parse(preference));

    const existingReceipt = myData.receipt.find(receipt => 
      receipt.ballot_id === ballot_id && 
      Number(receipt.election_id) === Number(election_id)
    );
    if (!existingReceipt) {
      Alert.alert("Error", "Ballot not found in the list.");
      return { error: 'Ballot not found in the list' };
    }

    if (existingReceipt.accessed === true) {
      Alert.alert("Error", "Current ballot has already been used.");
      return { error: 'Current ballot has already been used.' };
    }

    const voter_id = existingReceipt.voter_id;

    const cleaned = booth_num.slice(1, -1);
    const booth = cleaned.split("");
    const newVote = {
      election_id: election_id,
      voter_id: voter_id,
      booth_num: booth_num,
      commitment: comms[num].replace(/^'|'$/g, ''),
      pref_id: num,
      hash_value: ballot_id,
      timestamp: timestamp // Added timestamp here
    };

    const updatedVoterIndex = myData.voter.findIndex(voter => voter.voter_id === voter_id);
    if (updatedVoterIndex !== -1) {
      const voterElections = myData.voter[updatedVoterIndex].elections;
      const electionIndex = voterElections.findIndex(e => e.election_id === election_id);
      if (electionIndex !== -1) {
        voterElections[electionIndex].vote = true;
        voterElections[electionIndex].ballot_id = ballot_id;
      }
    }

    const updatedReceiptIndex = myData.receipt.findIndex(receipt => receipt.ballot_id === ballot_id);
    if (updatedReceiptIndex !== -1) {
      myData.receipt[updatedReceiptIndex].accessed = true;
    } else {
      Alert.alert("Error", "Receipt found earlier but not found now.");
      return { error: 'Receipt inconsistency error' };
    }

    await RNFS.writeFile(readFilePath, JSON.stringify(myData), 'utf8');

    let allVotes = [];
    try {
      const existingVotes = await RNFS.readFile(writeFilePath, 'utf8');
      allVotes = JSON.parse(existingVotes);
    } catch (err) {
      // Initialize new array if file doesn't exist
    }
    allVotes.push(newVote);
    await RNFS.writeFile(writeFilePath, JSON.stringify(allVotes), 'utf8');
    
    Alert.alert("Success", "Vote uploaded successfully!");
    return { message: 'Vote uploaded successfully' };
  } catch (err) {
    Alert.alert("Error", `Unexpected error: ${err.message}`);
    return { error: err.message };
  }
};

export default postVote;
