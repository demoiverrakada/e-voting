import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

export default function Scanner(props) {
  const commitments = props.route.params.commitments;
  const [lastScannedData, setLastScannedData] = useState(null);

  const checkSend = async (qrcodedata) => {
    try {
      console.log(qrcodedata);
      console.log("Successfully submitted ballot_id login");
      Alert.alert(
        "Ballot ID successfully identified",
        "Do you want to proceed or rescan?",
        [
          { text: 'Rescan', onPress: () => setLastScannedData(null) },
          { text: 'Proceed', onPress: () => props.navigation.navigate("elect", { commitments: commitments, bid: qrcodedata }) },
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.log("Some problem in posting", err);
      Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("start");
    }
  };

  const isValidQRCode = (data) => {
    return data !== undefined && data !== null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Scan Ballot ID on the VVPAT side of the Ballot</Text>
      <QRCodeScanner
        onRead={async ({ data }) => {
          if (isValidQRCode(data)) {
            setLastScannedData(data);
            await checkSend(data);
            console.log('Valid QR code detected:', data);
          } else {
            console.log('Invalid QR code detected:', data);
            Alert.alert('Invalid QR Code', 'Please scan a valid QR code.', [{ text: 'OK' }], { cancelable: false });
          }
        }}
        showMarker={true}
        markerStyle={styles.marker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    backgroundColor: "#f5f5f5", // Changed from #F2F7FC to match target style
  },
  headerText: {
    fontSize: 22, // Reduced from 30 to match target style
    fontWeight: "bold",
    color: "#6200ea", // Changed from #4A90E2 to purple theme
    textAlign: "center",
    marginBottom: 25,
    letterSpacing: 1, // Slightly reduced from original
  },
  marker: {
    borderColor: '#6200ea', // Updated to purple theme
    borderWidth: 2,
    // Added shadow effects for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  button: {
    marginTop: 25, // Increased from 20
    paddingVertical: 14, // Increased from 12
    borderRadius: 25,
    backgroundColor: "#6200ea", // Changed to purple theme
    // Enhanced shadow effects
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Increased from 4
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase", // Added to match target style
  },
  alert: {
    fontSize: 16,
    textAlign: "center",
    color: "#444", // Changed from #333 to softer color
    fontStyle: "italic", // Added for emphasis
  },
});
