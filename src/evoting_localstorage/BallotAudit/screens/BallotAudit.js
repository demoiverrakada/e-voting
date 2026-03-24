import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList } from 'react-native';
import { Button, ActivityIndicator, Card } from 'react-native-paper';

export default function BallotAudit(props) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkSend = async () => {
    const audit_data = props.route.params.audit_data;

    const commitment = audit_data[1];
    const bid = audit_data[2];
    const election_id = audit_data[0];

    setLoading(true);

    try {
      const response = await fetch("http://10.208.21.185:7000/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitment, bid, election_id }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      if (
        data.results ===
        "The ballot has already been audited or the ballot has been used to cast a vote."
      ) {
        Alert.alert("Already Audited", "Scan a new ballot", [
          { text: "OK", onPress: () => props.navigation.goBack() }
        ]);
      } else if (data.success) {
        setResults(data.results);

        Alert.alert("✅ Success", "Ballot verified!", [
          { text: "Scan Next", onPress: () => props.navigation.goBack() }
        ]);
      } else {
        Alert.alert("❌ Failed", "Redo the election process.");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.resultCard}>
      <Card.Content>
        <Text style={styles.resultTitle}>Result {index + 1}</Text>

        <Text style={styles.label}>Candidate Number</Text>
        <Text style={styles.value}>{item.v_w_nbar}</Text>

        <Text style={styles.label}>Candidate Name</Text>
        <Text style={styles.value}>{item.name}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Ballot Audit</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 40 }} />
      ) : (
        <>
          {results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={(_, index) => index.toString()}
            />
          ) : (
            <Text style={styles.noResults}>
              Scan and audit a ballot to see results
            </Text>
          )}

          <Button
            mode="contained"
            onPress={checkSend}
            style={styles.primaryButton}
            labelStyle={styles.buttonText}
          >
            Audit Ballot
          </Button>

          <Button
            mode="outlined"
            onPress={() => props.navigation.goBack()}
            style={styles.secondaryButton}
            labelStyle={{ color: "#6200ea", fontWeight: "bold" }}
          >
            Scan New Ballot
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6200ea",
    textAlign: "center",
    marginBottom: 20,
  },
  resultCard: {
    marginVertical: 10,
    borderRadius: 20,
    padding: 10,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  label: {
    color: "#6200ea",
    marginTop: 8,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    color: "#333",
  },
  noResults: {
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
    color: "#666",
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 30,
    paddingVertical: 8,
    backgroundColor: "#6200ea",
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#6200ea",
  },
  buttonText: {
    fontWeight: "bold",
    color: "#fff",
  },
});
 


