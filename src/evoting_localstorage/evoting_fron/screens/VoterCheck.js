import React, { useState, useRef } from 'react';
import { View, TextInput, Text, Alert, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import checkReceipt from '../func/checkReceipt.js';

const VoterVoted = (props) => {
    const [entryNum, setEntryNum] = useState('');
    const inputRef = useRef(null);

    const checkVoterExistence = async () => {
        if (!entryNum.trim()) {
            Alert.alert('Error', 'Please enter a valid Voter ID');
            return;
        }

        Alert.alert(
            'Verify Voter ID',
            `You entered: ${entryNum}\nIs this correct?`,
            [
                { 
                    text: 'Edit', 
                    style: 'default',
                    onPress: () => {
                        inputRef.current.focus(); // Refocus the input field for editing
                    }
                },
                {
                    text: 'Proceed',
                    onPress: async () => {
                        try {
                            const data = await checkReceipt(entryNum);
                            
                            if (data.error) {
                                throw new Error(data.error);
                            }

                            const eligibleElections = data.eligibleElections.filter(eid => 
                                !data.votedElections?.some(v => v === eid)
                            );

                            if (eligibleElections.length === 0) {
                                Alert.alert('Info', 'No remaining eligible elections');
                                return;
                            }

                            const electionList = eligibleElections
                                .map((eid, index) => `${index + 1}. Election ${eid}`)
                                .join('\n');

                            Alert.alert(
                                'Eligible Elections',
                                `Voter can vote in:\n\n${electionList}`,
                                [
                                    {
                                        text: 'Proceed to Vote',
                                        onPress: () => props.navigation.navigate('ElectionLoop', {
                                            voter_id: entryNum,
                                            elections: eligibleElections,
                                            currentIndex: 0
                                        })
                                    },
                                    { 
                                        text: 'Cancel', 
                                        style: 'cancel',
                                        onPress: () => setEntryNum('') // Clear voter ID on cancel
                                    }
                                ],
                                { cancelable: false }
                            );
                        } catch (err) {
                            Alert.alert(
                                'Error',
                                err.message,
                                [
                                    { 
                                        text: 'Try Again', 
                                        onPress: () => {
                                            setEntryNum('');
                                            inputRef.current.focus(); // Refocus input field for retry
                                        }
                                    },
                                    { text: 'Cancel', style: 'cancel' }
                                ]
                            );
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Enter Voter Credentials</Text>
            <TextInput
                ref={inputRef}
                placeholder="Enter Voter Entry Number"
                value={entryNum}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: "#1995AD" } }}
                onChangeText={(text) => setEntryNum(text)}
                placeholderTextColor="#888"
                autoFocus={true}
            />
            <Button 
                onPress={checkVoterExistence} 
                mode="contained"
                style={styles.button}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
            >
                Verify Voter ID
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#A1D6E2', // Calming blue-green background for a pleasant visual effect
        justifyContent: 'center',
        paddingHorizontal: 20, // Responsive horizontal padding
        paddingVertical: 16, // Balanced vertical padding for symmetry
    },
    heading: {
        fontSize: 24,
        marginBottom: 20,
        color: '#3B3B3B',
        fontWeight: '700',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50, // Comfortable height for input field
        borderColor: '#1995AD', // Soft blue-green for the input border
        borderWidth: 2, // Thicker border for a prominent look
        borderRadius: 12, // Rounded corners for a sleek design
        paddingHorizontal: 15, // Comfortable horizontal padding for typing
        fontSize: 18, // Readable font size
        marginBottom: 20, // Space below the input field
        backgroundColor: '#FFFFFF', // Contrasting white background
        color: '#333333', // Dark gray text for better readability
        elevation: 3, // Adds subtle depth
    },
    button: {
        marginTop: 25, // Space above the button
        marginHorizontal: 20, // Balanced horizontal spacing
        backgroundColor: '#1995AD', // Blue-green color for primary actions
        borderRadius: 30, // Modern rounded button corners
        elevation: 5, // Subtle shadow for depth
        paddingVertical: 12, // Comfortable vertical padding
    },
    buttonLabel: {
        color: '#FFFFFF', // White text for contrast against the button background
        fontSize: 18, // Font size optimized for visibility
        fontWeight: '600', // Balanced boldness for an elegant look
        textAlign: 'center', // Ensures text alignment in buttons
    },
});

export default VoterVoted;

