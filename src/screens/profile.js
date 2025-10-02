import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import buildMenuItems from './profile/MenuItems';

export default function ProfileScreen() {
  const { signOut, currentUser } = useAuth();
  const navigation = useNavigation();

  const displayName = currentUser?.username || currentUser?.email?.split('@')[0] || 'User';
  const avatarUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=007AFF&color=fff`;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
      { cancelable: false }
    );
  };

  const menuItems = buildMenuItems({ navigation });

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: avatarUri,
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIcon} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{currentUser?.email || 'No email'}</Text>
      </View>
      
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={24} color="#007AFF" />
            <Text style={styles.menuText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity 
        style={[styles.signOutButton, { marginTop: 'auto' }]} 
        onPress={currentUser ? handleSignOut : () => navigation.navigate('SignIn')}
      >
        <Ionicons 
          name={currentUser ? "log-out-outline" : "log-in-outline"} 
          size={20} 
          color="#FF3B30" 
        />
        <Text style={[styles.signOutButtonText, { color: '#FF3B30' }]}>
          {currentUser ? 'Sign Out' : 'Log In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  avatarContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  profileEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  menuContainer: {
    marginTop: 20,
    backgroundColor: 'white',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
