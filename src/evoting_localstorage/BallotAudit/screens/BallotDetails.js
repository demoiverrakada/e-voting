import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Parses the QR data string in format: [['hash1', 'hash2', ...], bid]
 * Returns { commitment: string[], bid: string } or null on failure.
 */
function parseQRData(rawData) {
  try {
    // Extract 64-char hex hashes
    const hashRegex = /['"]([a-f0-9]{64})['"]/g;
    const commitment = [];
    let match;
    while ((match = hashRegex.exec(rawData)) !== null) {
      commitment.push(match[1]);
    }

    // Extract bid: the large number after the hash array closes, i.e. after '], '
    const bidMatch = rawData.match(/\],\s*(\d+)\s*\]/);
    const bid = bidMatch ? bidMatch[1] : null;

    if (commitment.length === 0 || !bid) return null;
    return { commitment, bid };
  } catch {
    return null;
  }
}

export default function Scanner(props) {
  const [isScannerActive, setIsScannerActive] = useState(true);
  const scannerRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      setIsScannerActive(true);
      return () => setIsScannerActive(false);
    }, [])
  );

  const reactivateScanner = () => {
    setIsScannerActive(true);
    setTimeout(() => scannerRef.current?.reactivate(), 1000);
  };

  const handleScan = async ({ data }) => {
    if (!isScannerActive) return;

    const parsed = parseQRData(data);
    if (parsed) {
      setIsScannerActive(false);
      Alert.alert(
        "Ballot QR scanned successfully",
        "Do you want to proceed or rescan?",
        [
          { text: 'Rescan', onPress: reactivateScanner },
          {
            text: 'Proceed',
            onPress: () => {
              props.navigation?.navigate?.("elect", {
                commitment: parsed.commitment,
                bid: parsed.bid,
              });
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        'Invalid QR Code',
        'Could not parse ballot data from QR code.',
        [{ text: 'OK', onPress: reactivateScanner }],
        { cancelable: false }
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appHeading}>Ballot Audit App</Text>
      <Text style={styles.headerText}>
        Scan the Ballot QR Code
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
    backgroundColor: "#f5f5f5",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6200ea",
    textAlign: "center",
    marginBottom: 25,
    letterSpacing: 1,
  },
  appHeading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6200ea",
    textAlign: "center",
    marginBottom: 15,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  marker: {
    borderColor: '#6200ea',
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});

