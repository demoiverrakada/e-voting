import RNFS from 'react-native-fs';
import {sha256} from 'react-native-sha256';
import React from 'react';
// Define the path to the JSON file to read from (in DocumentDirectoryPath)
const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

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

const checkReceipt2 = async (commitments) => {
  if (!commitments) {
    return { error: "Must provide ballot commitment value" };
  }

  try {
    // Retrieve the last verified voter
    const lastVerifiedVoter = await getLastVerifiedVoter();
    if (!lastVerifiedVoter) {
      return { error: "No voter has been verified yet." };
    }

    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    // Process the commitments as you were doing earlier...
    const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
    const comms = cleanedString.split("', '"); // Split by "', '"
    let password = comms.join('').replace(/[,'"]/g, '');

    let hashedCommitments;
    const countQuotes = (str) => (str.match(/['"]/g) || []).length;
    const n = countQuotes(commitments);
    const k = n / 2;
    const l = password.length;
    const t = l / k;

    let existingReceiptIndex = -1;
    for (let i = 0; i < k; i++) {
      const s1 = password.slice(0, t);
      const s2 = password.slice(t, l);
      const result = s2 + s1;
      password = result;
      hashedCommitments = await sha256(result);
      existingReceiptIndex = myData.receipt.findIndex(
        (receipt) => receipt.ballot_id === hashedCommitments
      );
      if (existingReceiptIndex !== -1) break;
    }

    if (existingReceiptIndex === -1) {
      return { error: "Ballot not found." };
    }

    const existingReceipt = myData.receipt[existingReceiptIndex];
    if(myData.receipt[existingReceiptIndex].accessed===true){
      return { error: "Ballot has already been used." };
    }

    myData[existingReceiptIndex].voter_id=lastVerifiedVoter.voter_id
    await RNFS.writeFile(writeFilePath, JSON.stringify(myData), 'utf8');
    return { message: "Ballot exists and verified successfully.", ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Error in ballot verification." };
  }
};

export default checkReceipt2;
