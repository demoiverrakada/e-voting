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
  

export default ElectionId;