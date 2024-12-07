import RNFS from 'react-native-fs';
import {sha256} from 'react-native-sha256';
import React from 'react';
// Define the path to the JSON file to read from (in DocumentDirectoryPath)
const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;


const checkReceipt2 = async (commitments) => {
  if (!commitments) {
    return { error: "Must provide ballot commitment value" };
  }
  try {
    // Read myData from the existing JSON file
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);
    console.log("Read file contents:", fileContents);
    // Parse commitments and create hashedCommitments
    const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
    const comms = cleanedString.split("', '");
    const password = comms.join('');
    const hashedCommitments = await sha256(password);

    // Find the existing receipt and voter
    const existingReceipt = myData.receipt.find(receipt => receipt.ballot_id === hashedCommitments);
    const existingVoter = myData.voter.find(voter => voter.voter_id === existingReceipt.voter_id);

    // Check conditions and return appropriate messages
    if (!existingReceipt) {
      return { error: "Ballot not found." };
    }
    if (existingReceipt.accessed === true) {
      return { error: "Current ballot has already been used." };
    }
    if (hashedCommitments !== existingVoter.ballot_id) {
      return { error: "Ballot does not match with the ballot assigned to the voter." };
    }

    return { message: "Ballot exists and verified successfully. Go inside the booth.", ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Error in ballot verification" };
  }
};

export default checkReceipt2;
