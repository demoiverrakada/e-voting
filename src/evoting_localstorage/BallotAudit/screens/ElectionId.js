import React, { useState } from 'react';
import { View, TextInput, Text, Alert, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const ElectionId = (props) => {
    const commitments = props.route.params.commitments;
    const bid = props.route.params.bid;
    const [election_id, setElectionID] = useState(''); // Initialize as string for input handling

    const checkElectionID = async () => {
        // Convert to number and validate
        const numericElectionId = parseInt(election_id);
        
        if (isNaN(numericElectionId) || numericElectionId <= 0) {
            Alert.alert('Invalid Input', 'Please enter a valid election ID number');
            return;
        }
        try {
            Alert.alert(
                'Election ID entered successfully',
                "Audit ballot next",
                [{
                    text: 'OK', 
                    onPress: () => props.navigation.navigate('audit', {
                        commitments: commitments,
                        bid: bid,
                        election_id: numericElectionId
                    })
                }],
                { cancelable: false }
            );
            setElectionID(''); // Reset input
        } catch (error) {
            console.error('Error during fetch:', error);
            Alert.alert('Error', 'Error in connecting to the server', [
                { text: 'OK', onPress: () => props.navigation.navigate('scanner') },
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Enter Election ID of the ballot</Text>
            <TextInput
                placeholder="Enter Election ID"
                value={election_id}
                placeholderTextColor="#000"
                mode="outlined"
                style={styles.textInput}
                theme={{ colors: { primary: "#1995AD" } }}
                keyboardType="numeric"
                onChangeText={(text) => {
                    // Filter non-numeric characters
                    const cleanedText = text.replace(/[^0-9]/g, '');
                    setElectionID(cleanedText);
                }}
            />
            <Button 
                onPress={checkElectionID}
                mode="contained"
                style={styles.button}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
            >
                Enter Election ID
            </Button>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F2F7FC', // Lighter background for a clean look
      justifyContent: 'center', // Center the content vertically
      paddingHorizontal: 20,
    },
    headerText: {
      fontSize: 30, // Larger font size for header
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 25, // Extra space between header and scanner
      color: '#4A90E2', // Soft blue color for the header
      letterSpacing: 1.5,
    },
    marker: {
      borderColor: '#4A90E2', // Blue border for the scanner marker
      borderWidth: 2,
    },
    button: {
      marginTop: 20,
      paddingVertical: 12,
      borderRadius: 25,
      backgroundColor: '#4A90E2', // Button matches the header color
      elevation: 4,
    },
    buttonLabel: {
      color: '#F1F1F2', // Light color text for the button
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    alert: {
      fontSize: 16,
      textAlign: 'center',
      color: '#333', // Darker color for alert text
    },
  });

export default ElectionId;