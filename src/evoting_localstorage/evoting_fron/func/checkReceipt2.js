import RNFS from 'react-native-fs';
import { sha256 } from 'react-native-sha256';
import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';

// Define the path to the JSON file to read from (in DocumentDirectoryPath)
const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

const storeLastVerifiedVoter = async (voterId, voterIndex) => {
  try {
    // Alert.alert("storeLastVerifiedVoter", `Storing voter ${voterId}`);
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    // Update the lastVerifiedVoter field
    myData.lastVerifiedVoter = { voter_id: voterId, voter_index: voterIndex };

    // Write the updated data back to the file
    await RNFS.writeFile(writeFilePath, JSON.stringify(myData), 'utf8');
    // Alert.alert("storeLastVerifiedVoter", "Voter stored successfully.");
  } catch (error) {
    console.error('Error storing the last verified voter:', error);
    // Alert.alert("storeLastVerifiedVoter", "Error storing voter.");
  }
};

// Function to retrieve the last verified voter from the JSON file
const getLastVerifiedVoter = async () => {
  try {
    // Alert.alert("getLastVerifiedVoter", "Retrieving last verified voter.");
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    return myData.lastVerifiedVoter || null;
  } catch (error) {
    console.error('Error retrieving the last verified voter:', error);
    // Alert.alert("getLastVerifiedVoter", "Error retrieving voter.");
    return null;
  }
};

const checkReceipt2 = async (commitments) => {
  // Alert to check commitments value
  // Alert.alert("checkReceipt2 - Commitments", JSON.stringify(commitments));

  if (!commitments) {
    return { error: "Must provide ballot commitment value" };
  }

  try {
    // Retrieve the last verified voter
    const lastVerifiedVoter = await getLastVerifiedVoter();
    // Alert.alert("checkReceipt2 - lastVerifiedVoter", JSON.stringify(lastVerifiedVoter));
    
    if (!lastVerifiedVoter) {
      return { error: "No voter has been verified yet." };
    }

    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);

    // Alert.alert("checkReceipt2 - File Contents", JSON.stringify(myData));

    // Process the commitments as you were doing earlier...
    const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
    // Alert.alert("checkReceipt2 - cleanedString", cleanedString);

    const comms = cleanedString.split("', '"); // Split by "', '"
    // Alert.alert("checkReceipt2 - comms", JSON.stringify(comms));

    let password = comms.join('').replace(/[,'"]/g, '');
    // Alert.alert("checkReceipt2 - password", password);

    let hashedCommitments;
    const countQuotes = (str) => (str.match(/['"]/g) || []).length;
    const n = countQuotes(commitments);
    const k = n / 2;
    const l = password.length;
    const t = l / k;

    // Alert.alert("checkReceipt2 - Counts", `n: ${n}, k: ${k}, l: ${l}, t: ${t}`);

    let existingReceiptIndex = -1;
    for (let i = 0; i < k; i++) {
      const s1 = password.slice(0, t);
      const s2 = password.slice(t, l);
      const result = s2 + s1;
      password = result;
      hashedCommitments = await sha256(result);

      // Alert.alert("checkReceipt2 - hashedCommitments", hashedCommitments);

      existingReceiptIndex = myData.receipt.findIndex(
        (receipt) => receipt.ballot_id === hashedCommitments
      );
      
      if (existingReceiptIndex !== -1) break;
    }

    if (existingReceiptIndex === -1) {
      return { error: "Ballot not found." };
    }

    const existingReceipt = myData.receipt[existingReceiptIndex];

    // Check if the ballot has already been used
    if (existingReceipt.accessed === true) {
      return { error: "Ballot has already been used." };
    }

    // Update the voter_id in the existing receipt
    const receipt = myData.receipt[existingReceiptIndex];
    if (receipt.election_id !== myData.voter[lastVerifiedVoter.voter_index]?.elections.some(e => e.election_id === receipt.election_id)) {
      return { error: "Ballot doesn't match voter's elections" };
    }
    receipt.voter_id = lastVerifiedVoter.voter_id;
    // Alert.alert("checkReceipt2 - Updated Voter ID", `Updated voter_id to ${lastVerifiedVoter.voter_id}`);

    await RNFS.writeFile(writeFilePath, JSON.stringify(myData), 'utf8');

    return { message: "Ballot exists and verified successfully.", ok: true };
  } catch (err) {
    console.error(err);
    // Alert.alert("checkReceipt2 - Error", "Error in ballot verification.");
    return { error: "Error in ballot verification." };
  }
};

export default checkReceipt2;
