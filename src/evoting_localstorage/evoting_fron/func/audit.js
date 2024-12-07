import RNFS, { DocumentDirectoryPath, writeFile} from 'react-native-fs';
import {sha256} from 'react-native-sha256';
import React from 'react';

// Define the path to the JSON file to read from (in DocumentDirectoryPath)
const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;


const checkReceipt = async (commitments) => {
  if (!commitments) {
    return { error: "Must provide ballot commitment value" };
  }

  try {
    // Read myData from the existing JSON file
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);
    // Parse commitments and create hashedCommitmentS
    const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
    const comms = cleanedString.split("', '"); // Split by "', '"
    console.log("Commitments:", comms);
    const password = comms.join('');
    const hashedCommitments = await sha256(password);
    console.log("Commitments:", hashedCommitments);
    // Find the existing receipt
    const existingReceipt = myData.receipt.find(receipt => receipt.ballot_id === hashedCommitments);
    if (!existingReceipt) {
      return { error: "Ballot not found." };
    }
    if (existingReceipt.accessed === true) {
      return { error: "Current ballot has already been used." };
    }
    existingReceipt.accessed=true;
    await RNFS.writeFile(writeFilePath, JSON.stringify(myData), 'utf8');

    return { message: "Scanned", ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Error in ballot verification" };
  }
};

export default checkReceipt;