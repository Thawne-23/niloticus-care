import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLanguage, setLanguage, t } from '../../utils/i18n';

export default function LanguageScreen({ navigation }) {
  const [lang, setLang] = useState('en');

  const load = useCallback(async () => {
    const current = await getLanguage();
    setLang(current);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = navigation?.addListener?.('focus', load);
    return unsubscribe;
  }, [load, navigation]);

  const choose = useCallback(
    async (next) => {
      const saved = await setLanguage(next);
      setLang(saved);
      Alert.alert(t(saved, 'language_title'), t(saved, 'language_saved'), [{ text: t(saved, 'alert_ok') }]);
    },
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => choose('en')}>
          <Text style={styles.label}>{t(lang, 'language_english')}</Text>
          {lang === 'en' ? <Ionicons name="checkmark" size={18} color="#007AFF" /> : null}
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={() => choose('tl')}>
          <Text style={styles.label}>{t(lang, 'language_tagalog')}</Text>
          {lang === 'tl' ? <Ionicons name="checkmark" size={18} color="#007AFF" /> : null}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.doneText}>{t(lang, 'alert_ok')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    overflow: 'hidden',
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
  },
  doneBtn: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
