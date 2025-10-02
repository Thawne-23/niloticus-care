import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { initDatabase, verifyUser, addUser, findUserByEmail } from '../utils/database';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize database and load auth state
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize the database
        console.log('Initializing database...');
        await initDatabase().catch(error => {
          console.error('Failed to initialize database:', error);
          throw error;
        });
        
        // Check if user is logged in
        console.log('Checking for existing session...');
        const token = await SecureStore.getItemAsync('userToken');
        const email = await SecureStore.getItemAsync('userEmail');
        if (token) {
          setUserToken(token);
          setIsAuthenticated(true);
          // Attempt to restore user profile
          if (email) {
            try {
              const user = await findUserByEmail(email);
              if (user) {
                setCurrentUser(user);
              }
            } catch (err) {
              console.error('Failed to restore user profile:', err);
            }
          }
        }
      } catch (e) {
        console.error('Failed to initialize app', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const signIn = async (email, password) => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      const result = await verifyUser(email, password);
      
      if (result.success) {
        const token = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${email}:${Date.now()}`
        );
        
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userEmail', email);
        setUserToken(token);
        setIsAuthenticated(true);
        setCurrentUser(result.user);
        return { success: true };
      }
      
      return result; // Return the error from verifyUser
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An error occurred during sign in' };
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userEmail');
      setUserToken(null);
      setIsAuthenticated(false);
      setCurrentUser(null);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (userData) => {
    try {
      const { email, password, username = '' } = userData;
      
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      // In a real app, you should hash the password before storing it
      const result = await addUser({
        email,
        password, // In production, hash this password
        username
      });
      
      if (result.success) {
        // Automatically sign in the user after successful registration
        return await signIn(email, password);
      }
      
      return result; // Return the error from addUser
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An error occurred during sign up' };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoading,
        isAuthenticated,
        userToken,
        currentUser,
        signIn,
        signOut,
        signUp 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
