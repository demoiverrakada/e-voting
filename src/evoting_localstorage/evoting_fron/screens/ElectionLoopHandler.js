import React, { useEffect } from 'react';
import { View, Text, Alert } from 'react-native';

export default function ElectionLoopHandler({ route, navigation }) {
  const { voter_id, elections, currentIndex } = route.params;

  useEffect(() => {
    if (currentIndex >= elections.length) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'homePO' }]
      });
      return;
    }

    const currentElection = elections[currentIndex];
    
    Alert.alert(
      `Election ${currentElection}`,
      `Process election ${currentElection}`,
      [
        {
          text: 'Start',
          onPress: () => navigation.navigate('scanner2', {
            voter_id,
            election_id: currentElection,
            remainingElections: elections,
            currentIndex
          })
        }
      ]
    );
  }, [currentIndex, elections.length, navigation]);

  return <View />;
}
