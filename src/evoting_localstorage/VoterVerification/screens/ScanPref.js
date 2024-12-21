import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { Button } from 'react-native-paper';

export default function Scanner(props) {
  const [inputValue, setInputValue] = useState('');
  const checkSend = async (enteredData) => {
    const voter_id = String(props.route.params.voter_id); // Convert voter_id to string
    const commitment = props.route.params.commitment[0];

    // Ensure preference is sent as an integer
    const requestBody = {
      commitment: commitment, // Should match the expected format
      voter_id: voter_id,
      preference: parseInt(enteredData, 10), // Convert to integer
    };

    // Log the request body to verify its contents
    console.log("Request Body:", JSON.stringify(requestBody));
	if(!voter_id){
	Alert.alert("ERROR","Voter id is missing",[{text:"OK"}],{cancelable:false});
	}
	if(!commitment){
	Alert.alert("ERROR","Commitments are missing",[{text:"OK"}],{cancelable:false});
	}
const formattedRequestBody=JSON.stringify(requestBody);

    try {
      const response = await fetch("https://f5d1-34-126-82-17.ngrok-free.app/fetch", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: formattedRequestBody,
      });

      const data = await response.json();
      if (response.ok) {
        if (data.message === 'Voter details verified') {
          Alert.alert("Details verified successfully", "Voter details match those on the bulletin", [{ text: 'OK' }], { cancelable: false });
          props.navigation.navigate("scanner");
        }
      } else {
        // Log the error response from the server for debugging
        console.error("Error response:", data);
        Alert.alert("Details not verified", data.error, [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("scanner");
      }
    } catch (err) {
      console.error("Fetch error:", err); // Log the fetch error
      Alert.alert("Data upload unsuccessful, try again", [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("scanner");
    }
  };

  const logout = async () => {
    props.navigation.navigate("scanner");
  };

  const handleInputSubmit = async () => {
      if (inputValue.trim() === '' || isNaN(inputValue)) {
        Alert.alert('Invalid Input', 'Please enter a valid integer.', [{ text: 'OK' }], { cancelable: false });
        return;
      }
    
      // Show alert with data being sent to postVote
      Alert.alert(
        'Preference chosen',
        `Input: ${inputValue}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: async () => await checkSend(inputValue) }, // Proceed to send data on confirmation
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
              keyboardType="numeric"
              value={inputValue} // Display the value from state
              onChangeText={setInputValue} // Update state as user types
              placeholderTextColor="#888"
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
        onPress={logout}
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
    backgroundColor: '#E4F7FC',  // Lighter and more refreshing background color
    justifyContent: 'center',
    padding: 24,  // Increased padding for more space around content
  },
  headerText: {
    fontSize: 32,  // Slightly smaller and more balanced size
    color: '#333',  // Darker text for better readability
    fontWeight: '500',  // Semi-bold for a modern look
    textAlign: 'center',  // Centered text for balance
    marginBottom: 30,  // Increased margin to create more space between header and scanner
  },
  marker: {
    borderColor: '#1E90FF',  // Bright blue for marker color to stand out
    borderRadius: 15,  // Smoother corners for the marker
    borderWidth: 3,  // Slightly thicker border for emphasis
  },
  button: {
    marginTop: 25,  // Increased margin for more space between QR scanner and the button
    marginHorizontal: 24,  // Even horizontal padding for balance
    backgroundColor: '#FF5733',  // Vibrant and modern red color for the button
    borderRadius: 30,  // Rounded corners for a smoother look
    paddingVertical: 12,  // Increased padding to make the button feel more clickable
    elevation: 5,  // Increased elevation for a stronger shadow effect, adding depth
  },
  buttonLabel: {
    color: '#FFFFFF',  // White text for clear contrast
    fontSize: 18,  // Larger font for readability
    fontWeight: 'bold',  // Bold text for emphasis and clarity
  },
});

