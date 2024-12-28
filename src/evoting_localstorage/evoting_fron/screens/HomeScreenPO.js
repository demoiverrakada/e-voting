import React from 'react';
import { View, Alert, StyleSheet, Linking, StatusBar } from 'react-native'; // Added StatusBar import
import { Button } from 'react-native-paper';
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

    // Change 1: Iteratively compute the final hash over all votes
    let currentHash = initialHash; // Initialize with the initial hash
    for (const vote of votesData) {
      const voteHash = await sha256(JSON.stringify(vote)); // Compute hash of the current vote
      currentHash = await sha256(currentHash + voteHash); // Update current hash with hn-1 + hash(vote)
    }

    // Change 2: Assign the final computed hash to all votes
    const finalHash = currentHash; // The computed final hash
    const finalUpdatedVotesData = votesData.map(vote => ({
      ...vote,
      hash_value: finalHash // Assign the same final hash to every vote
    }));

    // Write the updated data to the external storage file
    const destPath = `${RNFS.ExternalDirectoryPath}/updated_data.json`;
    await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');

    console.log(`File with final hash copied to: ${destPath}`);
  } catch (err) {
    console.error('Error copying file with final hash:', err);
  }

  try {
    // Change 3: Ensure the file is copied to Downloads with the correct final hash
    const sourcePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;
    const destPath = `${RNFS.DownloadDirectoryPath}/updated_data.json`;

    // Check if the source file exists
    const fileExists = await RNFS.exists(sourcePath);
    if (!fileExists) {
      Alert.alert('Error', 'Source file does not exist. Please ensure the file is created.');
      return;
    }

    // Copy the file to the Downloads folder
    await RNFS.copyFile(sourcePath, destPath);

    Alert.alert('Success', 'File has been saved to your Downloads folder.');
  } catch (err) {
    Alert.alert('Error', `An error occurred: ${err.message}`);
  }
};


function HomeScreenPO(props) {
  const check = () => {
    props.navigation.navigate('VoterCheck');
  };

  const upload = () => {
    props.navigation.navigate('scanner2');
  };

  const audit = () => {
    props.navigation.navigate('Audit');
  };

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
        onPress={logout}
        style={[styles.button, { backgroundColor: '#D9534F' }]} // Red color for logout
        labelStyle={styles.buttonLabel}
      >
        Logout and Download Encrypted votes
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
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  button: {
    marginVertical: 12,
    width: '85%',
    borderRadius: 30,
    elevation: 4,
    backgroundColor: '#3B9FBF',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

export default HomeScreenPO;
