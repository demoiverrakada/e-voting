import React from 'react';
import { Button } from 'react-native-paper';
import { StyleSheet, View, StatusBar } from 'react-native';
import RNFS from 'react-native-fs';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;

const extractVotesToExternalStorage = async () => {
  try {
    const initialHash = '12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126'; // Initial value for hash

    // Check if the source file exists
    const fileExists = await RNFS.exists(writeFilePath);
    if (!fileExists) {
      console.error('Source file does not exist:', writeFilePath);
      return;
    }

    // Read the source file
    const fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    let votesData;
    try {
      votesData = JSON.parse(fileContents);
    } catch (parseError) {
      console.error('Error parsing JSON file:', parseError);
      return;
    }

    // Ensure votesData is an array
    if (!Array.isArray(votesData)) {
      console.error('Invalid data format: expected an array of votes.');
      return;
    }

    // First, compute all the hashes and the final hash
    let currentHash = initialHash;
    const updatedVotesData = [];

    // Iterate through all votes and update the hash iteratively
    for (const vote of votesData) {
      const voteHash = await sha256(JSON.stringify(vote)); // Compute hash of the vote
      currentHash = await sha256(currentHash + voteHash); // Update hash using h(i-1) + hash(vote)
      updatedVotesData.push(vote); // Just store the original votes first, without the final hash
    }

    // Now that we have iterated through all the votes, append the final hash to all of them
    const finalHash = currentHash;

    // Add the final hash to each vote
    const finalUpdatedVotesData = updatedVotesData.map(vote => ({
      ...vote,
      hash_value: finalHash // Append the final hash to each vote
    }));

    // Write the updated data to the external storage file
    const destPath = `${RNFS.ExternalDirectoryPath}/updated_data.json`;
    await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');

    console.log(`File with final hash copied to: ${destPath}`);
  } catch (err) {
    console.error('Error copying file with final hash:', err);
  }
};


function HomeScreenPO(props) {
  const check = () => {
    props.navigation.navigate('VoterCheck');
  };

  const upload = () => {
    props.navigation.navigate('scanner2');
  };

  const audit= ()=>{
    props.navigation.navigate('Audit');
  }
  const logout = async () => {
    await extractVotesToExternalStorage();
    props.navigation.replace('start');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#A1D6E2' />
      <Button
        mode='contained'
        onPress={check}
        style={[styles.button, { backgroundColor: '#1995AD' }]}
        labelStyle={styles.buttonLabel}
      >
        Verify Voter and Ballot
      </Button>

      <Button
        mode='contained'
        onPress={upload}
        style={[styles.button, { backgroundColor: '#1995AD' }]}
        labelStyle={styles.buttonLabel}
      >
        Upload Voter Receipt
      </Button>

      <Button
        mode='contained'
        onPress={audit}
        style={[styles.button, { backgroundColor: '#1995AD' }]}
        labelStyle={styles.buttonLabel}
      >
        Scan Unused Ballots and Upload Votes Corresponding to Them
      </Button>

      <Button
        mode='contained'
        onPress={logout}
        style={[styles.button, { backgroundColor: '#D9534F' }]} // Red color for logout
        labelStyle={styles.buttonLabel}
      >
        Logout Now
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A1D6E2',
    padding: 16,
  },
  button: {
    marginVertical: 10,
    width: '80%',
    borderRadius: 25,
    elevation: 3,
  },
  buttonLabel: {
    color: '#F1F1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreenPO;
