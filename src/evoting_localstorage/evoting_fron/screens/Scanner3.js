import React, { useState } from 'react';
import { View, Text, Alert, TextInput, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import postVote from '../func/postVote.js';

export default function Scanner3(props) {
  const [inputValue, setInputValue] = useState(''); // Initialize state for input value

  // Safely access route params with default values
  const commitments = props.route?.params?.commitments || [];
  const booth_num = props.route?.params?.booth_num || 'default_booth';

  // Check for missing params and handle gracefully
  if (!commitments.length || !booth_num) {
    console.error("Missing route parameters: commitments or booth_num.");
    Alert.alert(
      "Error",
      "Required data is missing. Returning to home.",
      [{ text: 'OK', onPress: () => props.navigation.navigate('homePO') }]
    );
    return null; // Prevent component rendering
  }

  const checkSend = async (enteredData) => {
    try {
      const data = await postVote(enteredData, commitments, booth_num);
      if (data.message) {
        Alert.alert('Successful', 'Your vote has been uploaded', [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      } else {
        Alert.alert("Vote was not recorded", data.err || "Unknown error", [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      }
    } catch (err) {
      console.error("Error during vote submission:", err);
      Alert.alert('Error', 'Data upload unsuccessful, try again.', [{ text: 'OK' }], { cancelable: false });
      props.navigation.navigate("homePO");
    }
  };

  const logout = () => {
    props.navigation.navigate('homePO');
  };

  const handleInputSubmit = async () => {
    if (inputValue.trim() === '' || isNaN(inputValue)) {
      Alert.alert('Invalid Input', 'Please enter a valid integer.', [{ text: 'OK' }], { cancelable: false });
      return;
    }
  
    // Show alert with data being sent to postVote
    Alert.alert(
      'Preference hosen',
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
        style={[styles.button, styles.logoutButton]}
        labelStyle={styles.buttonLabel}
      >
        Home
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1D6E2', // Calming blue-green background for a pleasant visual effect
    justifyContent: 'center',
    paddingHorizontal: 20, // Responsive horizontal padding
    paddingVertical: 16, // Balanced vertical padding for symmetry
  },
  headerText: {
    fontSize: 36, // Large size for header emphasis
    marginLeft: 20, // Added alignment to match spacing trends
    marginTop: 15, // Creates breathing room at the top
    color: '#3B3B3B', // Neutral dark gray for readability
    fontWeight: '700', // Bold text for better emphasis
    letterSpacing: 1, // Subtle spacing for modern aesthetics
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
  marker: {
    borderColor: '#1995AD', // Blue-green border for a cohesive theme
    borderWidth: 2, // Prominent border width
    borderRadius: 12, // Polished look with rounded corners
    padding: 5, // Inner padding for better balance
    alignSelf: 'center', // Centers the marker for symmetry
  },
  button: {
    marginTop: 25, // Space above the button
    marginHorizontal: 20, // Balanced horizontal spacing
    backgroundColor: '#D9534F', // Bold red for primary actions
    borderRadius: 30, // Modern rounded button corners
    elevation: 5, // Subtle shadow for depth
    paddingVertical: 12, // Comfortable vertical padding
  },
  logoutButton: {
  marginTop: 15, // Space above the button
  marginHorizontal: 20, // Symmetrical horizontal margin
  backgroundColor: '#6CB4EE', // Calm and soothing sky blue
  borderRadius: 30, // Rounded corners for modern design
  elevation: 5, // Shadow for subtle depth
  paddingVertical: 12, // Sufficient padding for usability
},
  buttonLabel: {
    color: '#FFFFFF', // White text for contrast against the button background
    fontSize: 18, // Font size optimized for visibility
    fontWeight: '600', // Balanced boldness for an elegant look
    textAlign: 'center', // Ensures text alignment in buttons
    letterSpacing: 0.8, // Subtle spacing for a refined appearance
  },
});
