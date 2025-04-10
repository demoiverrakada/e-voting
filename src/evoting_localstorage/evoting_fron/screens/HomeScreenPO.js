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
      if (Platform.Version >= 33) { // Android 13+
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ];
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'Application needs access to your storage to download files',
            buttonPositive: 'Grant Permission',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  } catch (err) {
    console.error('Permission request error:', err);
    return false;
  }
};

// Function to get a unique filename if file already exists
const getUniqueFilename = async (basePath, baseName, extension) => {
  let counter = 0;
  let filePath = `${basePath}/${baseName}${extension}`;
  
  while (await RNFS.exists(filePath)) {
    counter++;
    filePath = `${basePath}/${baseName}(${counter})${extension}`;
  }
  
  return filePath;
};

const extractVotesToExternalStorage = async () => {
  try {
    // First request permissions
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Storage permissions are required to save files.'
      );
      return;
    }

    const initialHash = '12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126';
    const fileGenerationTimestamp = new Date().toISOString();

    // Check source file existence
    const fileExists = await RNFS.exists(writeFilePath);
    if (!fileExists) {
      // Create an empty array if file doesn't exist (to prevent errors)
      await RNFS.writeFile(writeFilePath, JSON.stringify([]), 'utf8');
      console.log("Created empty votes file since it didn't exist");
    }

    // Read and parse file
    let fileContents;
    try {
      fileContents = await RNFS.readFile(writeFilePath, 'utf8');
    } catch (readError) {
      // If read fails, create an empty array
      fileContents = JSON.stringify([]);
      console.warn(`Failed to read file: ${readError.message}. Using empty data.`);
    }

    let votesData;
    try {
      votesData = JSON.parse(fileContents);
      // Ensure votesData is always an array
      if (!Array.isArray(votesData)) {
        votesData = [];
      }
    } catch (parseError) {
      votesData = [];
      console.warn(`Invalid JSON format: ${parseError.message}. Using empty data.`);
    }

    let currentHash = initialHash;
    try {
      for (const vote of votesData) {
        // Include all vote properties including timestamp but excluding hash_value
        const voteWithoutHash = {
          election_id: vote.election_id || '',
          voter_id: vote.voter_id || '',
          booth_num: vote.booth_num || '',
          commitment: vote.commitment || '',
          pref_id: vote.pref_id || '',
          timestamp: vote.timestamp || new Date().toISOString()
        };
        const voteHash = await sha256(JSON.stringify(voteWithoutHash));
        currentHash = await sha256(currentHash + voteHash);
      }
    } catch (hashError) {
      console.warn(`Hashing failed: ${hashError.message}. Using initial hash.`);
      // Continue with initial hash if hashing fails
    }

    // Apply the final hash to all votes and add file generation timestamp
    const finalUpdatedVotesData = {
      votes: votesData.map(vote => ({
        election_id: vote.election_id || '',
        voter_id: vote.voter_id || '',
        booth_num: vote.booth_num || '',
        commitment: vote.commitment || '',
        pref_id: vote.pref_id || '',
        timestamp: vote.timestamp || new Date().toISOString(),
        hash_value: currentHash
      })),
      file_generation_timestamp: fileGenerationTimestamp,
      final_hash: currentHash
    };

    // Determine which directory to use
    // For Android 10+ we need to use ExternalDirectoryPath
    // (app-specific external storage)
    let destPath;
    
    if (Platform.OS === 'android') {
      try {
        // First try Downloads directory (with unique filename)
        const downloadsDir = RNFS.DownloadDirectoryPath;
        destPath = await getUniqueFilename(downloadsDir, 'updated_data', '.json');
        
        // Write to Downloads directory
        await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');
        console.log(`File saved successfully to: ${destPath}`);
        Alert.alert('Success', `File saved to Downloads: ${destPath.split('/').pop()}`);
        return;
      } catch (writeError) {
        console.warn(`Could not write to Downloads: ${writeError.message}. Trying app directory.`);
        
        // Fall back to app-specific external directory
        try {
          const externalDir = RNFS.ExternalDirectoryPath;
          destPath = await getUniqueFilename(externalDir, 'updated_data', '.json');
          await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');
          console.log(`File saved successfully to app directory: ${destPath}`);
          Alert.alert('Success', `File saved to app directory. You can find it in your file manager at Android/data/[your-app-package]/files`);
          return;
        } catch (appDirError) {
          console.error(`Failed to write to app directory: ${appDirError.message}`);
          throw appDirError;
        }
      }
    } else {
      // iOS handling
      destPath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;
      await RNFS.writeFile(destPath, JSON.stringify(finalUpdatedVotesData), 'utf8');
      Alert.alert('Success', 'File saved successfully');
    }

  } catch (err) {
    const errorMsg = `Operation failed: ${err.message}`;
    Alert.alert(
      'Download Error',
      errorMsg,
      [{ text: 'OK' }],
      { cancelable: false }
    );
    console.error('Global Error:', errorMsg);
  }
};

function HomeScreenPO(props) {
  useEffect(() => {
    // Request permissions when component mounts
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


