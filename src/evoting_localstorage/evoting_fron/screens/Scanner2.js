import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import checkReceipt2 from '../func/checkReceipt2.js';

export default function Scanner(props) {
  const [scannedData, setScannedData] = useState(null);
  const [showScanner, setShowScanner] = useState(false); // Start with scanner hidden
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initTimeout = setTimeout(() => {
      setIsLoading(false);
      setShowScanner(true);
      setIsInitialized(true);
    }, 1000); // 1-second initialization delay

    return () => clearTimeout(initTimeout);
  }, []);
  const checkSend = async (qrcodedata) => {
    try {
      const { voter_id, election_id, remainingElections, currentIndex } = props.route.params;
      
      let firstArray = '';
      for (let i = 1; i < qrcodedata.length; i++) {
        const char = qrcodedata[i];
        if (char === ']') {
          firstArray += char;
          break;
        }
        firstArray += char;
      }

      const data = await checkReceipt2(firstArray);
      
      if (data.message === 'Ballot exists and verified successfully.') {
        Alert.alert(
          'Encrypted candidate ID successfully verified',
          'Enter the voter preference number',
          [{
            text: 'OK', 
            onPress: () => props.navigation.navigate('scanner3', {
              commitments: qrcodedata,
              election_id,
              voter_id,
              remainingElections,
              currentIndex
            })
          }],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', data.error, [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      }
    } catch (err) {
      console.log("Some problem in posting", err);
      Alert.alert(
        'Error', 
        'Data Upload unsuccessful, try again', 
        [{ text: 'OK' }], 
        { cancelable: false }
      );
      props.navigation.navigate("homePO");
    }
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
    marginTop: 25,
    marginHorizontal: 20,
    backgroundColor: '#D9534F',
    borderRadius: 30,
    elevation: 5,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  // New styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#1995AD',
    textAlign: 'center',
  },
  camera: {
    height: '100%',
  },
  topView: {
    flex: 0,
    height: 0,
  },
  bottomView: {
    flex: 0,
    height: 0,
  },
});