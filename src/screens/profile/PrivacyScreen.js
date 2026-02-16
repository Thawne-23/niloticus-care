import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getLanguage, t } from '../../utils/i18n';

export default function PrivacyScreen() {
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

  return (
    <View style={styles.container}>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{t(lang, 'privacy_title')}</Text>
          <Text style={styles.paragraph}>
            {t(lang, 'privacy_body')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Storage</Text>
          <Text style={styles.paragraph}>
            Your account data is stored locally using SQLite. Future versions may support
            cloud sync with appropriate encryption and safeguards.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.paragraph}>
            The app may request camera and file permissions to enable scanning and photo
            uploads. You can manage these permissions from your device settings.
          </Text>
        </View>
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#1C1C1E' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  paragraph: { color: '#444', lineHeight: 20 },
});
