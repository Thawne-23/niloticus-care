import 'react-native-reanimated';
// Polyfills and core imports
import 'react-native-get-random-values';
import 'react-native-gesture-handler';

// Initialize detection model
import { initializeDetectionModel } from './src/yoloDetector';
import { initDatabase } from './src/utils/database';

// Run mock TF initialization and smoke test will be executed from App component

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import PrivacyScreen from './src/screens/profile/PrivacyScreen';
import AboutScreen from './src/screens/profile/AboutScreen';
import LanguageScreen from './src/screens/profile/LanguageScreen';
import DetailsHistory from './src/screens/DetailsHistory';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  console.log('Rendering AppNavigator');
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="DetailsHistory" 
          component={DetailsHistory} 
          options={{ 
            title: 'Scan Details',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen} 
          options={{ 
            title: 'Edit Profile',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="Privacy" 
          component={PrivacyScreen} 
          options={{ 
            title: 'Privacy Policy',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen} 
          options={{ 
            title: 'About',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="Language" 
          component={LanguageScreen} 
          options={{ 
            title: 'Language',
            headerBackTitle: 'Back'
          }} 
        />
      </Stack.Navigator>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </NavigationContainer>
  );
}

export default function App() {
  const [tfStatus, setTfStatus] = React.useState({ loading: true });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Initialize database first
        console.log('[App.js] Initializing database...');
        await initDatabase();
        console.log('[App.js] Database initialized.');

        console.log('[App.js] Initializing YOLO detection model...');
        await initializeDetectionModel();
        console.log('[App.js] YOLO detection model initialized.');
        if (mounted) setTfStatus({ loading: false, ok: true });
      } catch (error) {
        if (mounted) setTfStatus({ loading: false, ok: false, details: String(error) });
        console.warn('Error initializing app services:', error);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      {/* Small debug banner shown on top when dev build is active */}
      {/* {tfStatus && !tfStatus.loading && (
        <View style={{ position: 'absolute', left: 8, right: 8, bottom: 16, padding: 8, backgroundColor: tfStatus.ok ? 'rgba(0,128,0,0.85)' : 'rgba(200,0,0,0.9)', borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{tfStatus.ok ? 'TF OK' : 'TF ERROR'}</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>{tfStatus.details}</Text>
        </View>
      )} */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});