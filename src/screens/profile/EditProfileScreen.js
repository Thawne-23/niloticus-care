import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getLanguage, t } from '../../utils/i18n';

export default function EditProfileScreen() {
  const navigation = useNavigation();

  const [lang, setLang] = useState('en');

  const loadLanguage = useCallback(async () => {
    const current = await getLanguage();
    setLang(current);
  }, []);

  useEffect(() => {
    loadLanguage();
    const unsubscribe = navigation.addListener('focus', loadLanguage);
    return unsubscribe;
  }, [loadLanguage, navigation]);
  
  const handleSave = () => {
    Alert.alert(
      t(lang, 'edit_profile_title'),
      t(lang, 'edit_profile_unavailable'),
      [{ text: t(lang, 'alert_ok') }]
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.note}>
            {t(lang, 'edit_profile_unavailable')}
          </Text>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t(lang, 'alert_ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  note: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: { marginTop: 12, fontWeight: '600', color: '#444' },
  value: { marginTop: 4, fontSize: 16, color: '#1C1C1E' },
  note: { marginTop: 16, color: '#666' },
});
