import React from 'react';
import { Button } from 'react-native-paper';
import {
  StatusBar,
  Text,
  View,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';

// If using Expo, you can load custom fonts like this:
// import { useFonts } from 'expo-font';
// import AppLoading from 'expo-app-loading';

function StartScreen(props) {
  const Admin = async () => {
    props.navigation.replace("loginAdmin");
  };

  const PO = async () => {
    props.navigation.replace("loginPO");
  };

  // If using Expo, you can load custom fonts like this:
  // let [fontsLoaded] = useFonts({
  //   'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
  // });

  // if (!fontsLoaded) {
  //   return <AppLoading />;
  // }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#A1D6E2" />
      <KeyboardAvoidingView behavior="position" style={styles.keyboardAvoidingView}>
        <Text style={styles.heading}>Welcome to Voting Portal</Text>
        <Button
          mode="contained"
          onPress={PO}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Polling Officer Login
        </Button>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A1D6E2', // Soft blue background for a calming effect
    justifyContent: 'center', // Centers content vertically
    paddingHorizontal: 16, // Added horizontal padding for better responsiveness
    paddingVertical: 20, // Added vertical padding for layout consistency
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center', // Keeps UI aligned when the keyboard appears
  },
  heading: {
    color: '#1995AD', // Distinct blue-green shade for the heading
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 32, // Slightly larger font size for better emphasis
    marginBottom: 40, // Keeps spacing consistent
    // fontFamily: 'Montserrat-Bold', // Uncomment if a custom font is in use
    letterSpacing: 1.2, // Adds spacing between letters for a polished look
  },
  button: {
    marginHorizontal: 20, // Slightly increased margin for a balanced layout
    marginTop: 20,
    backgroundColor: '#1995AD', // Rich color for visual prominence
    borderRadius: 30, // Increased rounding for a modern aesthetic
    elevation: 5, // Enhanced shadow for better depth
    paddingVertical: 12, // Added vertical padding for a larger tap target
  },
  buttonLabel: {
    color: '#FFFFFF', // White color for contrast with the button background
    fontSize: 18, // Larger font size for better accessibility
    fontWeight: '600', // Slightly lighter font weight for a modern feel
    textAlign: 'center', // Ensures proper alignment
  },
  buttonContent: {
    height: 55, // Slightly increased height for better tap area
    justifyContent: 'center', // Centers content within the button
    alignItems: 'center', // Ensures label stays aligned
  },
});

export default StartScreen;