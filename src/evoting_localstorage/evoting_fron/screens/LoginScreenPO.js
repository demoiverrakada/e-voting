import React, { useState } from 'react';
import { Button, TextInput } from 'react-native-paper';
import {
  Text,
  View,
  KeyboardAvoidingView,
  Alert,
  StyleSheet,
} from 'react-native';
import checkPO from '../func/checkPO.js';

function LoginScreenPO(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const sendCred = async () => {
    try {
      const data = await checkPO(email, password);

      if (data.message) {
        setEmail('');
        setPassword('');
        props.navigation.navigate("homePO");
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    }
  };

  const back = async () => {
    props.navigation.navigate("start");
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="position">
        <Text style={styles.title}>Polling Officer Portal</Text>
        <View style={styles.underline} />
        <Text style={styles.credentialsText}>Enter your credentials</Text>
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          style={styles.textInput}
          theme={{ colors: { primary: "#1995AD" } }}
          onChangeText={text => setEmail(text)}
        />
        <TextInput
          label="Password"
          mode="outlined"
          secureTextEntry
          value={password}
          style={styles.textInput}
          theme={{ colors: { primary: "#1995AD" } }}
          onChangeText={text => setPassword(text)}
        />
        <Button
          mode="contained"
          onPress={sendCred}
          style={[styles.button, { backgroundColor: '#1995AD' }]}
          labelStyle={styles.buttonLabel}
        >
          Login
        </Button>
        <Button
          mode="contained"
          onPress={back}
          style={[styles.button, { backgroundColor: '#D9534F' }]}
          labelStyle={styles.buttonLabel}
        >
          Start Screen
        </Button>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1D6E2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  underline: {
    borderBottomColor: '#333',
    borderBottomWidth: 3,
    borderRadius: 5,
    alignSelf: 'center',
    width: 120,
    marginBottom: 20,
  },
  credentialsText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#555',
  },
  textInput: {
    width: '100%', // Matches button width for consistency
    height: 50, // Slightly taller for better usability
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25, // Matches button border radius for consistency
    backgroundColor: '#fff',
    color: '#333',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    width: '100%', // Matches input width for consistency
    paddingVertical: 14, // Standardized padding
    borderRadius: 25, // Matches input border radius for consistency
    elevation: 4,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0278ae',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default LoginScreenPO;

