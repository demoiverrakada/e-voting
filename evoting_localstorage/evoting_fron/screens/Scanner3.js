import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import postVote from '../func/postVote.js';

export default function Scanner3(props) {
  const commitments = props.route.params.commitments;
  const booth_num=props.route.params.booth_num;
  const checkSend = async (qrcodedata) => {
    try {
      const data=await postVote(qrcodedata,commitments,booth_num);
      if (data.message) {
        Alert.alert('Successful', 'Your vote has been uploaded', [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      } else {
        Alert.alert("Vote was not recorded", data.err, [{ text: 'OK' }], { cancelable: false });
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
      <Text style={styles.headerText}>Scan voter receipt</Text>
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
