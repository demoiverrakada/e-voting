import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

export default function Scanner(props) {
  const checkSend = async (qrcodedata) => {
    try {
      const { voter_id, election_id, remainingElections, currentIndex } = props.route.params;
      let firstArray = '';

      // Extract the first array from qrcodedata
      for (let i = 1; i < qrcodedata.length; i++) {
        const char = qrcodedata[i];
        if (char === ']') {
          firstArray += char;
          break;
        }
        firstArray += char;
      }

      // Simulate API call to check receipt
      const data = await checkReceipt2(firstArray);

      if (data.message === 'Ballot exists and verified successfully.') {
        console.log("Successfully submitted voter receipt");
        Alert.alert(
          'Encrypted candidate ID successfully verified',
          'Enter the voter preference number',
          [
            {
              text: 'OK',
              onPress: () =>
                props.navigation.navigate('scanner3', {
                  commitments: qrcodedata,
                  election_id,
                  voter_id,
                  remainingElections,
                  currentIndex,
                }),
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', data.error, [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      }
    } catch (err) {
      console.log("Some problem in posting", err);
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("homePO");
    }
  };

  const handleQRCodeScanned = async (data) => {
    Alert.alert(
      'QR Code Scanned',
      'Do you want to proceed or rescan?',
      [
        {
          text: 'Rescan',
          onPress: () => console.log('Rescanning...'), // Simply dismisses alert to allow rescanning
        },
        {
          text: 'Proceed',
          onPress: async () => {
            await checkSend(data); // Proceed with processing the scanned QR code
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Scan Receipt QR Code</Text>
      <QRCodeScanner
        onRead={({ data }) => handleQRCodeScanned(data)} // Handle scanned QR code
        showMarker={true}
        markerStyle={styles.marker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1D6E2',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerText: {
    fontSize: 36,
    marginLeft: 20,
    marginTop: 15,
    color: '#3B3B3B',
    fontWeight: '700',
    letterSpacing: 1,
  },
  marker: {
    borderColor: '#1995AD',
    borderWidth: 2,
    borderRadius: 12,
    padding: 5,
    alignSelf: 'center',
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
