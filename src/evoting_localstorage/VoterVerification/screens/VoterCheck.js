import React, { useState } from 'react';
import { View, TextInput, Text,Alert,StyleSheet } from 'react-native';
import {Button} from 'react-native-paper';
const VoterVoted = (props) => {
    const [entryNum, setEntryNum] = useState('');
    const checkVoterExistence = async () => {
      try {
        Alert.alert(
            'Voter login successful',
            "Scan Encrypted candidate ID's next",
            [{ text: 'OK', onPress: () => props.navigation.navigate('scanner2', {voter_id: entryNum }) }],
            { cancelable: false }
          );
          setEntryNum('');
      } catch (error) {
        console.log("e")
        console.error('Error during fetch:', error);
        Alert.alert('Error', 'Error in connecting to the server',[
          { text: 'OK', onPress: () => props.navigation.navigate('scanner') },
        ]);
      }
  };
  return (
    <View style={styles.container}>
        <Text style={styles.heading}>Enter Voter Credentials</Text>
      <TextInput
        placeholder="Enter Voter Entry Number"
        value={entryNum}
        placeholderTextColor="#000"
        mode="outlined"
        style={styles.textInput}
        theme={{ colors: { primary: "#1995AD" } }}
        onChangeText={(text) => setEntryNum(text)}
      />
      <Button onPress={checkVoterExistence} 
        mode="contained"
        style={styles.button}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}>Enter voter number</Button>

    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8FF',  // Lighter and fresher background color
    justifyContent: 'center',
    padding: 24,  // Increased padding for more space around content
  },
  heading: {
    fontSize: 28,  // Slightly smaller heading for a cleaner look
    color: '#333',  // Darker color for better contrast and readability
    fontWeight: '600',  // Semi-bold for a more modern look
    marginBottom: 30,  // Increased margin to give space between heading and input
    textAlign: 'center',  // Centered text for a more balanced design
  },
  textInput: {
    marginBottom: 20,  // More space between input and button
    borderRadius: 10,  // Rounded corners for the input box
    paddingHorizontal: 12,  // Padding inside the input for a more comfortable feel
    height: 50,  // Increased height for easier typing and visibility
    fontSize: 16,  // Larger font for better readability
    color:'#333'
  },
  button: {
    marginTop: 20,  // Space from input field
    marginHorizontal: 24,
    backgroundColor: '#007BFF',  // Changed to a more modern blue
    borderRadius: 30,  // More rounded corners for a friendlier appearance
    paddingVertical: 12,  // Increased vertical padding for better clickability
    elevation: 4,  // Slightly stronger shadow for emphasis
  },
  buttonLabel: {
    color: '#FFF',  // White color to make the button label pop
    fontSize: 18,  // Larger font for better readability and visibility
    fontWeight: 'bold',  // Bold text for emphasis
  },
  buttonContent: {
    paddingHorizontal: 30,  // Adjusted padding to ensure text stays centered within the button
  },
});

export default VoterVoted;