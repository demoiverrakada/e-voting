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
    backgroundColor: '#F1F1F2',
  },
});

export default LoadingScreen;
