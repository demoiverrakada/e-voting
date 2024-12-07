import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList } from 'react-native';
import { Button } from 'react-native-paper';

export default function BallotAudit(props) {
  const [results, setResults] = useState([]); // State to store the results
  const [loading, setLoading] = useState(false); // State to manage loading

  const parseStringToArray = (str) => {
    return str
      .slice(1, -1) // Remove the square brackets at the start and end
      .split(",") // Split by commas
      .map((item) => item.trim().replace(/^['"]|['"]$/g, '')); // Trim whitespace and remove surrounding quotes
  };

  const checkSend = async () => {
    const commitments = parseStringToArray(props.route.params.commitments);
    const booth_num = parseStringToArray(props.route.params.booth_num);
    const bid = parseStringToArray(props.route.params.bid);

    setLoading(true);

    try {
      const requestBody = {
        commitment: commitments,
        booth_num: parseInt(booth_num[0], 10),
        bid: bid[0],
      };

      const response = await fetch(
        "https://7637-35-247-136-128.ngrok-free.app/audit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      // Check overall success
      if (data.success) {
        setResults(data.results); // Store results in state
        Alert.alert("Ballot Audit Passed", "The ballot audit was successful.", [{ text: "OK" }]);
      } else {
        Alert.alert("Ballot Audit Failed", "Redo the election process.", [{ text: "OK" }]);
      }
    } catch (err) {
      Alert.alert("Error", "An error occurred while auditing the ballot. Please try again.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  // Render each result item
  const renderItem = ({ item, index }) => (
    <View style={styles.resultItem}>
      <Text style={styles.resultText}>Result {index + 1}:</Text>
      <Text style={styles.resultText}>Candidate Number: {item.v_w_nbar}</Text>
      <Text style={styles.resultText}>Candidate Name: {item.name}</Text>
      <Text style={styles.resultText}>Commitment: {item.commitment}</Text>
      <Text style={styles.resultText}>Gamma_w: {item.gamma_w}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.title}>Loading...</Text>
      ) : (
        <>
          {results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
            />
          ) : (
            <Text style={styles.title}>No results available</Text>
          )}
          <Button mode="contained" onPress={checkSend} style={styles.button}>
            Audit Ballot
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    padding: 10,
  },
  resultItem: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
  },
});


