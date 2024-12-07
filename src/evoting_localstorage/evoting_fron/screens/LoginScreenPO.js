import React, { useState } from 'react';
import { Button, TextInput } from 'react-native-paper';
import {
  Text,
  View,
  KeyboardAvoidingView,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import checkPO from '../func/checkPO.js';

function LoginScreenPO(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const sendCred = async () => {
    try {
      const data = await checkPO(email,password);

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
    padding: 16,
  },
  title: {
    fontSize: 35,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  underline: {
    borderBottomColor: 'black',
    borderBottomWidth: 4,
    borderRadius: 10,
    alignSelf: 'center',
    width: 100,
    marginBottom: 10,
  },
  credentialsText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
    borderRadius: 25,
    elevation: 3,
  },
  buttonLabel: {
    color: '#F1F1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreenPO;
