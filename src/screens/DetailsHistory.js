import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { archiveHistoryEntry } from '../utils/database';
import { BoundingBoxOverlay, DetectionCard } from '../utils/bbDrawer';
import { getCareTips, getLanguage, t } from '../utils/i18n';

export default function DetailsHistory({ route }) {
  const navigation = useNavigation();
  const { item } = route.params;
  const [working, setWorking] = useState(false);
  const [lang, setLang] = useState('en');
  const BBOX_DEBUG = false;

  const localizedCareTips = (() => {
    const sourceClass = item?.rawClassName || item?.disease || '';
    const tips = getCareTips(lang, sourceClass);
    if (Array.isArray(tips) && tips.length > 0) return tips;
    if (Array.isArray(item?.careTips) && item.careTips.length > 0) return item.careTips;
    return [];
  })();

  const loadLanguage = useCallback(async () => {
    const current = await getLanguage();
    setLang(current);
  }, []);

  useEffect(() => {
    loadLanguage();
    const unsubscribe = navigation.addListener('focus', loadLanguage);
    return unsubscribe;
  }, [loadLanguage, navigation]);

  // Log when details are viewed
  React.useEffect(() => {
    console.log('[DetailsHistory] item:', item);
    console.log('[DetailsHistory] History item clicked:');
    console.log('  Disease:', item.disease);
    console.log('  Confidence:', (item.confidence * 100).toFixed(1) + '%');
    console.log('  Type:', item.type);
    console.log('  Date:', item.date);
    console.log('  Detections:', item.detections?.length || 0);
    console.log('  Care Tips:', item.careTips?.length || 0);
    if (item.detections && item.detections.length > 0) {
      console.log('  Detection Details:');
      item.detections.forEach((d, idx) => {
        // Handle both property naming conventions
        const width = d.width || d.w || 0;
        const height = d.height || d.h || 0;
        console.log(`    #${idx + 1}: Pos:(${(d.x * 100).toFixed(1)}%, ${(d.y * 100).toFixed(1)}%), Size:(${(width * 100).toFixed(1)}%×${(height * 100).toFixed(1)}%), Conf:${(d.confidence * 100).toFixed(1)}%`);
      });
    }
  }, [item]);

  const getDiseaseColor = (disease) => {
    switch(disease) {
      case 'Healthy': return '#34C759';
      case 'Streptococcus': return '#FF3B30';
      case 'Columnaris': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const onArchive = useCallback(() => {
    Alert.alert(
      t(lang, 'details_archive_entry'),
      t(lang, 'details_archive_confirm'),
      [
        { text: t(lang, 'alert_cancel'), style: 'cancel' },
        { 
          text: t(lang, 'history_archive'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              setWorking(true);
              const res = await archiveHistoryEntry(item.id);
              if (!res?.success) throw new Error(res?.error || 'Failed to archive');
              Alert.alert(t(lang, 'details_archived_title'), t(lang, 'details_archived_body'));
              navigation.goBack();
            } catch (e) {
              Alert.alert(t(lang, 'details_archive_failed'), String(e?.message || e));
            } finally {
              setWorking(false);
            }
          }
        }
      ]
    );
  }, [item?.id, lang, navigation]);


  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }}
          style={styles.detailImage}
          resizeMode="stretch"
        />
        {item.detections && item.detections.length > 0 && (
          <View style={styles.overlayWrapper}>
            <BoundingBoxOverlay
              detections={item.detections}
              imageWidth={item.imageWidth || 640}
              imageHeight={item.imageHeight || 640}
              containerWidth="100%"
              containerHeight="100%"
              debug={BBOX_DEBUG}
            />
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.diseaseTitle, { color: getDiseaseColor(item.disease) }]}>
            {item.disease}
          </Text>
          <View style={[styles.confidenceBadge, { backgroundColor: `${getDiseaseColor(item.disease)}20` }]}>
            <Text style={[styles.confidenceText, { color: getDiseaseColor(item.disease) }]}>
              {(item.confidence * 100).toFixed(0)}% {t(lang, 'details_confidence')}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t(lang, 'details_title')}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="fish" size={20} color="#8E8E93" style={styles.icon} />
            <View>
              <Text style={styles.detailLabel}>{t(lang, 'details_type')}</Text>
              <Text style={styles.detailValue}>{item.type}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#8E8E93" style={styles.icon} />
            <View>
              <Text style={styles.detailLabel}>{t(lang, 'details_date_time')}</Text>
              <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
            </View>
          </View>
          
          {item.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#8E8E93" style={styles.icon} />
              <View>
                <Text style={styles.detailLabel}>{t(lang, 'details_location')}</Text>
                <Text style={styles.detailValue}>{item.location || 'Not specified'}</Text>
              </View>
            </View>
          )}
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.detailLabel}>{t(lang, 'details_notes')}</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        {localizedCareTips.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>{t(lang, 'details_care_tips')}</Text>
            {localizedCareTips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" style={styles.tipIcon} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* {item.detections && item.detections.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Detections</Text>
            {item.detections.map((detection, index) => {
              const width = detection.width || detection.w || 0;
              const height = detection.height || detection.h || 0;
              return (
                <View key={index} style={styles.detectionRow}>
                  <Text style={styles.detectionLabel}>Detection #{index + 1}</Text>
                  <View style={styles.detectionInfo}>
                    <Text style={styles.detectionText}>Position: ({(detection.x * 100).toFixed(1)}%, {(detection.y * 100).toFixed(1)}%)</Text>
                    <Text style={styles.detectionText}>Size: {(width * 100).toFixed(1)}% × {(height * 100).toFixed(1)}%</Text>
                    <Text style={styles.detectionText}>Confidence: {(detection.confidence * 100).toFixed(1)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )} */}

        {item.allPredictions && item.allPredictions.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>All Predictions</Text>
            {item.allPredictions.map((pred, index) => (
              <View key={index} style={styles.predictionRow}>
                <Text style={styles.predictionClass}>{pred.className.replace('-Fish', '')}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${(pred.confidence * 100).toFixed(0)}%`, backgroundColor: getDiseaseColor(pred.className.replace('-Fish', '')) }]} />
                </View>
                <Text style={styles.predictionConfidence}>
                  {(pred.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionsRow}>
          {/* <TouchableOpacity 
            style={[styles.actionButton, styles.archiveBtn]}
            onPress={onArchive}
            disabled={working}
          >
            <Ionicons name="archive" size={16} color="#0A84FF" />
            <Text style={[styles.actionText, { color: '#0A84FF' }]}>{t(lang, 'history_archive')}</Text>
          </TouchableOpacity> */}
        </View>

        {working && (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator />
          </View>
        )}

        {/* All Detections */}
        {item.detections && item.detections.length > 1 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>{t(lang, 'scan_all_detections')}</Text>
            {item.detections.map((detection, index) => (
              <DetectionCard
                key={index}
                detection={detection}
                index={index}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  diseaseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1C1C1E',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 15,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
  },
  notesText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    flex: 1,
  },
  detectionRow: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  detectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  detectionInfo: {
    gap: 4,
  },
  detectionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 24,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  archiveBtn: {
    borderColor: '#0A84FF33',
    backgroundColor: '#0A84FF0F',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionClass: {
    width: '40%',
    fontSize: 14,
    color: '#3C3C43',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#EFEFF4',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  predictionConfidence: {
    width: '15%',
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
});
