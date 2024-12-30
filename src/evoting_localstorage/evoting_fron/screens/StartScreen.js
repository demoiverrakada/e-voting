import React, { useState, useEffect } from 'react';
import { Button } from 'react-native-paper';
import {
  StatusBar,
  Text,
  View,
  KeyboardAvoidingView,
  StyleSheet,
  Alert,
  Platform, // Added Platform import
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

function StartScreen(props) {
  const [fileUploaded, setFileUploaded] = useState(false);

  useEffect(() => {
    const checkAppInitialization = async () => {
      try {
        const uploaded = await AsyncStorage.getItem('fileUploaded');
        if (uploaded === 'true') {
          setFileUploaded(true);
        }
      } catch (err) {
        console.error("Error checking app initialization: ", err);
      }
    };

    checkAppInitialization();
  }, []);

  const Admin = async () => {
    props.navigation.replace("loginAdmin");
  };

  const PO = async () => {
    props.navigation.replace("loginPO");
  };

  const uploadFile = async () => {
    if (fileUploaded) {
      Alert.alert("File already uploaded", "You can upload the file only once.");
      return;
    }

    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.json],
      });

      // Handle array result from newer versions of document picker
      const file = Array.isArray(res) ? res[0] : res;

      if (!file || !file.uri) {
        Alert.alert("Error", "Invalid file selection.");
        return;
      }

      console.log('Document selected:', file);

      try {
        // Fix URI for different platforms
        const sourceUri = Platform.select({
          ios: file.uri.replace('file://', ''),
          android: file.uri,
        });

        const destinationPath = `${RNFS.DocumentDirectoryPath}/data.json`;

        // Read and validate JSON before copying
        const fileContent = await RNFS.readFile(sourceUri, 'utf8');
        
        try {
          JSON.parse(fileContent); // Validate JSON format
        } catch (jsonError) {
          Alert.alert("Error", "The selected file is not a valid JSON file.");
          return;
        }

        // Check if file exists and delete it
        const fileExists = await RNFS.exists(destinationPath);
        if (fileExists) {
          await RNFS.unlink(destinationPath);
        }

        // Copy the validated file to destination
        await RNFS.copyFile(sourceUri, destinationPath);
        
        console.log('File copied to:', destinationPath);

        await AsyncStorage.setItem('fileUploaded', 'true');
        setFileUploaded(true);
        Alert.alert("Success", "File uploaded and validated successfully!");
      } catch (fileError) {
        console.error("File operation error:", fileError);
        Alert.alert("Error", "Failed to process the file. Please try again.");
      }

    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert("Cancelled", "File upload was cancelled.");
      } else {
        console.error("Document picker error:", err);
        Alert.alert("Error", "Failed to pick the document. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#A1D6E2" />
      <KeyboardAvoidingView behavior="position" style={styles.keyboardAvoidingView}>
        <Text style={styles.heading}>Welcome to Voting Portal</Text>
        <Button
          mode="contained"
          onPress={PO}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
          disabled={!fileUploaded}
        >
          Polling Officer Login
        </Button>
        <Button
          mode="contained"
          onPress={uploadFile}
          style={styles.uploadButton}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
          disabled={fileUploaded}
        >
          {fileUploaded ? "File loaded" : "Load data file to the app"}
        </Button>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1D6E2',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    color: '#1995AD',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 32,
    marginBottom: 40,
    letterSpacing: 1.2,
  },
  button: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#1995AD',
    borderRadius: 30,
    elevation: 5,
    paddingVertical: 12,
  },
  uploadButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    elevation: 5,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContent: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StartScreen;
