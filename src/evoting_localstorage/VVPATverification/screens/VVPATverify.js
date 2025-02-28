import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { Button } from 'react-native-paper';

const parseStringToArray = (str) => {
  return str
    .slice(1, -1) // Remove the square brackets
    .split(",")
    .map(item => item.trim().replace(/^['"]|['"]$/g, ''));
};

export default function VVPATVerify(props) {
  const [scannedBid, setScannedBid] = useState(null);
  const [electionId, setElectionId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleQRScan = ({ data }) => {
    try {
      const bidArray = parseStringToArray(data);
      if (bidArray.length > 0) {
        setScannedBid(bidArray[0]);
        Alert.alert("QR Scanned Successfully", "Ballot ID captured. Now enter Election ID.");
      }
    } catch (error) {
      Alert.alert("Invalid QR Code", "Please scan a valid ballot ID QR code");
    }
  };

  const verifyVVPAT = async () => {
    if (!scannedBid || !electionId) {
      Alert.alert("Missing Information", "Please scan a ballot ID and enter election ID");
      return;
    }

    try {
      const response = await fetch("http://192.168.1.8:7000/vvpat", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bid: scannedBid,
          election_id: electionId
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.results) {
          setVerificationResult({ type: 'failure', message: data.results });
        } else {
          setVerificationResult({
            type: 'success',
            message: `Candidate: ${data.cand_name}\nVote ID: ${data.extended_vote}`
          });
        }
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      setVerificationResult({ type: 'error', message: error.message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>VVPAT Verification</Text>
      
      <QRCodeScanner
        onRead={handleQRScan}
        showMarker={true}
        markerStyle={styles.marker}
        containerStyle={styles.scannerContainer}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Enter Election ID"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={electionId}
        onChangeText={setElectionId}
      />

      {scannedBid && (
        <Text style={styles.scannedText}>Scanned Ballot ID: {scannedBid}</Text>
      )}

      <Button
        mode="contained"
        onPress={verifyVVPAT}
        style={styles.verifyButton}
        labelStyle={styles.buttonLabel}
        disabled={!scannedBid || !electionId}
      >
        Verify Vote
      </Button>

      {verificationResult && (
        <View style={[
          styles.resultContainer,
          verificationResult.type === 'success' && styles.successContainer,
          verificationResult.type === 'error' && styles.errorContainer
        ]}>
          <Text style={styles.resultText}>
            {verificationResult.message}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FA',
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },
  scannerContainer: {
    height: 300,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  scannedText: {
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 15,
  },
  verifyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 20,
  },
  buttonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

