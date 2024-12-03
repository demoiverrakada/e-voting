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
    backgroundColor: '#A1D6E2',
    justifyContent: 'center',
    padding: 16,
  },
  headerText: {
    fontSize: 35,
    marginLeft: 18,
    marginTop: 10,
    color: '#3b3b3b',
  },
  marker: {
    borderColor: '#1995AD',
    borderRadius: 10,
  },
  button: {
    marginTop: 20,
    marginHorizontal: 18,
    backgroundColor: '#D9534F',
    borderRadius: 25,
    elevation: 3,
  },
  buttonLabel: {
    color: '#F1F1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});










