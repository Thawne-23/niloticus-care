import 'react-native-reanimated';
// Polyfills and core imports
import 'react-native-get-random-values';
import 'react-native-gesture-handler';

// TensorFlow.js imports (enabled for dev client smoke test)
import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';

// Minimal TFJS smoke test
(async () => {
  try {
    await tf.ready();
    // rn-webgl is typically best on RN; fall back to cpu if needed
    try {
      await tf.setBackend('rn-webgl');
    } catch {}
    console.log('TFJS ready. Backend:', tf.getBackend());
    // Simple op to verify execution path
    const a = tf.tensor([1, 2, 3]);
    const b = tf.tensor([4, 5, 6]);
    const c = a.add(b);
    console.log('TF add sample:', await c.data());
    a.dispose(); b.dispose(); c.dispose();
  } catch (error) {
    console.warn('Error initializing TensorFlow.js:', error);
  }
})();

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import screens
import SignInScreen from './src/screens/auth/SignInScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import PrivacyScreen from './src/screens/profile/PrivacyScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  console.log('Rendering AuthStack');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  console.log('Rendering AppStack');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  console.log('RootNavigator', { isAuthenticated, isLoading });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </View>
  );
}

export default function App() {
  console.log('Rendering App');
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});