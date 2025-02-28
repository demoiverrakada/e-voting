import React, { useState } from 'react';
import { View, TextInput, Text, Alert, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';

const VoterVoted = (props) => {
    const [voterId, setVoterId] = useState('');
    const [elections, setElections] = useState([]);

    const fetchVotingHistory = async () => {
        try {
            const response = await fetch("http://192.168.1.8:7000/fetch", {
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
                                Encrypted Hash: {election.hash_value}
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
        backgroundColor: '#f5f5f5',
    },
    heading: {
        fontSize: 24,
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'white',
        marginBottom: 15,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        paddingVertical: 10,
        marginBottom: 20,
    },
    buttonLabel: {
        color: 'white',
        fontSize: 16,
    },
    resultsContainer: {
        flex: 1,
    },
    electionCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    electionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    hashText: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
});

export default VoterVoted;
