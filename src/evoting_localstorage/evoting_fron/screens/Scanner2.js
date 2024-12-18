import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';

import checkReceipt2 from '../func/checkReceipt2.js';

export default function Scanner(props) {

  const checkSend = async (qrcodedata) => {
    try {
        const data=await checkReceipt2(qrcodedata);     
      console.log(data);
    
        if (data.message === 'Ballot exists and verified successfully. Go inside the booth.') {
          console.log("successfully submitted voter receipt");
          Alert.alert(
            'Ballot successfully verified',
            'Scan Booth Number',
            [{ text: 'OK', onPress: () => props.navigation.navigate('booth_num', { commitments: qrcodedata }) }],
            { cancelable: false }
          );
        }
      else {
        Alert.alert('Error', data.error, [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      }
    } catch (err) {
      console.log("some problem in posting", err);
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("homePO");
    }
  };

  const logout = async () => {
    props.navigation.navigate('homePO');
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
            console.log('Valid QR code detected:', data);
          } else {
            console.log('Invalid QR code detected:', data);
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
        Go to Home
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1D6E2', // Retains a clean, calming background
    justifyContent: 'center',
    paddingHorizontal: 20, // Increased padding for improved responsiveness
    paddingVertical: 16, // Balanced vertical padding
  },
  headerText: {
    fontSize: 36, // Slightly increased for better emphasis
    marginLeft: 20, // Adjusted for alignment with modern spacing trends
    marginTop: 15, // Added more breathing room at the top
    color: '#3B3B3B', // Dark gray for better contrast
    fontWeight: '700', // Bold weight for improved visual hierarchy
    letterSpacing: 1, // Subtle letter spacing for better readability
  },
  marker: {
    borderColor: '#1995AD', // Maintains the distinct blue-green color
    borderWidth: 2, // Added border width for a more prominent marker
    borderRadius: 12, // Slightly increased rounding for a polished look
    padding: 5, // Added padding to create breathing room within the marker
    alignSelf: 'center', // Centers the marker for balanced design
  },
  button: {
    marginTop: 25, // Increased for better spacing from other components
    marginHorizontal: 20, // Consistent horizontal margin
    backgroundColor: '#D9534F', // Bold red for high visibility
    borderRadius: 30, // More rounded corners for a modern design
    elevation: 5, // Enhanced shadow for depth
    paddingVertical: 12, // Increased padding for better usability
  },
  buttonLabel: {
    color: '#FFFFFF', // Pure white for excellent contrast
    fontSize: 18, // Slightly larger font size for readability
    fontWeight: '600', // Balanced boldness for an elegant appearance
    textAlign: 'center', // Ensures alignment within the button
    letterSpacing: 0.8, // Subtle spacing for a polished look
  },
});
