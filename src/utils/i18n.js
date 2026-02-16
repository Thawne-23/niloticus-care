import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app.language';

export const LANGUAGES = {
  en: 'English',
  tl: 'Tagalog',
};

const DICT = {
  en: {
    profile_title: 'Profile',
    offline_mode: 'Offline mode',
    display_name_label: 'Display name',
    total_scans: 'Total scans',
    archived: 'Archived',
    local_note: 'Your scans and settings are stored locally on this device.',

    menu_scan_history: 'Scan History',
    menu_scan_history_sub: 'View your past scans',
    menu_language: 'Language',
    menu_language_sub: 'Change app language',
    menu_clear_history: 'Clear History',
    menu_clear_history_sub: 'Delete all scans stored on this device',
    menu_delete_archived: 'Delete Archived',
    menu_delete_archived_sub: 'Free up space by removing archived scans',
    menu_privacy_storage: 'Privacy & Storage',
    menu_privacy_storage_sub: 'How your data is stored offline',
    menu_help_support: 'Help & Support',
    menu_help_support_sub: 'Contact support via email',
    menu_about: 'About',
    menu_about_sub: 'App information',

    language_title: 'Language',
    language_english: 'English',
    language_tagalog: 'Tagalog',
    language_saved: 'Language saved.',

    alert_ok: 'OK',
    alert_cancel: 'Cancel',
    alert_clear_history_title: 'Clear scan history',
    alert_clear_history_body: 'This will permanently delete all scan history on this device. Continue?',
    alert_clear_history_action: 'Clear',
    alert_clear_history_done_title: 'Cleared',
    alert_clear_history_done_body: 'Scan history has been cleared.',
    alert_delete_archived_title: 'Delete archived history',
    alert_delete_archived_body: 'This will permanently delete all archived history items. Continue?',
    alert_delete_archived_action: 'Delete',
    alert_delete_archived_done_title: 'Deleted',
    alert_delete_archived_done_body: 'Archived history has been deleted.',
    alert_error_title: 'Error',

    scan_scan_now: 'Scan Now',
    scan_hint: 'Point your camera to identify it or upload an image from your gallery',
    scan_tips_title: 'Scanning Tips',
    scan_tip_lighting: 'Ensure good lighting',
    scan_tip_focus: 'Focus on one object at a time',
    scan_tip_reflection: 'Avoid reflective surfaces',
    scan_choose_option: 'Choose an option',
    scan_take_photo: 'Take Photo',
    scan_choose_gallery: 'Choose from Gallery',
    scan_cancel: 'Cancel',
    scan_result_title: 'Scan Result',
    scan_all_detections: 'All Detections',
    scan_care_tips: 'Care Tips',
    scan_save: 'Save to History',
    scan_close: 'Close',
    scan_preview_title: 'Preview',
    scan_preview_use_photo: 'Use Photo',
    scan_preview_retake: 'Retake',
    scan_preview_choose_another: 'Choose Another',
    scan_preview_cancel: 'Cancel',
    scan_saved_title: 'Saved',
    scan_saved_body: 'Scan saved to history.',
    scan_failed_save: 'Failed to save history.',
    scan_permission_required: 'Permission required',
    scan_camera_permission: 'Camera permission is needed to take photos',
    scan_gallery_permission: 'Gallery permission is needed to select photos',
    scan_failed_take_photo: 'Failed to take photo. Please try again.',
    scan_failed_pick_image: 'Failed to pick image. Please try again.',
    scan_failed_process: 'Failed to process image. Please try again. Check console for details.',

    history_search_placeholder: 'Search history...',
    history_filter_all: 'All',
    history_filter_healthy: 'Healthy',
    history_filter_diseased: 'Diseased',
    history_show_archived: 'Show Archived',
    history_showing_archived: 'Showing Archived',
    history_archive: 'Archive',
    history_unarchive: 'Unarchive',
    history_delete: 'Delete',
    history_delete_all_archived: 'Delete All Archived',
    history_empty_archived: 'No archived history',
    history_empty: 'No scan history yet',
    history_delete_all_title: 'Delete All Archived',
    history_delete_all_body: 'This will permanently delete all archived items. Continue?',
    history_delete_selected_title: 'Delete Selected Archived',
    history_delete_selected_body: 'This will permanently delete selected archived items. Continue?',
    history_delete_action: 'Delete',
    history_failed_archive: 'Failed to archive selected items.',
    history_failed_unarchive: 'Failed to unarchive selected items.',
    history_failed_delete_archived: 'Failed to delete archived history.',
    history_failed_delete_selected_archived: 'Failed to delete selected archived items.',

    details_title: 'Details',
    details_type: 'Type',
    details_date_time: 'Date & Time',
    details_location: 'Location',
    details_notes: 'Notes',
    details_care_tips: 'Care Tips',
    details_archive_entry: 'Archive entry',
    details_archive_confirm: 'This will archive this entry. You can no longer see it in history (unless viewing archived). Continue?',
    details_archived_title: 'Archived',
    details_archived_body: 'The entry was archived.',
    details_archive_failed: 'Archive failed',
    details_confidence: 'Confidence',

    privacy_title: 'Your Privacy',
    privacy_body: 'This app works offline. Your scan history is stored locally on your device.',

    edit_profile_title: 'Edit Profile',
    edit_profile_unavailable: 'Profile editing is not available in offline mode.',

    about_title: 'About',
    about_tagline: 'Offline fish disease detection and scan history.',
    about_what_it_does: 'What it does',
    about_what_it_does_text: 'Niloticus Care helps you scan fish images and identify possible diseases. Results can be saved to your scan history for future reference.',
    about_feature_scan: 'Image scan with bounding boxes',
    about_feature_history: 'Local scan history with archive/unarchive',
    about_feature_offline: 'Works offline (data stays on your device)',
    about_developer: 'Developer',
    about_name: 'Name',
    about_support: 'Support',
    about_email_support: 'Email Support',
  },
  tl: {
    profile_title: 'Profile',
    offline_mode: 'Offline mode',
    display_name_label: 'Pangalan sa app',
    total_scans: 'Kabuuang scan',
    archived: 'Naka-archive',
    local_note: 'Ang iyong scans at settings ay naka-save lamang sa device na ito.',

    menu_scan_history: 'Kasaysayan ng Scan',
    menu_scan_history_sub: 'Tingnan ang mga nakaraang scan',
    menu_language: 'Wika',
    menu_language_sub: 'Palitan ang wika ng app',
    menu_clear_history: 'Burahin ang History',
    menu_clear_history_sub: 'Tanggalin ang lahat ng scan sa device na ito',
    menu_delete_archived: 'Burahin ang Archived',
    menu_delete_archived_sub: 'Magbakante ng space sa pagtanggal ng naka-archive',
    menu_privacy_storage: 'Privacy at Storage',
    menu_privacy_storage_sub: 'Paano naka-store ang data offline',
    menu_help_support: 'Tulong at Suporta',
    menu_help_support_sub: 'Makipag-ugnayan via email',
    menu_about: 'Tungkol',
    menu_about_sub: 'Impormasyon ng app',

    language_title: 'Wika',
    language_english: 'English',
    language_tagalog: 'Tagalog',
    language_saved: 'Na-save ang wika.',

    alert_ok: 'OK',
    alert_cancel: 'Kanselahin',
    alert_clear_history_title: 'Burahin ang scan history',
    alert_clear_history_body: 'Permanenteng matatanggal ang lahat ng scan history sa device na ito. Ituloy?',
    alert_clear_history_action: 'Burahin',
    alert_clear_history_done_title: 'Nabura',
    alert_clear_history_done_body: 'Nabura na ang scan history.',
    alert_delete_archived_title: 'Burahin ang naka-archive',
    alert_delete_archived_body: 'Permanenteng matatanggal ang lahat ng naka-archive na history. Ituloy?',
    alert_delete_archived_action: 'Burahin',
    alert_delete_archived_done_title: 'Nabura',
    alert_delete_archived_done_body: 'Nabura na ang archived history.',
    alert_error_title: 'Error',

    scan_scan_now: 'Mag-scan',
    scan_hint: 'Itutok ang camera para makilala o mag-upload ng larawan mula sa gallery',
    scan_tips_title: 'Mga Tip sa Pag-scan',
    scan_tip_lighting: 'Siguraduhing maliwanag ang ilaw',
    scan_tip_focus: 'Tumutok sa isang bagay lang bawat scan',
    scan_tip_reflection: 'Iwasan ang mga reflective na surface',
    scan_choose_option: 'Pumili ng opsyon',
    scan_take_photo: 'Kumuha ng Larawan',
    scan_choose_gallery: 'Pumili mula sa Gallery',
    scan_cancel: 'Kanselahin',
    scan_result_title: 'Resulta ng Scan',
    scan_all_detections: 'Lahat ng Detection',
    scan_care_tips: 'Mga Tip sa Pag-aalaga',
    scan_save: 'I-save sa History',
    scan_close: 'Isara',
    scan_preview_title: 'Preview',
    scan_preview_use_photo: 'Gamitin ang Larawan',
    scan_preview_retake: 'Ulitin',
    scan_preview_choose_another: 'Pumili ng Iba',
    scan_preview_cancel: 'Kanselahin',
    scan_saved_title: 'Na-save',
    scan_saved_body: 'Na-save ang scan sa history.',
    scan_failed_save: 'Hindi na-save ang history.',
    scan_permission_required: 'Kailangan ng permiso',
    scan_camera_permission: 'Kailangan ang camera permission para makakuha ng larawan',
    scan_gallery_permission: 'Kailangan ang gallery permission para pumili ng larawan',
    scan_failed_take_photo: 'Hindi nakakuha ng larawan. Subukan ulit.',
    scan_failed_pick_image: 'Hindi nakapili ng larawan. Subukan ulit.',
    scan_failed_process: 'Hindi naproseso ang larawan. Subukan ulit. Tingnan ang console.',

    history_search_placeholder: 'Maghanap sa history...',
    history_filter_all: 'Lahat',
    history_filter_healthy: 'Healthy',
    history_filter_diseased: 'May sakit',
    history_show_archived: 'Ipakita ang Archived',
    history_showing_archived: 'Ipinapakita ang Archived',
    history_archive: 'I-archive',
    history_unarchive: 'Ibalik',
    history_delete: 'Burahin',
    history_delete_all_archived: 'Burahin Lahat ng Archived',
    history_empty_archived: 'Walang archived history',
    history_empty: 'Wala pang scan history',
    history_delete_all_title: 'Burahin Lahat ng Archived',
    history_delete_all_body: 'Permanenteng mabubura ang lahat ng archived items. Ituloy?',
    history_delete_selected_title: 'Burahin ang Napiling Archived',
    history_delete_selected_body: 'Permanenteng mabubura ang mga napiling archived items. Ituloy?',
    history_delete_action: 'Burahin',
    history_failed_archive: 'Hindi na-archive ang napiling items.',
    history_failed_unarchive: 'Hindi naibalik ang napiling items.',
    history_failed_delete_archived: 'Hindi nabura ang archived history.',
    history_failed_delete_selected_archived: 'Hindi nabura ang napiling archived items.',

    details_title: 'Detalye',
    details_type: 'Uri',
    details_date_time: 'Petsa at Oras',
    details_location: 'Lokasyon',
    details_notes: 'Mga Tala',
    details_care_tips: 'Mga Tip sa Pag-aalaga',
    details_archive_entry: 'I-archive ang entry',
    details_archive_confirm: 'I-a-archive ang entry na ito. Hindi na ito makikita sa history (maliban kung naka-show ang archived). Ituloy?',
    details_archived_title: 'Naka-archive',
    details_archived_body: 'Na-archive ang entry.',
    details_archive_failed: 'Hindi na-archive',
    details_confidence: 'Confidence',

    privacy_title: 'Privacy',
    privacy_body: 'Gumagana offline ang app na ito. Ang scan history ay naka-save lamang sa iyong device.',

    edit_profile_title: 'I-edit ang Profile',
    edit_profile_unavailable: 'Hindi available ang pag-edit ng profile sa offline mode.',

    about_title: 'Tungkol',
    about_tagline: 'Offline na pag-detect ng sakit ng isda at scan history.',
    about_what_it_does: 'Ano ang ginagawa nito',
    about_what_it_does_text: 'Tinutulungan ka ng Niloticus Care na i-scan ang larawan ng isda at tukuyin ang posibleng sakit. Maaari itong i-save sa scan history para balikan.',
    about_feature_scan: 'Pag-scan ng larawan na may bounding boxes',
    about_feature_history: 'Local scan history na may archive/unarchive',
    about_feature_offline: 'Gumagana offline (nasa device lang ang data)',
    about_developer: 'Developer',
    about_name: 'Pangalan',
    about_support: 'Suporta',
    about_email_support: 'Mag-email sa Support',
  },
};

