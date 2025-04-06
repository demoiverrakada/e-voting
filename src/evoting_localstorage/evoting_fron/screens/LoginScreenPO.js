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
    backgroundColor: '#A1D6E2', // Calm pastel blue for the background
    justifyContent: 'center',
    alignItems: 'center', // Ensures the content is centered
    padding: 20, // Slightly more padding for better spacing
  },
  title: {
    fontSize: 36, // Slightly larger for better emphasis
    textAlign: 'center',
    marginBottom: 16, // Reduced spacing for better layout balance
    color: '#333', // Darker shade for better text contrast
    fontWeight: 'bold',
  },
  underline: {
    borderBottomColor: '#333', // Consistent with title text color
    borderBottomWidth: 3, // Slightly thinner underline
    borderRadius: 5, // Softer rounded edges
    alignSelf: 'center',
    width: 120, // Increased width for a more balanced look
    marginBottom: 20, // Matches spacing with other components
  },
  credentialsText: {
    fontSize: 18, // Slightly smaller for better visual hierarchy
    textAlign: 'center',
    marginBottom: 24, // Increased spacing for readability
    color: '#555', // Subtle gray for secondary text
  },
  textInput: {
    width: '90%', // Increased width to make it more horizontally prominent
    height: 45, // Reduced height for a sleeker look
    paddingHorizontal: 15, // Comfortable horizontal padding for typing
    marginBottom: 20,
    borderWidth: 1, // Adds a border for better visibility
    borderColor: '#ccc', // Neutral gray border
    borderRadius: 10, // Rounded corners for modern design
    backgroundColor: '#fff', // White background for input fields
    color: '#333', // Text color for readability
    fontSize: 16,
    shadowColor: '#000', // Shadow for focus effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Light shadow for focus effect
    shadowRadius: 4, // Slight blur on the shadow
    elevation: 3, // Subtle elevation for depth
  },
  textInputFocused: {
    borderColor: '#0278ae', // Highlighted border color on focus
    shadowOpacity: 0.2, // Slightly stronger shadow on focus
  },
  button: {
    width: '100%', // Standardized width for buttons
    paddingVertical: 14, // Vertical padding for better touch feedback
    borderRadius: 25,
    backgroundColor: '#0278ae', // Slightly deeper blue for contrast
    elevation: 4, // Enhanced elevation for a modern effect
    alignItems: 'center', // Center the button label
    marginBottom: 20, // Consistent spacing between buttons
    shadowColor: '#0278ae', // Button shadow color for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonLabel: {
    color: '#FFFFFF', // White text for better visibility
    fontSize: 18, // Larger font for clarity
    fontWeight: '600', // Slightly less bold for a refined look
    letterSpacing: 1, // Adds modern spacing between letters
  },
  inputLabel: {
    fontSize: 16, // Clear label text size
    marginBottom: 8, // Margin to separate label from the input field
    color: '#333', // Dark text for readability
    textAlign: 'left', // Left-aligned for input labels
    width: '100%',
  },
  formContainer: {
    width: '100%',
    marginBottom: 40, // Adds some space between the form fields and button
  }
});


export default LoginScreenPO;
