import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList } from 'react-native';
import { Button, ActivityIndicator, Card } from 'react-native-paper';

export default function BallotAudit(props) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditCompleted, setAuditCompleted] = useState(false);

  const parseStringToArray = (str) => {
    return str
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''));
  };

  let firstArray = '';
  let z = 0;
  for (let i = 1; i < props.route.params.commitments.length; i++) {
    const char = props.route.params.commitments[i];
    if (char === ']') {
      firstArray += char;
      z = i;
      break;
    }
    firstArray += char;
  }
  firstArray = parseStringToArray(firstArray);
  
  let booth_num = '';
  for (let i = z + 3; i < props.route.params.commitments.length; i++) {
    const char = props.route.params.commitments[i];
    if (char === '[') continue;
    if (char === ',') break;
    booth_num += char;
  }

  const checkSend = async () => {
    const commitment = firstArray;
    const boothNum = booth_num;
    const bid = parseStringToArray(props.route.params.bid);
    const election_id = props.route.params.election_id;
    
    setLoading(true);
    setAuditCompleted(false);

    try {
      const requestBody = {
        commitment: commitment,
        booth_num: boothNum,
        bid: bid[0],
        election_id: election_id
      };

      const response = await fetch("http://10.194.27.33:7000/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.results === "The ballot has already been audited or the ballot has been used to cast a vote.") {
        Alert.alert(
          "Ballot Already Audited",
          "Scan a new ballot",
          [{ text: 'OK', onPress: () => props.navigation.navigate("scanner") }],
          { cancelable: false }
        );
      } else if (data.success) {
        setResults(data.results);
        Alert.alert("Ballot Audit Passed", "The ballot audit was successful.", [{ text: "OK" }]);
      } else {
        Alert.alert("Ballot Audit Failed", "Redo the election process.", [{ text: "OK" }]);
      }
    } catch (err) {
      Alert.alert("Error", err.message, [{ text: "OK" }]);
    } finally {
      setLoading(false);
      setAuditCompleted(true);
    }
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.resultCard}>
      <Card.Content>
        <Text style={styles.resultText}>Result {index + 1}:</Text>
        <Text style={styles.label}>Candidate Number:</Text>
        <Text style={styles.resultText}>{item.v_w_nbar}</Text>
        <Text style={styles.label}>Candidate Name:</Text>
        <Text style={styles.resultText}>{item.name}</Text>
      </Card.Content>
    </Card>
  );

  const back = async () => {
    props.navigation.navigate("scanner");
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#6200ea" />
      ) : (
        <>
          {results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={(_, index) => index.toString()}
              style={styles.resultsList}
            />
          ) : (
            <Text style={styles.noResultsText}>No results available</Text>
          )}
          <Button
            mode="contained"
            onPress={checkSend}
            disabled={auditCompleted}
            style={[styles.button1, { backgroundColor: auditCompleted ? '#000000' : '#6200ea' }]}
            labelStyle={styles.buttonText}
          >
            Audit Ballot
          </Button>
          <Button
            mode="contained"
            onPress={back}
            disabled={!auditCompleted}
            style={[styles.button2, { backgroundColor: !auditCompleted ? '#000000' : '#6200ea' }]}
            labelStyle={styles.buttonText}
          >
            Audit a new Ballot
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    backgroundColor: "#f5f5f5",
  },
  button1: {
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button2: {
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#ffffff"
  },
  resultsList: {
    marginBottom: 30,
  },
  resultCard: {
    backgroundColor: "#ffffff",
    marginVertical: 12,
    borderRadius: 15,
    elevation: 5,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  resultText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#6200ea",
    fontWeight: "600",
    marginTop: 10,
  },
  noResultsText: {
    fontSize: 18,
    color: "#444",
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
  },
});

 


