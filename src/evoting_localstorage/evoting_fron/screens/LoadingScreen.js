import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LoadingScreen(props) {
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        props.navigation.replace("home");
      } else {
        props.navigation.replace("login");
      }
    };
    checkLoginStatus();
  }, []);

  return (
    <View style={styles.loading}>
      <StatusBar barStyle="dark-content" backgroundColor="#A1D6E2" />
      <ActivityIndicator size="large" color="#1995AD" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F1F1F2', // Keeps the light gray background for neutrality
    paddingHorizontal: 16, // Ensures proper padding for responsive design
  },
  spinner: {
    marginVertical: 20, // Adds spacing for any loader/spinner element
  },
  loadingText: {
    marginTop: 15, // Adds spacing between the spinner and the text
    fontSize: 18, // Text size for better readability
    color: '#3B3B3B', // Subtle dark gray for contrast and readability
    fontWeight: '500', // Medium weight for a clean and modern look
    letterSpacing: 0.5, // Slight spacing for visual refinement
    textAlign: 'center', // Centers the text for a balanced layout
  },
});

export default LoadingScreen;
