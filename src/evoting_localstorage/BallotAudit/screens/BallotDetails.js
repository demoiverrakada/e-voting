import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { useFocusEffect } from '@react-navigation/native';

export default function Scanner(props) {
  const [isScannerActive, setIsScannerActive] = useState(true);
  const scannerRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      setIsScannerActive(true);
      return () => setIsScannerActive(false);
    }, [])
  );

  const handleScan = async ({ data }) => {
    if (!isScannerActive) return;

    if (isValidQRCode(data)) {
      setIsScannerActive(false);
      Alert.alert(
        "Encrypted candidate ID's scanned successfully",
        "Do you want to proceed or rescan?",
        [
          {
            text: 'Rescan',
            onPress: () => {
              setIsScannerActive(true);
              setTimeout(() => {
                scannerRef.current?.reactivate();
              }, 1000); // Changed to 1 second
            },
          },
          {
            text: 'Proceed',
            onPress: () => {
              props.navigation?.navigate?.("bid", { commitments: data });
            }
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        'Invalid QR Code',
        'Please scan a valid QR code.',
        [{ text: 'OK', onPress: () => {
          setIsScannerActive(true);
          setTimeout(() => {
            scannerRef.current?.reactivate();
          }, 1000); // Changed to 1 second
        }}],
        { cancelable: false }
      );
    }
  };

  const isValidQRCode = (data) => {
    return typeof data === 'string' && data.trim() !== '';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appHeading}>Ballot Audit App</Text>
      <Text style={styles.headerText}>
        Scan Encrypted Candidate ID's on the Receipt side of the Ballot
      </Text>

      {isScannerActive && (
        <QRCodeScanner
          ref={scannerRef}
          onRead={handleScan}
          showMarker={true}
          markerStyle={styles.marker}
        />
      )}
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
  appHeading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6200ea", // Purple theme for consistency
    textAlign: "center",
    marginBottom: 15, // Space below heading
    letterSpacing: 2, // Slight spacing for better readability
    textTransform: "uppercase", // Make it look bold and official
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
});

