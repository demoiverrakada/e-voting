import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import checkReceipt from '../func/checkReceipt.js';

export default function Scanner(props) {
  const checkSend = async (qrcodedata) => {
    const voter_id = props.route.params.entryNum;
    try {
      const data=await checkReceipt(qrcodedata,voter_id);
        if (data.message === 'Ballot exists and verified successfully. Go inside the booth.') {
          Alert.alert('Proceed to vote', "Go inside the booth to vote", [{ text: 'OK' }], { cancelable: false });
          props.navigation.navigate("homePO");
        }
       else {
        Alert.alert('Error', data.error, [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      }
    } catch (err) {
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("homePO");
    }
  };

  const logout = async () => {
    props.navigation.navigate("homePO");
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
        Go back to Home
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1D6E2', // Soft blue background for a clean, calming UI
    justifyContent: 'center',
    paddingHorizontal: 20, // Improved responsiveness with better padding
    paddingVertical: 16, // Balanced vertical spacing
  },
  headerText: {
    fontSize: 36, // Slightly larger for emphasis
    marginLeft: 20, // Increased for alignment with modern spacing trends
    marginTop: 15, // Added more breathing room from the top
    color: '#3B3B3B', // Retained dark gray for better contrast
    fontWeight: '700', // Added weight for a bolder appearance
    letterSpacing: 1.1, // Improved readability with subtle spacing
  },
  marker: {
    borderColor: '#1995AD', // Highlighted blue-green for distinction
    borderWidth: 2, // Added border width for a more defined marker
    borderRadius: 12, // Slightly more rounded for a polished look
    padding: 5, // Added padding for a cleaner design
    alignSelf: 'center', // Centered marker for better alignment
  },
  button: {
    marginTop: 25, // Increased top margin for better spacing
    marginHorizontal: 20, // Balanced horizontal spacing
    backgroundColor: '#D9534F', // Bold red for attention-grabbing call-to-action
    borderRadius: 30, // Modern rounded design
    elevation: 5, // Enhanced shadow for better depth
    paddingVertical: 12, // Increased padding for accessibility and comfort
  },
  buttonLabel: {
    color: '#FFFFFF', // White for better contrast
    fontSize: 18, // Slightly larger font size for improved readability
    fontWeight: '600', // Balanced weight for a cleaner look
    textAlign: 'center', // Ensures proper alignment within the button
    letterSpacing: 0.8, // Subtle spacing for improved aesthetics
  },
});










