import React from 'react';
import { Button } from 'react-native-paper';
import { StyleSheet, View, StatusBar } from 'react-native';
import RNFS from 'react-native-fs';

const writeFilePath = `${RNFS.DocumentDirectoryPath}/updated_data.json`;

const extractVotesToExternalStorage = async () => {
  try {
    // Check if the source file exists
    const fileExists = await RNFS.exists(writeFilePath);
    if (!fileExists) {
      console.error('Source file does not exist:', writeFilePath);
      return;
    }

    const destPath = `${RNFS.ExternalDirectoryPath}/updated_data.json`;
    await RNFS.copyFile(writeFilePath, destPath);
    console.log(`File copied to: ${destPath}`);
  } catch (err) {
    console.error('Error copying file:', err);
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
        Verify Voter
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
        Scan Auditted Ballots
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
