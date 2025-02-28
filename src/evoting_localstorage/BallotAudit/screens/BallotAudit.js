import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList } from 'react-native';
import { Button, ActivityIndicator, Card } from 'react-native-paper';

export default function BallotAudit(props) {
  const [results, setResults] = useState([]); // State to store the results
  const [loading, setLoading] = useState(false); // State to manage loading

  const parseStringToArray = (str) => {
    return str
      .slice(1, -1) // Remove the square brackets at the start and end
      .split(",") // Split by commas
      .map((item) => item.trim().replace(/^['"]|['"]$/g, '')); // Trim whitespace and remove surrounding quotes
  };

let firstArray = '';
let z = 0;
      // Start the loop from index 1
      for (let i = 1; i < props.route.params.commitments.length; i++) {
        const char = props.route.params.commitments[i];
        if (char === ']') {
          firstArray += char;
          z = i;
          break; // End of the first array
        }
        firstArray += char; // Append characters to the firstArray
      }
      firstArray=parseStringToArray(firstArray);
    let booth_num = '';
    for(let i = z+3; i < props.route.params.commitments.length; i++){
      const char = props.route.params.commitments[i];
      if(char === '['){
        continue;
      }
      if(char === ','){
        break;
      }
      booth_num += char;
    }

  const checkSend = async () => {
    const commitment=firstArray;
    const boothNum=booth_num;
    const bid = parseStringToArray(props.route.params.bid);
    const election_id=props.route.params.election_id
    setLoading(true);

    try {
      const requestBody = {
        commitment: commitment,
        booth_num: boothNum,
        bid: bid[0],
        election_id: election_id
      };

      const response = await fetch(
        "http://192.168.1.8:7000/audit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      if(data.results==="The ballot has already been audited or the ballot has been used to cast a vote."){
        Alert.alert(
          "The ballot has already been audited or the ballot has been used to cast a vote.",
          "Scan a new ballot",
          [{ text: 'OK', onPress: () => props.navigation.navigate("scanner")}],
          {cancelable:false}
        );
      }
      // Check overall success
      else if (data.success) {
        setResults(data.results); // Store results in state
        Alert.alert("Ballot Audit Passed", "The ballot audit was successful.", [{ text: "OK" }]);
      } else {
        Alert.alert("Ballot Audit Failed", "Redo the election process.", [{ text: "OK" }]);
      }
    } catch (err) {
      Alert.alert("Error", err, [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  // Render each result item
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
              keyExtractor={(item, index) => index.toString()}
              style={styles.resultsList}
            />
          ) : (
            <Text style={styles.noResultsText}>No results available</Text>
          )}
          <Button
            mode="contained"
            onPress={checkSend}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            Audit Ballot
          </Button>
        </>
      )}
    </View>
  )};
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 15,
      paddingTop: 20,
      backgroundColor: "#f5f5f5", // Light background for a fresh feel
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#6200ea",
      textAlign: "center",
      marginBottom: 25,
    },
    button: {
      marginTop: 25,
      paddingVertical: 14,
      borderRadius: 25,
      backgroundColor: "#6200ea",
      shadowColor: "#000", // Added shadow for depth
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    resultsList: {
      marginBottom: 30,
    },
    resultCard: {
      backgroundColor: "#ffffff",
      marginVertical: 12,
      borderRadius: 15,
      elevation: 5, // More elevation for modern card effect
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    resultText: {
      fontSize: 16,
      color: "#444", // Slightly softer text color for better readability
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
      color: "#444", // Softer color for the no results message
      textAlign: "center",
      marginTop: 50,
      fontStyle: "italic", // Slight italic style for emphasis
    },
  });
 


