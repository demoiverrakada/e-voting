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
import VoterVerify from './screens/VoterCheck.js';
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
            <Stack.Screen name="scanner" component={VoterVerify} options={{ headerShown: false }}/>
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
