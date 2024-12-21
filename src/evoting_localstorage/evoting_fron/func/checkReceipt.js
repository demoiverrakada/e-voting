import RNFS, { DocumentDirectoryPath, writeFile} from 'react-native-fs';
import {sha256} from 'react-native-sha256';
import React from 'react';

// Define the path to the JSON file to read from (in DocumentDirectoryPath)
const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

// Function to copy the file from assets to the document directory if it does not exist

const storeLastVerifiedVoter = async (voterId, voterIndex) => {
  try {
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    // Update the lastVerifiedVoter field
    myData.lastVerifiedVoter = { voter_id: voterId, voter_index: voterIndex };

    // Write the updated data back to the file
    await RNFS.writeFile(writeFilePath, JSON.stringify(myData), 'utf8');
  } catch (error) {
    console.error('Error storing the last verified voter:', error);
  }
};

// Function to retrieve the last verified voter from the JSON file
const getLastVerifiedVoter = async () => {
  try {
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    return myData.lastVerifiedVoter || null;
  } catch (error) {
    console.error('Error retrieving the last verified voter:', error);
    return null;
  }
};

// Example checkReceipt function (when voter enters)
const checkReceipt = async (entryNum) => {
  if (!entryNum) {
    return { error: "Must provide a valid voter ID" };
  }

  try {
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    // Find the voter index
    const updatedVoterIndex = myData.voter.findIndex((voter) => voter.voter_id === entryNum);
    if (updatedVoterIndex === -1) {
      return { error: "Voter not found." };
    }
    if (myData.voter[updatedVoterIndex].vote === true) {
      return { error: "Voter has already voted." };
    }

    // Store the last verified voter
    await storeLastVerifiedVoter(entryNum, updatedVoterIndex);

    return { message: "Voter verified successfully. Go inside the booth.", ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Error in voter verification." };
  }
};

export default checkReceipt;