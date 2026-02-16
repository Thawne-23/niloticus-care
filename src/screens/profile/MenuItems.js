import { Alert, Linking } from 'react-native';
import { clearHistory, deleteArchivedHistory } from '../../utils/database';
import { t } from '../../utils/i18n';

// Helper to navigate safely
const goTo = (navigation, routeName) => {
  try {
    if (!navigation || !navigation.navigate) throw new Error('No navigation');
    navigation.navigate(routeName);
  } catch (e) {
    Alert.alert('Not Available', `The screen "${routeName}" is not set up yet.`);
  }
};

const handlePrivacySecurity = (navigation) => goTo(navigation, 'Privacy');

const handleOpenHistory = (navigation) => {
  try {
    if (!navigation || !navigation.navigate) throw new Error('No navigation');
    navigation.navigate('History');
  } catch (e) {
    Alert.alert('Not Available', 'History screen is not available.');
  }
};

const handleClearAllHistory = async ({ onDataChanged, lang } = {}) => {
  Alert.alert(
    t(lang, 'alert_clear_history_title'),
    t(lang, 'alert_clear_history_body'),
    [
      { text: t(lang, 'alert_cancel'), style: 'cancel' },
      {
        text: t(lang, 'alert_clear_history_action'),
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await clearHistory();
            if (!res?.success) throw new Error(res?.error || 'Failed to clear history');
            if (typeof onDataChanged === 'function') onDataChanged();
            Alert.alert(t(lang, 'alert_clear_history_done_title'), t(lang, 'alert_clear_history_done_body'));
          } catch (e) {
            Alert.alert(t(lang, 'alert_error_title'), String(e?.message || e));
          }
        }
      }
    ]
  );
};

const handleDeleteArchived = async ({ onDataChanged, lang } = {}) => {
  Alert.alert(
    t(lang, 'alert_delete_archived_title'),
    t(lang, 'alert_delete_archived_body'),
    [
      { text: t(lang, 'alert_cancel'), style: 'cancel' },
      {
        text: t(lang, 'alert_delete_archived_action'),
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await deleteArchivedHistory();
            if (!res?.success) throw new Error(res?.error || 'Failed to delete archived history');
            if (typeof onDataChanged === 'function') onDataChanged();
            Alert.alert(t(lang, 'alert_delete_archived_done_title'), t(lang, 'alert_delete_archived_done_body'));
          } catch (e) {
            Alert.alert(t(lang, 'alert_error_title'), String(e?.message || e));
          }
        }
      }
    ]
  );
};

const handleHelpSupport = () => {
  Alert.alert(
    'Contact Support',
    'Would you like to email our support team? You can also reach us at leollarenas23@gmail.com',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Email Support',
        onPress: async () => {
          try {
            const mailto = 'mailto:leollarenas23@gmail.com?subject=Help%20%26%20Support&body=Describe%20your%20issue%20here.';
            const supported = await Linking.canOpenURL(mailto);
            if (supported) {
              await Linking.openURL(mailto);
            } else {
              Alert.alert('Error', 'Could not open email client. Please email us at leollarenas23@gmail.com');
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to open email client. Please try again later.');
          }
        },
      },
    ]
  );
};

export const buildMenuItems = ({ navigation, onDataChanged, lang } = {}) => [
  {
    icon: 'time-outline',
    label: t(lang, 'menu_scan_history'),
    subtitle: t(lang, 'menu_scan_history_sub'),
    onPress: () => handleOpenHistory(navigation),
  },
  {
    icon: 'language-outline',
    label: t(lang, 'menu_language'),
    subtitle: t(lang, 'menu_language_sub'),
    onPress: () => goTo(navigation, 'Language'),
  },
  {
    icon: 'trash-outline',
    label: t(lang, 'menu_clear_history'),
    subtitle: t(lang, 'menu_clear_history_sub'),
    tintColor: '#FF3B30',
    onPress: () => handleClearAllHistory({ onDataChanged, lang }),
  },
  {
    icon: 'archive-outline',
    label: t(lang, 'menu_delete_archived'),
    subtitle: t(lang, 'menu_delete_archived_sub'),
    tintColor: '#FF3B30',
    onPress: () => handleDeleteArchived({ onDataChanged, lang }),
  },
  {
    icon: 'shield-checkmark-outline',
    label: t(lang, 'menu_privacy_storage'),
    subtitle: t(lang, 'menu_privacy_storage_sub'),
    onPress: () => handlePrivacySecurity(navigation),
  },
  {
    icon: 'help-circle-outline',
    label: t(lang, 'menu_help_support'),
    subtitle: t(lang, 'menu_help_support_sub'),
    onPress: handleHelpSupport,
  },
  {
    icon: 'information-circle-outline',
    label: t(lang, 'menu_about'),
    subtitle: t(lang, 'menu_about_sub'),
    onPress: () => goTo(navigation, 'About'),
  },
];

export default buildMenuItems;