export const getLanguage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'tl')) return stored;
  } catch (e) {
    // ignore
  }
  return 'en';
};

export const setLanguage = async (lang) => {
  const finalLang = lang === 'tl' ? 'tl' : 'en';
  try {
    await AsyncStorage.setItem(STORAGE_KEY, finalLang);
  } catch (e) {
    // ignore
  }
  return finalLang;
};

export const t = (lang, key) => {
  const l = lang === 'tl' ? 'tl' : 'en';
  return DICT[l]?.[key] ?? DICT.en?.[key] ?? key;
};

export const getLanguageLabel = (lang) => {
  const l = lang === 'tl' ? 'tl' : 'en';
  return LANGUAGES[l] || LANGUAGES.en;
};

const normalizeClassName = (className) => {
  const raw = String(className || '').trim();
  if (!raw) return '';
  if (raw === 'Healthy') return 'Healthy-Fish';
  if (raw === 'Healthy Fish') return 'Healthy-Fish';
  return raw;
};

const CARE_TIPS = {
  en: {
    'Bacterial Aeromonas Disease': [
      'Improve water quality; reduce organic load',
      'Isolate affected fish to prevent spread',
      'Consult a vet for appropriate antibiotics',
    ],
    'Healthy-Fish': [
      'Maintain temperature 25-30C',
      'Provide balanced diet and avoid overfeeding',
      'Keep ammonia and nitrite at 0 ppm',
    ],
    Streptococcus: [
      'Quarantine affected fish immediately',
      'Increase aeration; reduce stocking density',
      'Seek guidance for vaccine or treatment protocols',
    ],
    'Tilapia Lake Virus': [
      'Implement strict biosecurity and quarantine',
      'Disinfect equipment and avoid cross-contamination',
      'Report suspected outbreaks to authorities',
    ],
  },
  tl: {
    'Bacterial Aeromonas Disease': [
      'Pagbutihin ang kalidad ng tubig; bawasan ang dumi/organic load',
      'Ihiwalay ang apektadong isda para hindi kumalat',
      'Kumonsulta sa beterinaryo para sa tamang antibiotic',
    ],
    'Healthy-Fish': [
      'Panatilihin ang temperatura sa 25-30C',
      'Magbigay ng balanseng pagkain at iwasan ang sobrang pagpapakain',
      'Panatilihing 0 ppm ang ammonia at nitrite',
    ],
    Streptococcus: [
      'I-quarantine agad ang apektadong isda',
      'Dagdagan ang aeration; bawasan ang siksikan/stocking density',
      'Humingi ng gabay para sa bakuna o tamang gamutan',
    ],
    'Tilapia Lake Virus': [
      'Ipatupad ang mahigpit na biosecurity at quarantine',
      'I-disinfect ang kagamitan at iwasan ang cross-contamination',
      'I-report ang pinaghihinalaang outbreak sa awtoridad',
    ],
  },
};

export const getCareTips = (lang, className) => {
  const l = lang === 'tl' ? 'tl' : 'en';
  const key = normalizeClassName(className);
  const tips = CARE_TIPS[l]?.[key];
  if (Array.isArray(tips)) return tips;
  return [];
};
