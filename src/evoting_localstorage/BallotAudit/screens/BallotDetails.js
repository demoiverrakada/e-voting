import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

export default function Scanner(props) {

  const checkSend = async (qrcodedata) => {
    try {
      console.log(qrcodedata);
      console.log("successfully submitted ballot_id login");
      Alert.alert(
        'Booth Number successfully identified',
        `commitments: ${qrcodedata}`,
        [{ text: 'OK', onPress: () => props.navigation.navigate('booth', { commitments: qrcodedata }) }],
        { cancelable: false }
      );
    } catch (err) {
      console.log("some problem in posting", err);
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("start");
    }
  }

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
    backgroundColor: '#F5F8FC', // Lighter background for a fresh look
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#4A90E2', // Subtle blue color
    letterSpacing: 1.2,
  },
  marker: {
    borderColor: '#4A90E2', // Blue border for the marker
    borderWidth: 2,
  },
  button: {
    marginBottom: 10,
    borderRadius: 25,
    backgroundColor: '#4A90E2', // Blue button for consistency
    paddingVertical: 12,
    elevation: 4,
  },
  buttonLabel: {
    color: '#F1F1F2', // Light color for text on button
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alert: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});
