import { Alert, Linking } from 'react-native';

// Helper to navigate safely
const goTo = (navigation, routeName) => {
  try {
    if (!navigation || !navigation.navigate) throw new Error('No navigation');
    navigation.navigate(routeName);
  } catch (e) {
    Alert.alert('Not Available', `The screen "${routeName}" is not set up yet.`);
  }
};

const handleEditProfile = (navigation) => goTo(navigation, 'EditProfile');
const handlePrivacySecurity = (navigation) => goTo(navigation, 'Privacy');

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

const handleAbout = () => {
  Alert.alert(
    'About Niloticus Care',
    'Niloticus Care helps diagnose fish diseases and manage your aquaculture data.'
  );
};

export const buildMenuItems = ({ navigation }) => [
  { icon: 'person-outline', label: 'Edit Profile', onPress: () => handleEditProfile(navigation) },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security', onPress: () => handlePrivacySecurity(navigation) },
  { icon: 'help-circle-outline', label: 'Help & Support', onPress: handleHelpSupport },
  { icon: 'information-circle-outline', label: 'About', onPress: handleAbout },
];

export default buildMenuItems;
