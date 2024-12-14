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
        'Booth Number successfully identified',
        `booth_num: ${qrcodedata}`,
        [{ text: 'OK', onPress: () => props.navigation.navigate('bid', { commitments: commitments, booth_num: qrcodedata }) }],
        { cancelable: false }
      );
    } catch (err) {
      console.log("some problem in posting", err);
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("start");
    }
  }

  const isValidQRCode = (data) => {
    return data !== undefined;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Scan Booth Number</Text>
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
    backgroundColor: '#F2F7FC', // Light blue for a clean, modern feel
    justifyContent: 'center', // Center the content vertically
    alignItems: 'center', // Center the content horizontally
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 30, // Larger font size for the header
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30, // Space between header and scanner
    color: '#4A90E2', // Soft blue color for the header
    letterSpacing: 1.5,
  },
  marker: {
    borderColor: '#4A90E2', // Blue color for the marker
    borderWidth: 2,
    borderRadius: 5,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#4A90E2', // Matching button color to the header
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
    color: '#333', // Dark color for alert text
  },
});
