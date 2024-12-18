import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';

export default function BoothNum(props) {
    const commitments = props.route.params.commitments;
  
    const checkSend = async (qrcodedata) => {
      try {
        console.log("here I am")
        console.log(qrcodedata);
  
            console.log("successfully submitted booth login");
            Alert.alert(
              'Booth Number successfully identified',
              "choose voter preference",
              [{ text: 'OK', onPress: () => props.navigation.navigate('scanner3', {commitments: commitments, booth_num:qrcodedata }) }],
              { cancelable: false }
            );
          
      } catch (err) {
        console.log("some problem in posting", err);
        Alert.alert('Booth Num Scanning unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
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
      backgroundColor: '#A1D6E2', // Light calming blue background for a refreshing look
      justifyContent: 'center', // Center content vertically
      paddingHorizontal: 16, // Horizontal padding for better spacing on small screens
    },
    headerText: {
      fontSize: 35, // Large text size for better readability
      marginLeft: 18, // Left margin for spacing
      marginTop: 10, // Top margin to separate from other elements
      color: '#3b3b3b', // Dark gray color for the header for contrast
      fontWeight: '700', // Bold text for prominence
      textAlign: 'center', // Center the text horizontally
      letterSpacing: 0.5, // Slightly spaced letters for a cleaner design
    },
    marker: {
      borderColor: '#1995AD', // Blue border color to highlight the marker
      borderWidth: 1, // Border width for visibility
      borderRadius: 10, // Rounded corners for a softer look
      padding: 10, // Padding inside the marker for better content alignment
    },
    button: {
      marginTop: 20, // Space above the button
      marginHorizontal: 18, // Space on the left and right for symmetry
      backgroundColor: '#D9534F', // Red background for a contrasting button
      borderRadius: 25, // Rounded corners for a smooth, modern look
      elevation: 3, // Shadow for depth effect
      paddingVertical: 14, // Vertical padding to increase the clickable area
    },
    buttonLabel: {
      color: '#F1F1F2', // Light-colored text for visibility against the red button
      fontSize: 16, // Standard text size for button labels
      fontWeight: 'bold', // Bold text for emphasis
      textAlign: 'center', // Center text inside the button
    },
  });