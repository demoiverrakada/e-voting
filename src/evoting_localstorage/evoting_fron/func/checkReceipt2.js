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
    // alert("Read file contents:" + fileContents);
    // Parse commitments and create hashedCommitmentS
    const cleanedString = commitments.slice(1, -1); // Remove '[' and ']'
    const comms = cleanedString.split("', '"); // Split by "', '"
    // alert("Commitments: " + comms);

    // Join the array into a string and remove unwanted characters
    let password = comms.join('').replace(/[,'"]/g, ''); // Join the array into a string, then remove quotes and commas
    // alert("password: " + password); // Now you should get the correct password
    let hashedCommitments;
    const countQuotes = (str) => {
      const quotes = str.match(/['"]/g); // Matches both " and '
      return quotes ? quotes.length : 0;
    };
    // alert("test1");
    const n = countQuotes(commitments);  // Count number of " and '
    // alert("Number of quotes (n): " + n);  // Debug: Show n
    
    const k = n/2;
    // alert("k: " + k);
    const l = password.length;
    // alert("l: "+l);
    const t = l/k;
    // alert("t: "+t);
    // const passwords = [];
    let existingReceiptIndex = -1;
    for (let i = 0; i < k; i++) {
      const s1 = password.slice(0, t);
      // alert("s1: "+s1);
      const s2 = password.slice(t, l);
      // alert("s2: "+s2);
      const result = s2 + s1;
      password = result;
      // alert("result: "+result);
      const hashResult = await sha256(result);
      hashedCommitments = hashResult;
      // alert("hashResult: "+hashResult);
      const index = myData.receipt.findIndex(receipt => receipt.ballot_id === hashResult);
      // alert("index: "+index);
      if (index !== -1) {
        existingReceiptIndex = index;
        break;
      }
    }
    // alert("test1");

    // const hashedCommitments = await sha256(password);
    // console.log("Commitments:", hashedCommitments);
    // Find the existing receipt
    // const existingReceiptIndex = myData.receipt.findIndex(receipt => receipt.ballot_id === hashedCommitments);
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
