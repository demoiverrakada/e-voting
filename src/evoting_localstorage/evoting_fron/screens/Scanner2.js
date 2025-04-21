import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import checkReceipt2 from '../func/checkReceipt2.js';

export default function Scanner(props) {
  const [scannedData, setScannedData] = useState(null);
  const [showScanner, setShowScanner] = useState(false); // Start with scanner hidden
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [isInitialized, setIsInitialized] = useState(false);

  // Add initialization delay
  useEffect(() => {
    const initTimeout = setTimeout(() => {
      setIsLoading(false);
      setShowScanner(true);
      setIsInitialized(true);
    }, 1000); // 1-second initialization delay

    return () => clearTimeout(initTimeout);
  }, []);

  const checkSend = async (qrcodedata) => {
    // ... keep existing checkSend implementation unchanged ...
  };

  const handleScan = (data) => {
    if (!isInitialized) return; // Prevent immediate scanning
    
    setShowScanner(false);
    setScannedData(data);

    // Add scan confirmation delay
    setTimeout(() => {
      Alert.alert(
        'Confirm Scan',
        'Is this scan correct?',
        [
          {
            text: 'Rescan',
            onPress: () => {
              setScannedData(null);
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                setShowScanner(true);
              }, 1000);
            }
          },
          {
            text: 'Proceed',
            onPress: async () => {
              await checkSend(data.data);
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                setShowScanner(true);
              }, 1000);
            }
          }
        ],
        { cancelable: false }
      );
    }, 500); // 0.5-second delay before showing alert
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Scan Receipt QR Code</Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1995AD" />
          <Text style={styles.loadingText}>Initializing scanner...</Text>
        </View>
      ) : showScanner ? (
        <QRCodeScanner
          key={Date.now()}
          onRead={handleScan}
          showMarker={true}
          reactivate={true} // Enable reactivation
          reactivateTimeout={2500} // Longer reactivation timeout
          markerStyle={styles.marker}
          cameraStyle={styles.camera}
          topViewStyle={styles.topView}
          bottomViewStyle={styles.bottomView}
          fadeIn={true} // Enable fade-in animation
        />
      ) : null}
    </View>
  );
}

// Keep styles unchanged


