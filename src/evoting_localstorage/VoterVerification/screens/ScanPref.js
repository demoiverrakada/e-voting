import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { Button } from 'react-native-paper';

export default function Scanner3(props) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const voter_id = props.route?.params?.voter_id;
    const commitment = props.route?.params?.commitment;

    if (!voter_id || !commitment) {
      Alert.alert("Error", "Invalid voter ID or commitment data. Returning to the previous screen.");
      props.navigation.goBack();
    }
  }, []);

  const parseStringToArray = (str) => {
    try {
      return str
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''));
    } catch (error) {
      console.error("Error parsing string to array:", error);
      return [];
    }
  };

  const checkSend = async (enteredData) => {
    const voter_id = String(props.route.params.voter_id);
    const Icommitment = props.route.params.commitment;
    let firstArray = '';

    for (let i = 1; i < Icommitment.length; i++) {
      const char = Icommitment[i];
      if (char === ']') {
        firstArray += char;
        break;
      }
      firstArray += char;
    }

    firstArray = parseStringToArray(firstArray);

    const requestBody = {
      commitment: firstArray,
      voter_id: voter_id,
      preference: parseInt(enteredData, 10),
    };

    const formattedRequestBody = JSON.stringify(requestBody);

    try {
      const response = await fetch("http://192.168.1.8:7000/fetch", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: formattedRequestBody,
      });

      const data = await response.json();
      if (response.ok) {
        if (data.message === 'Voter details verified') {
          Alert.alert("Success", "Details verified successfully.", [{ text: 'OK' }]);
          props.navigation.navigate("scanner");
        }
      } else {
        console.error("Error response:", data);
        Alert.alert("Verification Failed", data.error || "Unknown server error.", [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Network Error", "Unable to connect to the server.", [{ text: 'OK' }]);
    }
  };

  const handleInputSubmit = async () => {
    if (inputValue.trim() === '' || isNaN(inputValue)) {
      Alert.alert('Invalid Input', 'Please enter a valid integer.', [{ text: 'OK' }], { cancelable: false });
      return;
    }

    Alert.alert(
      "Preference chosen",
      `Input: ${inputValue}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: async () => await checkSend(inputValue) },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Enter Voter Preference</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a valid integer"
        placeholderTextColor="#000"
        keyboardType="numeric"
        value={inputValue}
        onChangeText={setInputValue}
      />
      <Button
        mode="contained"
        onPress={handleInputSubmit}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Submit
      </Button>
      <Button
        mode="contained"
        onPress={() => props.navigation.navigate("scanner")}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Logout Now
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E4F7FC',
    justifyContent: 'center',
    padding: 24,
  },
  headerText: {
    fontSize: 32,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
  },
  button: {
    marginTop: 15,
    backgroundColor: '#FF5733',
    borderRadius: 30,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});