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
