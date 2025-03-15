import RNFS from 'react-native-fs';
import { sha256 } from 'react-native-sha256';
import React from 'react';
import { Alert } from 'react-native';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;
const readFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

const postVote = async (preference, commitments, booth_num,election_id) => {
  try {
    Alert.alert('Booth Number', `The booth number is: ${booth_num}`);
    // Alert.alert("Debug", "Starting postVote function...");

    // Step 1: Read the data file
    // Alert.alert("Debug", `Reading file from: ${readFilePath}`);
    const fileContents = await RNFS.readFile(readFilePath, 'utf8');
    // Alert.alert("Debug", "File read successfully.");

    let myData;
    try {
      myData = JSON.parse(fileContents);
      // Alert.alert("Debug", "JSON parsed successfully.");
    } catch (parseError) {
      // Alert.alert("Error", `Error parsing JSON: ${parseError.message}`);
      return { error: 'Error parsing JSON file' };
    }

    // Step 2: Parse commitments
    // Alert.alert("Debug", "Parsing commitments...");
    let comms2;
    try {
      const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
      comms2 = cleanedString.split("', '");
      // Alert.alert("Debug", `Commitments parsed successfully: ${JSON.stringify(comms2)}`);
    } catch (parseError) {
      Alert.alert("Error", `Error parsing commitments: ${parseError.message}`);
      return { error: 'Error parsing commitments' };
    }

    // Step 3: Generate ballot_id
    // Alert.alert("Debug", "Generating ballot_id...");
    const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
    const comms = cleanedString.split("', '"); // Split by "', '"
    // Alert.alert("Debug", `Commitments: ${JSON.stringify(comms)}`);

    // Join the array into a string and remove unwanted characters
    let password = comms.join('').replace(/[,'"]/g, ''); // Join the array into a string, then remove quotes and commas
    // Alert.alert("Debug", `password: ${password}`); // Now you should get the correct password
    let hashedCommitments;
    const countQuotes = (str) => {
      const quotes = str.match(/['"]/g); // Matches both " and '
      return quotes ? quotes.length : 0;
    };
    // Alert.alert("Debug", "Counting quotes...");
    const n = countQuotes(commitments);  // Count number of " and '
    // Alert.alert("Debug", `Number of quotes (n): ${n}`);  // Debug: Show n
    
    const k = n / 2;
    // Alert.alert("Debug", `k: ${k}`);
    const l = password.length;
    // Alert.alert("Debug", `l: ${l}`);
    const t = l / k;
    // Alert.alert("Debug", `t: ${t}`);

    let existingReceiptIndex = -1;
    let ballot_id;
    for (let i = 0; i < k; i++) {
      const s1 = password.slice(0, t);
      // Alert.alert("Debug", `s1: ${s1}`);
      const s2 = password.slice(t, l);
      // Alert.alert("Debug", `s2: ${s2}`);
      const result = s2 + s1;
      password = result;
      // Alert.alert("Debug", `result: ${result}`);
      const hashResult = await sha256(result);
      hashedCommitments = hashResult;
      ballot_id = hashedCommitments;
      // Alert.alert("Debug", `hashResult: ${hashResult}`);
      const index = myData.receipt.findIndex(receipt => receipt.ballot_id === hashResult);
      // Alert.alert("Debug", `index: ${index}`);
      if (index !== -1) {
        existingReceiptIndex = index;
        break;
      }
    }

    // Alert.alert("Debug", `Ballot ID generated: ${ballot_id}`);

    // Step 4: Parse preference
    const num = Number(JSON.parse(preference));
    // Alert.alert("Debug", `Preference parsed: ${num}`);

    // Step 5: Check receipt
    // Alert.alert("Debug", "Checking receipt...");
    const existingReceipt = myData.receipt.find(receipt => receipt.ballot_id === ballot_id);
    if (!existingReceipt) {
      Alert.alert("Error", "Ballot not found in the list.");
      return { error: 'Ballot not found in the list' };
    }

    if (existingReceipt.accessed === true) {
      Alert.alert("Error", "Current ballot has already been used.");
      return { error: 'Current ballot has already been used.' };
    }

    const voter_id = existingReceipt.voter_id;
    // Alert.alert("Debug", `Receipt found: ${JSON.stringify(existingReceipt)}`);

    // Step 6: Prepare new vote
    // Alert.alert("Debug", "Preparing new vote...");
    const cleaned = booth_num.slice(1, -1); // Remove '[' and ']'
    const booth = cleaned.split("");
    const newVote = {election_id:election_id,voter_id: voter_id, booth_num: booth_num, commitment: comms[num].replace(/^'|'$/g, ''), pref_id: num, hash_value: ballot_id };
    // Alert.alert("Debug", `New vote created: ${JSON.stringify(newVote)}`);

    // Step 7: Update voter and receipt data
    // Alert.alert("Debug", "Updating voter and receipt data...");
    const updatedVoterIndex = myData.voter.findIndex(voter => voter.voter_id === voter_id);
    if (updatedVoterIndex !== -1) {
      myData.voter[updatedVoterIndex].vote = true;
    }

    const updatedReceiptIndex = myData.receipt.findIndex(receipt => receipt.ballot_id === ballot_id);
    if (updatedReceiptIndex !== -1) {
      myData.receipt[updatedReceiptIndex].accessed = true;
    } else {
      Alert.alert("Error", "Receipt found earlier but not found now.");
      return { error: 'Receipt inconsistency error' };
    }

    // Step 8: Write updated data
    // Alert.alert("Debug", `Writing updated data to: ${readFilePath}`);
    // Alert.alert('Debug', `Writing updated data: ${myData}`);
    await RNFS.writeFile(readFilePath, JSON.stringify(myData), 'utf8');

    // Step 9: Append new vote
    // Alert.alert("Debug", `Appending new vote to: ${writeFilePath}`);
    let allVotes = [];
    try {
      const existingVotes = await RNFS.readFile(writeFilePath, 'utf8');
      allVotes = JSON.parse(existingVotes);
    } catch (err) {
      // Alert.alert("Debug", "No existing votes file, starting fresh.");
    }
    allVotes.push(newVote);
    await RNFS.writeFile(writeFilePath, JSON.stringify(allVotes), 'utf8');
    Alert.alert("Success", "Vote uploaded successfully!");
    return { message: 'Vote uploaded successfully' };
  } catch (err) {
    Alert.alert("Error", `Unexpected error: ${err.message}`);
    return { error: err.message };
  }
  finally {
    // Clear memory-heavy objects
    password = null;
    comms2.length = 0;
    comms.length = 0;
    System.gc(); // Force garbage collection
  }
};

export default postVote;
