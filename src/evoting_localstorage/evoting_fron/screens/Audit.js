import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';

import audit from '../func/audit.js';

export default function Scanner(props) {

  const checkSend = async (qrcodedata) => {
    try {
        const data=await audit(qrcodedata);     
      console.log(data);
    
        if (data.message === 'Scanned') {
          Alert.alert(
            'Ballot scanned successfully',
            'Scan next ballot',
            [{ text: 'OK', onPress: () => props.navigation.navigate('audit') }],
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
    backgroundColor: '#A1D6E2', // Light calming background color
    justifyContent: 'center', // Centers content vertically
    paddingHorizontal: 16, // Adds horizontal padding for better layout
  },
  headerText: {
    fontSize: 35, // Larger font size for the header to stand out
    marginLeft: 18, // Adds left margin for spacing from the edge
    marginTop: 10, // Top margin to create space between header and top of screen
    color: '#3b3b3b', // Dark gray color for header for contrast and readability
    fontWeight: '700', // Bold font for emphasis
    textAlign: 'center', // Centers the header text for better alignment
    letterSpacing: 0.5, // Adds slight spacing for cleaner text rendering
  },
  marker: {
    borderColor: '#1995AD', // Blue border to make the marker visually distinct
    borderWidth: 1, // Border width for visibility
    borderRadius: 10, // Rounded corners for a softer, modern look
    padding: 12, // Adds padding inside the marker for content spacing
  },
  button: {
    marginTop: 20, // Top margin to separate button from other content
    marginHorizontal: 18, // Horizontal margin for symmetrical button placement
    backgroundColor: '#D9534F', // Red background for a bold button look
    borderRadius: 25, // Rounded corners for a sleek, modern design
    elevation: 3, // Shadow effect for depth and interaction feedback
    paddingVertical: 14, // Vertical padding to make the button larger and easier to click
  },
  buttonLabel: {
    color: '#F1F1F2', // Light-colored text for contrast against the red button
    fontSize: 16, // Standard font size for button text
    fontWeight: 'bold', // Bold text for better visibility
    textAlign: 'center', // Centers the text inside the button
  },
});