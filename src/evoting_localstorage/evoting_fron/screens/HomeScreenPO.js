import React, { useEffect } from 'react';
import { View, Alert, StyleSheet, PermissionsAndroid, Platform, StatusBar } from 'react-native';
import { Button } from 'react-native-paper';
import RNFS from 'react-native-fs';
import { sha256 } from 'react-native-sha256';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;

// Request storage permissions for Android
const requestStoragePermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        // Android 13+ — only necessary if dealing with media files (not needed for Downloads JSON)
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, // or skip entirely
          {
            title: 'Storage Permission Required',
            message: 'App needs permission to access storage to save files.',
            buttonPositive: 'Grant',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android 12 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs permission to access storage to save files.',
            buttonPositive: 'Grant',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    // iOS or other platforms
    return true;
  } catch (err) {
    console.error('Permission request error:', err);
    return false;
  }
};

const extractVotesToExternalStorage = async () => {
  try {
    const initialHash = '12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126';
    const fileGenerationTimestamp = new Date().toISOString();

    // Check permissions first
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      console.warn('Storage permission not granted. Attempting fallback...');
    }

    // Ensure the votes file exists
    const fileExists = await RNFS.exists(writeFilePath);
    if (!fileExists) {
      await RNFS.writeFile(writeFilePath, JSON.stringify([]), 'utf8');
      console.log("Created empty votes file since it didn't exist");
    }

    // Read file safely
    let fileContents = JSON.stringify([]);
    try {
      fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    } catch (readError) {
      console.warn(`Failed to read file: ${readError.message}. Using empty array.`);
    }

    // Parse JSON
    let votesData = [];
    try {
      const parsed = JSON.parse(fileContents);
      if (Array.isArray(parsed)) votesData = parsed;
    } catch (parseError) {
      console.warn(`Invalid JSON format: ${parseError.message}. Using empty array.`);
    }

    // Recompute hash
    let currentHash = initialHash;
    for (const vote of votesData) {
      const voteWithoutHash = {
        election_id: vote.election_id || '',
        voter_id: vote.voter_id || '',
        booth_num: vote.booth_num || '',
        commitment: vote.commitment || '',
        pref_id: vote.pref_id || '',
        timestamp: vote.timestamp || new Date().toISOString(),
      };
      const voteHash = await sha256(JSON.stringify(voteWithoutHash));
      currentHash = await sha256(currentHash + voteHash);
    }

    // Prepare data to write
    const finalUpdatedVotesData = {
      votes: votesData.map(vote => ({
        election_id: vote.election_id || '',
        voter_id: vote.voter_id || '',
        booth_num: vote.booth_num || '',
        commitment: vote.commitment || '',
        pref_id: vote.pref_id || '',
        timestamp: vote.timestamp || new Date().toISOString(),
        hash_value: currentHash,
      })),
      file_generation_timestamp: fileGenerationTimestamp,
      final_hash: currentHash,
    };

    let destPath = '';
    let writeSuccess = false;

    if (Platform.OS === 'android') {
      // Try Downloads directory first
      try {
        const downloadsDir = RNFS.DownloadDirectoryPath;
<<<<<<< HEAD
        destPath = `${downloadsDir}/updated_data.json`;
=======
        destPath = `${downloadsDir}/updated_data.json`; // Overwrite the file every time

>>>>>>> 8b5c03011b5d6d989dbffc491af37e58aeecaf89
        await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');
        Alert.alert('Success', `File saved in Downloads: ${destPath.split('/').pop()}`);
        writeSuccess = true;
      } catch (err1) {
        console.warn(`Downloads write failed: ${err1.message}`);
        // Try external app directory
        try {
          const externalDir = RNFS.ExternalDirectoryPath;
          destPath = `${externalDir}/updated_data.json`;
          await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');
          Alert.alert(
            'Success',
            'File saved to app directory. Locate it in: Android/data/[your-app-package]/files'
          );
          writeSuccess = true;
        } catch (err2) {
          console.error('App directory write failed:', err2.message);
        }
      }
    } else {
      // iOS or other platform
      destPath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;
      await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');
      Alert.alert('Success', 'File saved successfully');
      writeSuccess = true;
    }

    if (!writeSuccess) {
      Alert.alert('Download Error', 'Failed to save file to storage.');
    }

  } catch (err) {
    console.error('Global Error:', err.message);
    Alert.alert(
      'Download Error',
      `Unexpected failure: ${err.message}`,
      [{ text: 'OK' }],
      { cancelable: false }
    );
  }
};

function HomeScreenPO(props) {
  useEffect(() => {
    requestStoragePermission();
  }, []);

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
        style={[styles.button, { backgroundColor: '#D9534F' }]}
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



