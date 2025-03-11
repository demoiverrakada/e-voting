import React, { useState } from 'react';
import { View, TextInput, Text, Alert, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';

const VoterVoted = (props) => {
    const [voterId, setVoterId] = useState('');
    const [elections, setElections] = useState([]);

    const fetchVotingHistory = async () => {
        try {
            const response = await fetch("http://192.168.1.2:7000/fetch", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ voter_id: voterId }),
            });

            const data = await response.json();
            if (response.ok) {
                setElections(data.elections || []);
                if (data.elections.length === 0) {
                    Alert.alert('Info', 'No voting records found');
                }
            } else {
                Alert.alert('Error', data.error || 'Failed to fetch history');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Voter History Lookup</Text>
            
            <TextInput
                placeholder="Enter Voter ID"
                value={voterId}
                onChangeText={setVoterId}
                style={styles.input}
                placeholderTextColor="#666"
            />

            <Button
                mode="contained"
                onPress={fetchVotingHistory}
                style={styles.button}
                labelStyle={styles.buttonLabel}>
                Fetch Voting History
            </Button>

            {elections.length > 0 && (
                <ScrollView style={styles.resultsContainer}>
                    {elections.map((election, index) => (
                        <View key={index} style={styles.electionCard}>
                            <Text style={styles.electionTitle}>
                                Election ID: {election.election_id}
                            </Text>
                            <Text>Voted Preference: {election.preference}</Text>
                            <Text style={styles.hashText}>
                                Commitment value: {election.commitment}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#e0e0e0', // Slightly darker for better contrast
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#222', // Darker for better readability
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#fff',
        marginBottom: 15,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#bbb', // Darker border for visibility
        fontSize: 16,
        color: '#000', // Ensure text is clearly visible
    },
    button: {
        backgroundColor: '#1976D2', // Slightly darker blue for better contrast
        borderRadius: 10,
        paddingVertical: 12,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    resultsContainer: {
        flex: 1,
    },
    electionCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    electionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#222',
    },
    hashText: {
        fontSize: 13,
        color: '#555', // Darker gray for better readability
        marginTop: 6,
    },
});



export default VoterVoted;
