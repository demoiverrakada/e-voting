import React, { useState } from 'react';
import { View, TextInput, Text,Alert,StyleSheet } from 'react-native';
import {Button} from 'react-native-paper';
import RNFS from 'react-native-fs';
import checkReceipt from '../func/checkReceipt.js';
const VoterVoted = (props) => {
    const [entryNum, setEntryNum] = useState('');
    const checkVoterExistence = async () => {
      try {
        const data=await checkReceipt(entryNum);
          if (data.message === "Voter verified successfully. Go inside the booth.") {
            Alert.alert('Proceed to vote', "Go inside the booth to vote", [{ text: 'OK' }], { cancelable: false });
            props.navigation.navigate("homePO");
          }
         else {
          Alert.alert('Error', data.error, [{ text: 'OK' }], { cancelable: false });
          props.navigation.navigate("homePO");
        }
      } catch (err) {
        Alert.alert('Data Upload unsuccessful, try again', [{ text: 'OK' }], { cancelable: false });
        props.navigation.navigate("homePO");
      }
}
  return (
    <View style={styles.container}>
        <Text style={styles.heading}>Enter Voter Credentials</Text>
      <TextInput
        placeholder="Enter Voter Entry Number"
        value={entryNum}
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
    backgroundColor: '#A1D6E2', // Light, calming blue background
    justifyContent: 'center', // Centers content vertically
    paddingHorizontal: 16, // Ensures responsive left and right padding
  },
  headerText: {
    fontSize: 35, // Large font size for better readability
    marginLeft: 18, // Margin for spacing from the left side
    marginTop: 10, // Top margin for separation from elements above
    color: '#3b3b3b', // Dark gray for text to contrast with background
    textAlign: 'center', // Center the text for balance
    fontWeight: '700', // Bold text to stand out
    letterSpacing: 0.5, // Slight spacing for a cleaner look
  },
  marker: {
    borderColor: '#1995AD', // Blue border color for highlighting
    borderWidth: 1, // Ensure visibility of the border
    borderRadius: 10, // Rounded corners for a modern design
    padding: 10, // Adds inner padding for better content alignment
  },
  button: {
    marginTop: 20, // Top margin for spacing from the header
    marginHorizontal: 18, // Horizontal margins for symmetry
    backgroundColor: '#D9534F', // Red background for a striking button
    borderRadius: 25, // Rounded corners for a smooth look
    elevation: 3, // Shadow for depth
    paddingVertical: 14, // Vertical padding to increase button height
  },
  buttonLabel: {
    color: '#F1F1F2', // Light-colored text for contrast
    fontSize: 16, // Font size for easy readability
    fontWeight: 'bold', // Bold text for prominence
    textAlign: 'center', // Centers the label text inside the button
  },
});
export default VoterVoted;
