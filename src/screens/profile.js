import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import buildMenuItems from './profile/MenuItems';
import { getHistoryEntries } from '../utils/database';
import { getLanguage, t } from '../utils/i18n';

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [displayName, setDisplayName] = useState('Offline User');
  const [editingName, setEditingName] = useState(false);
  const [historyStats, setHistoryStats] = useState({ total: 0, archived: 0 });
  const [lang, setLang] = useState('en');

  const initials = useMemo(() => {
    const trimmed = String(displayName || '').trim();
    if (!trimmed) return 'U';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || 'U';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '';
    return (first + last).toUpperCase();
  }, [displayName]);

  const loadProfile = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('profile.displayName');
      if (storedName) setDisplayName(storedName);
    } catch (e) {
      // ignore
    }
  }, []);

  const loadLanguage = useCallback(async () => {
    const current = await getLanguage();
    setLang(current);
  }, []);

  const saveProfileName = useCallback(async (name) => {
    const cleaned = String(name || '').trim();
    const finalName = cleaned.length ? cleaned : 'Offline User';
    setDisplayName(finalName);
    try {
      await AsyncStorage.setItem('profile.displayName', finalName);
    } catch (e) {
      // ignore
    }
  }, []);

  const loadHistoryStats = useCallback(async () => {
    try {
      const rows = await getHistoryEntries({ includeArchived: true });
      const total = rows.length;
      const archived = rows.filter(r => Boolean(r.archived)).length;
      setHistoryStats({ total, archived });
    } catch (e) {
      setHistoryStats({ total: 0, archived: 0 });
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadHistoryStats();
    loadLanguage();
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistoryStats();
      loadLanguage();
    });
    return unsubscribe;
  }, [loadHistoryStats, loadLanguage, loadProfile, navigation]);

  const menuItems = buildMenuItems({ navigation, onDataChanged: loadHistoryStats, lang });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.screenTitle}>{t(lang, 'profile_title')}</Text>
              <Text style={styles.screenSubtitle}>{t(lang, 'offline_mode')}</Text>
            </View>
          </View>

          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t(lang, 'display_name_label')}</Text>
              {editingName ? (
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.nameInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={async () => {
                    setEditingName(false);
                    await saveProfileName(displayName);
                  }}
                  blurOnSubmit
                />
              ) : (
                <Text style={styles.displayName}>{displayName}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={async () => {
                if (editingName) {
                  setEditingName(false);
                  await saveProfileName(displayName);
                } else {
                  setEditingName(true);
                }
              }}
            >
              <Ionicons name={editingName ? 'checkmark' : 'pencil'} size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{historyStats.total}</Text>
            <Text style={styles.statLabel}>{t(lang, 'total_scans')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{historyStats.archived}</Text>
            <Text style={styles.statLabel}>{t(lang, 'archived')}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={22} color={item.tintColor || '#007AFF'} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuText}>{item.label}</Text>
                {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerNote}>
          {t(lang, 'local_note')}
        </Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  headerRight: {
    marginLeft: 12,
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  screenSubtitle: {
    marginTop: 2,
    color: '#8E8E93',
    fontSize: 13,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  displayName: {
    color: '#1C1C1E',
    fontSize: 20,
    fontWeight: '800',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F8F8F8',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  statsCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F2F2F7',
  },
  menuContainer: {
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  menuSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8E8E93',
  },
  footerNote: {
    marginTop: 14,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    paddingHorizontal: 20,
  },
});
