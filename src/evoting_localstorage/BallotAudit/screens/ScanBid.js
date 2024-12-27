import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

export default function Scanner(props) {
  const commitments = props.route.params.commitments;

  const checkSend = async (qrcodedata) => {
    try {
      console.log(qrcodedata);
      console.log("successfully submitted ballot_id login");
      Alert.alert(
        "Ballot ID successfully identified",
        "Audit ballot next",
        [{ text: 'OK', onPress: () => props.navigation.navigate("audit", { commitments: commitments, bid: qrcodedata }) }],
        { cancelable: false }
      );
    } catch (err) {
      console.log("some problem in posting", err);
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("start");
    }
  };

  const isValidQRCode = (data) => {
    if (data == undefined) {
      return false;
    } else {
      return true;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Scan Ballot ID</Text>
      <QRCodeScanner
        onRead={async ({ data }) => {
          if (isValidQRCode(data)) {
            await checkSend(data);
            console.log('Valid QR code detected:', data);
          } else {
            console.log('Invalid QR code detected:', data);
          }
        }}
        showMarker={true}
        markerStyle={styles.marker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7FC', // Lighter background for a clean look
    justifyContent: 'center', // Center the content vertically
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 30, // Larger font size for header
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25, // Extra space between header and scanner
    color: '#4A90E2', // Soft blue color for the header
    letterSpacing: 1.5,
  },
  marker: {
    borderColor: '#4A90E2', // Blue border for the scanner marker
    borderWidth: 2,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#4A90E2', // Button matches the header color
    elevation: 4,
  },
  buttonLabel: {
    color: '#F1F1F2', // Light color text for the button
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alert: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333', // Darker color for alert text
  },
});
