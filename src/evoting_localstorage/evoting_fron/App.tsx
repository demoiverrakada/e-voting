import React,{useEffect,useState}from 'react';
import{Button,TextInput} from 'react-native-paper'

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  KeyboardAvoidingView
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreenPO from './screens/LoginScreenPO.js'
import LoadingScreen from './screens/LoadingScreen.js'
import HomeScreenPO from './screens/HomeScreenPO.js';
import StartScreen from './screens/StartScreen.js';
import VoterCheck from './screens/VoterCheck.js';
import Scanner2 from './screens/Scanner2.js';
import Scanner3 from  './screens/Scanner3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
const Stack =createNativeStackNavigator();
function App(){
  const[isloggedin,setLogged]=useState(false);
  useEffect(()=>
  {
    const checkLoginStatus=async ()=>{
    const token=await AsyncStorage.getItem('token');
    if(token)
    {
        setLogged(true)
    }
    else
    {
      setLogged(false)
    }
  };
    checkLoginStatus();
  },[]);
  
  return(
    <>
    <NavigationContainer>
      <Stack.Navigator>
            <Stack.Screen name="start" component={StartScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="loading" component ={LoadingScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="homePO" component ={HomeScreenPO} options={{ headerShown: false }}/>
            <Stack.Screen name="loginPO" component ={LoginScreenPO} options={{ headerShown: false }}/>
            <Stack.Screen name='VoterCheck' component={VoterCheck} options={{ headerShown: false }}/>
            <Stack.Screen name='scanner2' component={Scanner2} options={{ headerShown: false }}/>
            <Stack.Screen name='scanner3' component={Scanner3} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  loading:{
    flex:1,
  justifyContent:"center",
  alignItems:"center"
  }
});

export default App;
