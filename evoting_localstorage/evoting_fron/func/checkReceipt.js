import RNFS, { DocumentDirectoryPath, writeFile} from 'react-native-fs';
import {sha256} from 'react-native-sha256';
import React from 'react';

// Define the path to the JSON file to read from (in DocumentDirectoryPath)
const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

// Function to copy the file from assets to the document directory if it does not exist

const checkReceipt = async (commitments, entryNum) => {
  if (!commitments) {
    return { error: "Must provide ballot commitment value" };
  }

  try {
    // Read myData from the existing JSON file
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);
    console.log("Read file contents:", fileContents);
    // Parse commitments and create hashedCommitmentS
    const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
    const comms = cleanedString.split("', '"); // Split by "', '"
    console.log("Commitments:", comms);
    const password = comms.join('');
    const hashedCommitments = await sha256(password);
    console.log("Commitments:", hashedCommitments);
    // Find the existing receipt
    const existingReceiptIndex = myData.receipt.findIndex(receipt => receipt.ballot_id === hashedCommitments);
    if (existingReceiptIndex===-1) {
      return { error: `Ballot not found. qr: ${hashedCommitments} data: ${myData.voter[0].voter_id}`};
    }
    if (myData.receipt[existingReceiptIndex].accessed === true) {
      return { error: "Current ballot has already been used." };
    }

    // Update the voter information
    const updatedVoterIndex = myData.voter.findIndex(voter => voter.voter_id === entryNum);
    if (updatedVoterIndex===-1) {
      return { error: "Voter not found." };
    }
    if(myData.voter[updatedVoterIndex].vote === true){
        return {error:"Voter has already voted."};
    }
    myData.receipt[existingReceiptIndex].voter_id = entryNum;
    myData.voter[updatedVoterIndex].ballot_id=hashedCommitments;
    await RNFS.writeFile(writeFilePath, JSON.stringify(myData), 'utf8');

    return { message: "Ballot exists and verified successfully. Go inside the booth.", ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Error in ballot verification" };
  }
};

export default checkReceipt;
