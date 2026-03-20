import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getLanguage, t } from '../../utils/i18n';

export default function AboutScreen() {
  const navigation = useNavigation();
  const APP_NAME = 'Niloticus Care';
  const VERSION = '1.0.0';
  const DEVELOPER_NAME = 'Leo Llarenas';
  const SUPPORT_EMAIL = 'leollarenas23@gmail.com';

  const [lang, setLang] = useState('en');

  const loadLanguage = useCallback(async () => {
    const current = await getLanguage();
    setLang(current);
  }, []);

  useEffect(() => {
    loadLanguage();
    const unsubscribe = navigation.addListener('focus', loadLanguage);
    return unsubscribe;
  }, [loadLanguage]);

  const onEmail = async () => {
    try {
      const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Niloticus Care Support')}`;
      const supported = await Linking.canOpenURL(mailto);
      if (!supported) {
        Alert.alert('Error', `Could not open email client. Please email us at ${SUPPORT_EMAIL}`);
        return;
      }
      await Linking.openURL(mailto);
    } catch (e) {
      Alert.alert('Error', 'Failed to open email client. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="fish" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.appMeta}>Version {VERSION}</Text>
          <Text style={styles.tagline}>{t(lang, 'about_tagline')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t(lang, 'about_what_it_does')}</Text>
          <Text style={styles.paragraph}>
            {t(lang, 'about_what_it_does_text')}
          </Text>

          <View style={styles.featureRow}>
            <Ionicons name="scan-outline" size={18} color="#007AFF" />
            <Text style={styles.featureText}>{t(lang, 'about_feature_scan')}</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="time-outline" size={18} color="#007AFF" />
            <Text style={styles.featureText}>{t(lang, 'about_feature_history')}</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#007AFF" />
            <Text style={styles.featureText}>{t(lang, 'about_feature_offline')}</Text>
          </View>
        </View>

        {/* <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data & privacy</Text>
          <Text style={styles.paragraph}>
            This app stores scan history locally using SQLite. Your display name is stored locally using AsyncStorage. No account is required.
          </Text>
        </View> */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Development Team</Text>
          
          <View style={styles.teamMember}>
            <View style={styles.memberInfo}>
              <View>
                <Text style={styles.memberName}>JOCELYN I. ANCHETA, DIT(c)</Text>
                <Text style={styles.memberEmail}>jancheta@dmmmsu.edu.ph</Text>
              </View>
              <View style={[styles.badge, styles.adviserBadge]}>
                <Text style={styles.badgeText}>Adviser</Text>
              </View>
            </View>
          </View>

          <View style={styles.teamMember}>
            <View style={styles.memberInfo}>
              <View>
                <Text style={styles.memberName}>LEO G. LLARENAS</Text>
                <Text style={styles.memberEmail}>lllarenas0993@student.dmmmsu.edu.ph</Text>
              </View>
              <View style={[styles.badge, styles.leaderBadge]}>
                <Text style={styles.badgeText}>Leader</Text>
              </View>
            </View>
          </View>

          <View style={styles.teamMember}>
            <View style={styles.memberInfo}>
              <View>
                <Text style={styles.memberName}>JUSTEL H. DACANAY</Text>
                <Text style={styles.memberEmail}>jdacanay0223@student.dmmmsu.edu.ph</Text>
              </View>
              <View style={[styles.badge, styles.memberBadge]}>
                <Text style={styles.badgeText}>Member</Text>
              </View>
            </View>
          </View>

          <View style={styles.teamMember}>
            <View style={styles.memberInfo}>
              <View>
                <Text style={styles.memberName}>AR GIE D. LAPITAN</Text>
                <Text style={styles.memberEmail}>aglapitan9063@student.dmmmsu.edu.ph</Text>
              </View>
              <View style={[styles.badge, styles.memberBadge]}>
                <Text style={styles.badgeText}>Member</Text>
              </View>
            </View>
          </View>

          <View style={styles.teamMember}>
            <View style={styles.memberInfo}>
              <View>
                <Text style={styles.memberName}>CRYSTAL ANNE B. MILO</Text>
                <Text style={styles.memberEmail}>cabmilo9913@student.dmmmsu.edu.ph</Text>
              </View>
              <View style={[styles.badge, styles.memberBadge]}>
                <Text style={styles.badgeText}>Member</Text>
              </View>
            </View>
          </View>

          <View style={styles.teamMember}>
            <View style={styles.memberInfo}>
              <View>
                <Text style={styles.memberName}>RHONAMAE H. VALDEZ</Text>
                <Text style={styles.memberEmail}>rvaldez8553@student.dmmmsu.edu.ph</Text>
              </View>
              <View style={[styles.badge, styles.memberBadge]}>
                <Text style={styles.badgeText}>Member</Text>
              </View>
            </View>
          </View>

          {/* <View style={[styles.kvRow, {marginTop: 16}]}>
            <Text style={styles.kvLabel}>{t(lang, 'about_support')}</Text>
            <Text style={styles.kvValue}>{SUPPORT_EMAIL}</Text>
          </View> */}

          {/* <TouchableOpacity style={styles.primaryBtn} onPress={onEmail}>
            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{t(lang, 'about_email_support')}</Text>
          </TouchableOpacity> */}
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
  scroll: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  appMeta: { marginTop: 2, fontSize: 13, color: '#8E8E93' },
  tagline: { marginTop: 10, fontSize: 14, color: '#3A3A3C', textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', marginBottom: 10 },
  paragraph: { color: '#444', lineHeight: 20, marginBottom: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  featureText: { marginLeft: 10, color: '#1C1C1E', fontSize: 14, fontWeight: '600' },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  kvLabel: { color: '#8E8E93', fontSize: 13 },
  kvValue: { color: '#1C1C1E', fontSize: 13, fontWeight: '700' },
  teamMember: {
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  memberEmail: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaderBadge: {
    backgroundColor: '#007AFF',
  },
  adviserBadge: {
    backgroundColor: '#34C759',
  },
  memberBadge: {
    backgroundColor: '#8E8E93',
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800' },
});
