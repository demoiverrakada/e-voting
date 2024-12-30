import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { Button } from 'react-native-paper';

const parseStringToArray = (str) => {
  return str
    .slice(1, -1) // Remove the square brackets at the start and end
    .split(",") // Split by commas
    .map((item) => item.trim().replace(/^['"]|['"]$/g, '')); // Trim whitespace and remove surrounding quotes
};

export default function VVPATVerify(props) {
  // State to store the result
  const [verificationResult, setVerificationResult] = useState(null);

  const checkSend = async (qrcodedata) => {
    const ballot_id = parseStringToArray(qrcodedata);
    const bid = ballot_id[0];
    const requestBody = {
      bid: bid,
    };

    try {
      const response = await fetch("http://192.168.1.8:7000/vvpat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.results) {
          // Case 1: Verification failure
          setVerificationResult({ type: 'failure', message: data.results });
        } else if (data.cand_name && data.extended_vote) {
          // Case 2: Successful verification
          setVerificationResult({
            type: 'success',
            message: `Candidate Name: ${data.cand_name}\nExtended Vote: ${data.extended_vote}`,
          });
        } else {
          // Case 3: Unexpected server response
          setVerificationResult({ type: 'error', message: 'Unexpected server response received.' });
        }
      } else {
        // Handle server-reported errors
        setVerificationResult({
          type: 'error',
          message: data.error || 'An unknown error occurred.',
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setVerificationResult({ type: 'error', message: 'Unable to connect to the server.' });
    }
  };

  const logout = () => {
    props.navigation.navigate("scanner");
  };

  const isValidQRCode = (data) => {
    return data !== undefined;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Scan Ballot ID on the VVPAT</Text>
      <QRCodeScanner
        onRead={async ({ data }) => {
          if (isValidQRCode(data)) {
            await checkSend(data);
            console.log("Valid QR code detected:", data);
          } else {
            console.log("Invalid QR code detected:", data);
          }
        }}
        showMarker={true}
        markerStyle={styles.marker}
      />
      
      {/* Displaying verification result on the screen */}
      {verificationResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            {verificationResult.type === 'failure' && (
              <Text style={styles.failureText}>{verificationResult.message}</Text>
            )}
            {verificationResult.type === 'success' && (
              <Text style={styles.successText}>{verificationResult.message}</Text>
            )}
            {verificationResult.type === 'error' && (
              <Text style={styles.errorText}>{verificationResult.message}</Text>
            )}
          </Text>
        </View>
      )}

      <Button
        mode="contained"
        onPress={logout}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Scan a new VVPAT
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FA',
    justifyContent: 'center',
    padding: 20,
  },
  headerText: {
    fontSize: 36,
    marginLeft: 20,
    marginTop: 15,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  marker: {
    borderColor: '#4A90E2',
    borderWidth: 3,
    borderRadius: 12,
  },
  button: {
    marginTop: 25,
    marginHorizontal: 20,
    backgroundColor: '#D9534F',
    borderRadius: 30,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 18,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
  },
  failureText: {
    color: 'red',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'orange',
    fontWeight: 'bold',
  },
});

