import RNFS from 'react-native-fs';
import {sha256} from 'react-native-sha256';
import React from 'react';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;
const readFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

const postVote = async (preference, commitments,booth_num) => {
  try {
    console.log("Starting postVote function...");
    console.log(`Inputs - preference: ${preference}, commitments: ${commitments}`);

    // Read myData from the existing JSON file in assets
    console.log(`Reading file from: ${readFilePath}`);
    const fileContents = await RNFS.readFile(readFilePath, 'utf8');
    console.log("File read successfully.");

    let myData;
    try {
      myData = JSON.parse(fileContents);
      console.log("JSON parsed successfully:", myData);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return { error: 'Error parsing JSON file' };
    }

    // Parse commitments and create ballot_id
    let comms;
    try {
      const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
      comms = cleanedString.split("', '");
      console.log("Commitments parsed successfully:", comms);
    } catch (parseError) {
      console.error("Error parsing commitments:", parseError);
      return { error: 'Error parsing commitments' };
    }

    console.log("Building password from commitments...");
    const password = comms.join('');
    console.log("Password created:", password);

    console.log("Generating ballot_id...");
    const ballot_id = await sha256(password);
    console.log("Ballot ID generated:", ballot_id);

    const num = Number(JSON.parse(preference));
    console.log("Preference parsed:", num);

    // Check if ballot_id exists in receipts
    console.log("Searching for receipt...");
    const existingReceipt = myData.receipt.find(receipt => receipt.ballot_id === ballot_id);
    const voter_id=existingReceipt.voter_id;
    console.log("Receipt found:", existingReceipt);

    if (!existingReceipt) {
      console.log("Error: Ballot not found in the list");
      return { error: 'Ballot not found in the list' };
    }

    if (existingReceipt.accessed === true) {
      console.log("Error: Current ballot has already been used.");
      return { error: 'Current ballot has already been used.' };
    }

    const cleaned = booth_num.slice(1, -1); // Remove '[' and ']'
    const booth = cleaned.split("");
    // Update the data
    console.log("Creating new vote object...");
    const newVote = { voter_id: voter_id,booth_num:parseInt(booth[0], 10), commitment: comms[num].replace(/^'|'$/g, '')};
    console.log("New vote:", newVote);

    console.log("Updating voter data...");
    const updatedVoterIndex = myData.voter.findIndex(voter => voter.voter_id === voter_id);
    if (updatedVoterIndex !== -1) {
      myData.voter[updatedVoterIndex].vote = true;
      console.log("Voter data updated.");
    } else {
      console.log("Warning: Voter not found in the list.");
    }

    console.log("Updating receipt data...");
    const updatedReceiptIndex = myData.receipt.findIndex(receipt => receipt.ballot_id === ballot_id);
    if (updatedReceiptIndex !== -1) {
      myData.receipt[updatedReceiptIndex].accessed = true;
      console.log("Receipt data updated.");
    } else {
      console.error("Error: Receipt found earlier but not found now. This shouldn't happen.");
      return { error: 'Receipt inconsistency error' };
    }

    // Write the updated data to files
    console.log(`Writing updated data to: ${readFilePath}`);
    await RNFS.writeFile(readFilePath, JSON.stringify(myData), 'utf8');
    console.log("Data written successfully.");
    
    let allVotes = [];
    try {
      const existingVotes = await RNFS.readFile(writeFilePath, 'utf8');
      allVotes = JSON.parse(existingVotes);
      console.log("Read existing votes:", allVotes);
    } catch (err) {
      console.log("No existing votes file, starting fresh.");
    }

    // Append new vote and write back to file
    allVotes = Array.isArray(allVotes) ? allVotes : [];
    allVotes.push(newVote);
    await RNFS.writeFile(writeFilePath, JSON.stringify(allVotes), 'utf8');
    console.log("New vote appended to file.");

    console.log("Vote uploaded successfully!");
    return { message: 'Vote uploaded successfully' };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: err.message };
  }
};

export default postVote;
