import React, { useEffect, useState } from 'react';
import { View, Text,StyleSheet,Alert,StatusBar } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

export default function Scanner(props){
    const commitments = props.route.params.commitments;
  const checkSend=async(qrcodedata)=>
  {
    try{
        console.log(qrcodedata);
        console.log("successfully submitted ballot_id login");
            Alert.alert(
              'Booth Number successfully identified',
              `booth_num: ${qrcodedata}`,
              [{ text: 'OK', onPress: () => props.navigation.navigate('bid', {commitments: commitments,booth_num:qrcodedata}) }],
              { cancelable: false }
            ); 
      }
  catch(err)
  {
    console.log("some problem in posting",err);
    Alert.alert('Data Upload unsuccessful, try again',[{ text: 'OK' }], { cancelable: false })
    props.navigation.navigate("start");
  }

  }

  const isValidQRCode = (data) => {
    if(data==undefined)
    {
      return false;
    }
    else
    {
      return true;
    }
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
    backgroundColor: '#A1D6E2',
    justifyContent: 'top',
    padding: 16,
  },
  title: {
    fontSize: 35,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  underline: {
    borderBottomColor: 'black',
    borderBottomWidth: 4,
    borderRadius: 10,
    alignSelf: 'center',
    width: 100,
    marginBottom: 10,
  },
  credentialsText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
    borderRadius: 25,
    elevation: 3,
  },
  buttonLabel: {
    color: '#F1F1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});