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
    alert(err);
    return { error: "Error in ballot verification" };
  }
};

export default checkReceipt;