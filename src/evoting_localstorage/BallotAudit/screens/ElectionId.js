import React, { useState } from 'react';
import { View, TextInput, Text, Alert, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const ElectionId = (props) => {
    const commitments = props.route.params.commitments;
    const bid = props.route.params.bid;
    const [election_id, setElectionID] = useState(''); // Initialize as string for input handling

    const confirmElectionID = async () => {
        Alert.alert(
            'Confirm Election ID',
            `You have entered Election ID: ${election_id}. Do you want to proceed?`,
            [
                {
                    text: 'Re-enter',
                    onPress: () => setElectionID(''), // Reset the input for reentry
                },
                {
                    text: 'Proceed',
                    onPress: () => {
                        // Navigate to the next screen with the election_id
                        props.navigation.navigate('audit', {
                            commitments: commitments,
                            bid: bid,
                            election_id: parseInt(election_id),
                        });
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const checkElectionID = async () => {
        // Validate election_id as a positive number
        const numericElectionId = parseInt(election_id);

        if (isNaN(numericElectionId) || numericElectionId <= 0) {
            Alert.alert('Invalid Input', 'Please enter a valid election ID number');
            return;
        }

        try {
            // Ask for confirmation before proceeding
            await confirmElectionID();
        } catch (error) {
            console.error('Error during fetch:', error);
            Alert.alert('Error', 'Error in connecting to the server', [
                { text: 'OK', onPress: () => props.navigation.navigate('scanner') },
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Enter Election ID</Text>
            <Text style={styles.subHeading}>
                Please enter the Election ID of the ballot in the field below.
            </Text>
            <View style={styles.formGroup}>
                <TextInput
                    placeholder="Enter Election ID"
                    value={election_id}
                    placeholderTextColor="#000"
                    style={styles.textInput}
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
                    Submit Election ID
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6200ea",
        textAlign: "center",
        marginBottom: 10,
    },
    subHeading: {
        fontSize: 16,
        color: "#444",
        textAlign: "center",
        marginBottom: 20,
    },
    formGroup: {
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingVertical: 30,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#6200ea',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 18,
        color: '#000',
        marginBottom: 20,
    },
    button: {
        backgroundColor: "#6200ea",
        borderRadius: 8,
    },
    buttonLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonContent: {
        paddingVertical: 10,
    },
});

export default ElectionId;
