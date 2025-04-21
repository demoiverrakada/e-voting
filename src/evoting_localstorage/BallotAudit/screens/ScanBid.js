import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

export default function Scanner(props) {
  const commitments = props.route.params.commitments;
  const [lastScannedData, setLastScannedData] = useState(null);
  const scannerRef = useRef(null);

  const checkSend = async (qrcodedata) => {
    try {
      Alert.alert(
        "Ballot ID successfully identified",
        "Do you want to proceed or rescan?",
        [
          {
            text: 'Rescan',
            onPress: () => {
              setLastScannedData(null);
              setTimeout(() => scannerRef.current?.reactivate(), 1000); // Changed to 1 second
            },
          },
          {
            text: 'Proceed',
            onPress: () => props.navigation.navigate("elect", {
              commitments: commitments,
              bid: qrcodedata,
            }),
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      Alert.alert(
        'Data Upload unsuccessful, try again',
        [{ text: 'OK' }],
        { cancelable: false }
      );
      props.navigation.navigate("start");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>
        Scan Ballot ID on the VVPAT side of the Ballot
      </Text>

      <QRCodeScanner
        ref={scannerRef}
        onRead={({ data }) => {
          if (data) {
            setLastScannedData(data);
            checkSend(data);
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
  camera: {
    height: '100%', // Ensures camera fills the screen properly
    width: '100%',
    alignSelf: 'center',
  },
});
