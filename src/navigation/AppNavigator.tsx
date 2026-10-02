import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import AgeVerificationScreen from '../screens/AgeVerificationScreen';

export type RootStackParamList = {
  Welcome: undefined;
  AgeVerification: undefined;
  CreateAccount: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />
        <Stack.Screen
          name="AgeVerification"
          component={AgeVerificationScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
