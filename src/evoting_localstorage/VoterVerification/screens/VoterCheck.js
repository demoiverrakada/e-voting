import React, { useState } from 'react';
import { View, TextInput, Text,Alert,StyleSheet } from 'react-native';
import {Button} from 'react-native-paper';
const VoterVoted = (props) => {
    const [entryNum, setEntryNum] = useState('');
    const checkVoterExistence = async () => {
      try {
        Alert.alert(
            'Voter login successful',
            "scan ballot next",
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
    backgroundColor: '#A1D6E2',
    justifyContent: 'center',
    padding: 16,
  },
  headerText: {
    fontSize: 35,
    marginLeft: 18,
    marginTop: 10,
    color: '#3b3b3b',
  },
  marker: {
    borderColor: '#1995AD',
    borderRadius: 10,
  },
  button: {
    marginTop: 20,
    marginHorizontal: 18,
    backgroundColor: '#D9534F',
    borderRadius: 25,
    elevation: 3,
  },
  buttonLabel: {
    color: '#F1F1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default VoterVoted;



