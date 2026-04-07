import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, PermissionsAndroid, Platform, AppState } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { useFocusEffect } from '@react-navigation/native';

export default function BallotDetails(props) {
  const [isScannerActive, setIsScannerActive] = useState(true);
  const [scanned, setScanned] = useState(false); // ✅ FIXED
  const scannerRef = useRef(null);

  // ✅ Request camera permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // ✅ Reset scanner when screen is focused
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const hasPermission = await requestCameraPermission();

        if (!hasPermission) {
          Alert.alert("Permission Denied", "Camera access is required");
          return;
        }

        setIsScannerActive(true);
        setScanned(false); // ✅ reset scan state

        setTimeout(() => {
          scannerRef.current?.reactivate?.();
        }, 500);
      };

      init();

      return () => setIsScannerActive(false);
    }, [])
  );

  // ✅ Handle app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        scannerRef.current?.reactivate?.();
      }
    });

    return () => subscription.remove();
  }, []);

  // ✅ Handle QR scan
  const handleScan = (e) => {
    if (scanned) return;

    setScanned(true);

    try {
      const rawData = e.data || e.rawValue;

      console.log("RAW QR:", rawData); // 🔥 DEBUG

      let parsed;

      // Try JSON parse
      try {
        parsed = JSON.parse(rawData);
      } catch {
        // fallback if comma-separated
        parsed = rawData.split(',');
      }

      if (!Array.isArray(parsed) || parsed.length < 3) {
        throw new Error("Invalid QR format");
      }

      const [election_id, commitment, bid] = parsed;

      if (!election_id || !commitment || !bid) {
        throw new Error("Invalid QR values");
      }

      // ✅ FIXED: send correct structure
      props.navigation.navigate('audit', {
        audit_data: [election_id, commitment, bid]
      });

    } catch (err) {
      console.log("QR Error:", err);
      Alert.alert("Invalid QR Code");
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Receipt Challenge</Text>
      <Text style={styles.subheading}>Scan Challenged Receipt QR</Text>

      {isScannerActive && (
        <QRCodeScanner
          ref={scannerRef}
          onRead={handleScan}
          showMarker
          markerStyle={styles.marker}
          fadeIn={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6200ea",
    textAlign: "center",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#444",
  },
  marker: {
    borderColor: "#6200ea",
    borderWidth: 3,
    borderRadius: 10,
  },
});