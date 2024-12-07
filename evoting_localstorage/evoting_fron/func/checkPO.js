import bcrypt from 'react-native-bcrypt';
import RNFS from 'react-native-fs';
import React from 'react';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

// Function to copy the file from assets to the document directory if it does not exist
const copyFileIfNotExists = async () => {
  try {
    const fileExists = await RNFS.exists(writeFilePath);
    if(!fileExists){
    console.log("File exists:", fileExists);
      const assetPath = 'data.json'; // The name of the file in the assets directory
      console.log("Copying file from assets to document directory...");
      await RNFS.copyFileAssets(assetPath, writeFilePath);
      console.log("File copied successfully");
    }
  } catch (err) {
    console.error("Error checking/copying file:", err);
  }
  
};

const checkPO = async (email, password) => {
  await copyFileIfNotExists();
  if (!email || !password) {
    console.log("Must provide email and/or password");
    return { error: "Must provide email and/or password" };
  }
  try {
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    console.log("Read file contents:", fileContents);
    let myData = JSON.parse(fileContents);
    console.log("Parsed data:", myData);
    const existingPO = myData.PO.find((PO) => PO.email === email);
    console.log("Existing PO:", existingPO);
    if (!existingPO) {
      console.log("You are not a Polling Officer");
      return { error: 'You are not a Polling Officer' };
    }

    // Using Promise to handle bcrypt.compare callback
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, existingPO.passwordHash, (err, isMatch) => {
        if (err) {
          console.error("Error in bcrypt compare:", err);
          reject({ error: err.message });
        } else {
          console.log("Password match:", isMatch);
          if (!isMatch) {
            console.log("Invalid password");
            resolve({ error: 'Invalid password' });
          } else {
            resolve({ message: 'Polling Officer found' });
          }
        }
      });
    });
  } catch (err) {
    console.error("Error in checkPO:", err);
    return { error: err.message };
  }
};

export default checkPO;
