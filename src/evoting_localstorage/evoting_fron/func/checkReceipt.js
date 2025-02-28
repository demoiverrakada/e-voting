import RNFS from 'react-native-fs';
import { sha256 } from 'react-native-sha256';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/data.json`;

const storeLastVerifiedVoter = async (voterId, voterIndex) => {
  try {
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);
    myData.lastVerifiedVoter = { 
      voter_id: voterId, 
      voter_index: voterIndex,
      elections: myData.voter[voterIndex]?.election_ids || []
    };
    await RNFS.writeFile(writeFilePath, JSON.stringify(myData), 'utf8');
  } catch (error) {
    console.error('Error storing voter:', error);
  }
};

const checkReceipt = async (entryNum) => {
  if (!entryNum) return { error: "Invalid voter ID" };

  try {
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let myData = JSON.parse(fileContents);
    
    const voterIndex = myData.voter.findIndex(v => v.voter_id === entryNum);
    if (voterIndex === -1) return { error: "Voter not found" };

    const voter = myData.voter[voterIndex];
    
    // Get elections where voter hasn't voted yet
    const votedElections = voter.votes?.map(v => v.election_id) || [];
    const eligibleElections = voter.election_ids?.filter(eid => 
      !votedElections.includes(eid)
    ) || [];

    if (eligibleElections.length === 0) {
      return { error: "No eligible elections remaining" };
    }

    await storeLastVerifiedVoter(entryNum, voterIndex);
    
    return {
      message: "Voter verified",
      eligibleElections,
      votedElections
    };

  } catch (err) {
    console.error(err);
    return { error: "Verification failed" };
  }
};

export default checkReceipt;
