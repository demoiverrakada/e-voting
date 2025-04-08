import React from 'react';
import { View, Alert, StyleSheet, Linking, StatusBar } from 'react-native';
import { Button } from 'react-native-paper';
import RNFS from 'react-native-fs';
import { sha256 } from 'react-native-sha256';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;

const makeFileReadOnly = async (filePath) => {
  try {
    // Change the file permissions to read-only (444)
    await RNFS.setAttributes(filePath, { mode: 0o444 });
    console.log(`File permissions updated to read-only for: ${filePath}`);
  } catch (err) {
    console.error(`Error setting file to read-only: ${err.message}`);
  }
};

const extractVotesToExternalStorage = async () => {
  try {
    const initialHash = '12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126';
    const fileGenerationTimestamp = new Date().toISOString(); // Timestamp for file generation

    // Check source file existence
    const fileExists = await RNFS.exists(writeFilePath);
    if (!fileExists) {
      const errorMsg = `Source file not found at: ${writeFilePath}`;
      Alert.alert('File Error', errorMsg);
      console.error(errorMsg);
      return;
    }

    // Read and parse file
    let fileContents;
    try {
      fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    } catch (readError) {
      const errorMsg = `Failed to read file: ${readError.message}`;
      Alert.alert('Read Error', errorMsg);
      console.error(errorMsg);
      return;
    }

    let votesData;
    try {
      votesData = JSON.parse(fileContents);
    } catch (parseError) {
      const errorMsg = `Invalid JSON format: ${parseError.message}`;
      Alert.alert('Parse Error', errorMsg);
      console.error(errorMsg);
      return;
    }

    if (!Array.isArray(votesData)) {
      const errorMsg = 'Data format invalid: Expected array of votes';
      Alert.alert('Data Error', errorMsg);
      console.error(errorMsg);
      return;
    }

    let currentHash = initialHash;
    try {
      for (const vote of votesData) {
        // Include all vote properties including timestamp but excluding hash_value
        const voteWithoutHash = {
          election_id: vote.election_id,
          voter_id: vote.voter_id,
          booth_num: vote.booth_num,
          commitment: vote.commitment,
          pref_id: vote.pref_id,
          timestamp: vote.timestamp // Include timestamp in hash calculation
        };
        const voteHash = await sha256(JSON.stringify(voteWithoutHash));
        currentHash = await sha256(currentHash + voteHash);
      }
    } catch (hashError) {
      const errorMsg = `Hashing failed: ${hashError.message}`;
      Alert.alert('Security Error', errorMsg);
      console.error(errorMsg);
      return;
    }

    // Apply the final hash to all votes and add file generation timestamp
    const finalUpdatedVotesData = {
      votes: votesData.map(vote => ({
        election_id: vote.election_id,
        voter_id: vote.voter_id,
        booth_num: vote.booth_num,
        commitment: vote.commitment,
        pref_id: vote.pref_id,
        timestamp: vote.timestamp, // Preserve original vote timestamp
        hash_value: currentHash // Assign the same final hash to all votes
      })),
      file_generation_timestamp: fileGenerationTimestamp, // Add file generation timestamp
      final_hash: currentHash // Store the final hash at the top level
    };

    // Write to external storage
    const destPath = `${RNFS.ExternalDirectoryPath}/updated_data.json`;
    try {
      await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');
    } catch (writeError) {
      const errorMsg = `File write failed: ${writeError.message}`;
      Alert.alert('Write Error', errorMsg);
      console.error(errorMsg);
      return;
    }

    // Copy to Downloads
    try {
      const downloadsDest = `${RNFS.DownloadDirectoryPath}/updated_data.json`;
      await RNFS.copyFile(destPath, downloadsDest); // Use destPath as source to include our changes
      await makeFileReadOnly(downloadsDest);
      Alert.alert('Success', 'File saved to Downloads with read-only permissions');
    } catch (copyError) {
      const errorMsg = `Download failed: ${copyError.message}`;
      Alert.alert('Download Error', errorMsg);
      console.error(errorMsg);
    }

  } catch (err) {
    const errorMsg = `Critical failure: ${err.message}\nStack: ${err.stack}`;
    Alert.alert(
      'Operation Failed',
      errorMsg,
      [{ text: 'OK' }],
      { cancelable: false }
    );
    console.error('Global Error:', errorMsg);
  }
};

function HomeScreenPO(props) {
  const check = () => {
    props.navigation.navigate('VoterCheck');
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
        Verify Voter and Upload Voter Receipt
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

