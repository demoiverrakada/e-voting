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
    backgroundColor: '#A1D6E2',
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    color: '#1995AD',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 30,
    marginBottom: 40,
    // fontFamily: 'Montserrat-Bold', // Uncomment this line if using a custom font
  },
  button: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: '#1995AD',
    borderRadius: 25,
    elevation: 3,
  },
  buttonLabel: {
    color: '#F1F1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    height: 50,
  },
});

export default StartScreen;