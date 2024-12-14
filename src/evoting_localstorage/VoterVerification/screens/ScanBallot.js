import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';

export default function Scanner(props) {
  const checkSend = async (qrcodedata) => {
    const voter_id = props.route.params.voter_id;
    try {
        Alert.alert(
            'Ballot scanning successful',
            "scan your preference next",
            [{ text: 'OK', onPress: () => props.navigation.navigate('scanner3', {voter_id: voter_id,commitment:qrcodedata }) }],
            { cancelable: false }
          );
    } catch (err) {
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("scanner");
    }
  };

  const logout = async () => {
    props.navigation.navigate("scanner");
  };

  const isValidQRCode = (data) => {
    return data !== undefined;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Scan ballot</Text>
      <QRCodeScanner
        onRead={async ({ data }) => {
          if (isValidQRCode(data)) {
            await checkSend(data);
            console.log("Valid QR code detected:", data);
          } else {
            console.log("Invalid QR code detected:", data);
          }
        }}
        showMarker={true}
        markerStyle={styles.marker}
      />
      <Button
        mode="contained"
        onPress={logout}
        style={styles.button}
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
    backgroundColor: '#F3F7FA', // Soft background color for a clean and modern look
    justifyContent: 'center',
    padding: 20,
  },
  headerText: {
    fontSize: 36,  // Slightly larger for better prominence
    marginLeft: 20,  // Adjusted for a better left margin
    marginTop: 15,  // Increased space from the top for better balance
    color: '#333',  // Softer color for better readability
    fontWeight: '600',  // A semi-bold font for a more modern look
    textAlign: 'center',  // Centered for symmetry
  },
  marker: {
    borderColor: '#4A90E2',  // Slightly softer, modern blue for the marker
    borderWidth: 3,  // Increased border width for clearer visibility
    borderRadius: 12,  // More rounded corners for a friendlier look
  },
  button: {
    marginTop: 25,  // Increased spacing from the QR code scanner for balance
    marginHorizontal: 20,
    backgroundColor: '#D9534F', // Retaining the red, but slightly more vibrant
    borderRadius: 30,  // Increased border radius for a smoother, modern look
    paddingVertical: 14,  // Increased padding for better tap targets
    shadowColor: '#000',  // Added shadow for better depth and focus
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  buttonLabel: {
    color: '#FFFFFF',  // Ensuring the button text stands out
    fontSize: 16,
    fontWeight: 'bold',  // Making the text bold to emphasize the action
    textTransform: 'uppercase',  // Uppercase for a more professional look
  },
});
