import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, StatusBar, ScrollView, Dimensions, InteractionManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import { detectObjectsYOLO, getTopDetection } from '../yoloDetector';
import { BoundingBoxOverlay, DetectionCard } from '../utils/bbDrawer';
import { addHistoryEntry } from '../utils/database';
import { persistImage } from '../utils/file';
import { getCareTips, getLanguage, t } from '../utils/i18n';
// Don't forget to import tf here if you haven't initialized it in your root App.js
// import * as tf from '@tensorflow/tfjs'; 
// import '@tensorflow/tfjs-react-native'; 
// (If you haven't done the tf.ready() setup, you should do it in your App.js/entry component)

export default function ScanScreen() {
    const BBOX_DEBUG = false;
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewUri, setPreviewUri] = useState(null);
    const [previewSource, setPreviewSource] = useState(null); // 'camera' | 'gallery'
    const [resultsModalVisible, setResultsModalVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
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

    const handleCameraPress = () => {
        setModalVisible(true);
    };

    const handleTakePhoto = async () => {
        setModalVisible(false);
        try {
            console.log('[ScanScreen] Requesting Camera permission...');
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t(lang, 'scan_permission_required'), t(lang, 'scan_camera_permission'));
                return;
            }

            console.log('[ScanScreen] Launching Camera...');
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                console.log(`[ScanScreen] Photo captured. URI: ${uri}`);
                setPreviewSource('camera');
                setPreviewUri(uri);
                setPreviewVisible(true);
            }
        } catch (error) {
            console.error('[ScanScreen] Error taking photo:', error);
            Alert.alert(t(lang, 'alert_error_title'), t(lang, 'scan_failed_take_photo'));
        }
    };

    const handleUploadPhoto = async () => {
        setModalVisible(false);
        try {
            console.log('[ScanScreen] Requesting Gallery permission...');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t(lang, 'scan_permission_required'), t(lang, 'scan_gallery_permission'));
                return;
            }

            console.log('[ScanScreen] Launching Image Library...');
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                base64: true, // request base64 so we can handle content:// URIs on Android
                quality: 1,
            });

            if (!result.canceled) {
                                const asset = result.assets[0];
                                const uri = asset.uri;
                                console.log(`[ScanScreen] Image selected. URI: ${uri}`);

                                // Some Android gallery picks return content:// URIs that
                                // expo-file-system cannot read directly. In that case we
                                // write the provided base64 to a temporary cache file and
                                // use that file URI for downstream processing.
                                let usedUri = uri;
                                try {
                                    if (Platform.OS === 'android' && uri && uri.startsWith('content:')) {
                                        if (asset.base64) {
                                            const fileName = `upload_${Date.now()}.jpg`;
                                            const tempFileUri = FileSystem.cacheDirectory + fileName;
                                            await FileSystem.writeAsStringAsync(tempFileUri, asset.base64, { encoding: FileSystem.EncodingType.Base64 });
                                            console.log(`[ScanScreen] Wrote content URI to temp file: ${tempFileUri}`);
                                            usedUri = tempFileUri;
                                        } else {
                                            // base64 wasn't returned  fall back to original uri and
                                            // let downstream operations fail with a clear message
                                            console.warn('[ScanScreen] Selected image is a content URI but base64 was not returned.');
                                        }
                                    }
                                } catch (e) {
                                    console.error('[ScanScreen] Error handling content URI:', e);
                                    Alert.alert(t(lang, 'alert_error_title'), t(lang, 'scan_failed_pick_image'));
                                    return;
                                }

                                setPreviewSource('gallery');
                                setPreviewUri(usedUri);
                                setPreviewVisible(true);
            }
        } catch (error) {
            console.error('[ScanScreen] Error picking image:', error);
            Alert.alert(t(lang, 'alert_error_title'), t(lang, 'scan_failed_pick_image'));
        }
    };

    const handleConfirmPreview = useCallback(() => {
        if (!previewUri || isProcessing) return;
        const uri = previewUri;
        setPreviewVisible(false);
        setPreviewUri(null);
        setPreviewSource(null);

        InteractionManager.runAfterInteractions(() => {
            processImage(uri);
        });
    }, [previewUri, isProcessing]);

    const handleCancelPreview = useCallback(() => {
        setPreviewVisible(false);
        setPreviewUri(null);
        setPreviewSource(null);
    }, []);

    const handleRetryPreview = useCallback(async () => {
        const src = previewSource;
        handleCancelPreview();
        if (src === 'camera') {
            await handleTakePhoto();
        } else {
            await handleUploadPhoto();
        }
    }, [handleCancelPreview, previewSource]);

    const processImage = async (uri) => {
        try {
            console.log(`[ScanScreen] Starting processing for URI: ${uri}`);
            setIsProcessing(true);

            // CRITICAL: Persist the file immediately after capture/selection
            const permanentUri = await persistImage(uri); // Call the new utility

            // Run YOLO detection
            console.log('[ScanScreen] Calling detectObjectsYOLO...');
            const detectionResult = await detectObjectsYOLO(uri);
            console.log(`[ScanScreen] Detection complete. Found ${detectionResult.detections.length} objects.`);

            // Get the highest confidence detection for primary display
            const topDetection = getTopDetection(detectionResult.detections);

            // Domain-specific extras (unchanged)
            const scientificNameMap = {
                'Bacterial Aeromonas Disease': 'Aeromonas hydrophila',
                'Healthy-Fish': 'Oreochromis niloticus',
                'Streptococcus': 'Streptococcus agalactiae',
                'Tilapia Lake Virus': 'Tilapia tilapinevirus',
            };

            

            // Use top detection or create a placeholder if none found
            const primaryDetection = topDetection || {
                className: 'No Detection',
                confidence: 0,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };

            const scientificName = scientificNameMap[primaryDetection.className] || '';
            const careTips = getCareTips(lang, primaryDetection.className);

            const resultData = {
                className: primaryDetection.className,
                rawClassName: primaryDetection.className,
                confidence: primaryDetection.confidence,
                scientificName,
                careTips,
                imageUri: permanentUri,
                timestamp: new Date().toISOString(),
                detections: detectionResult.detections, // All detections with bounding boxes
                imageWidth: detectionResult.originalWidth,
                imageHeight: detectionResult.originalHeight,
            };

            setResult(resultData);
            setResultsModalVisible(true);
            
            // Debug logging for all detections
            console.log('[ScanScreen] ========== DETECTION RESULTS ==========');
            console.log(`[ScanScreen] Primary: ${resultData.className} | Conf:${(resultData.confidence * 100).toFixed(1)}%`);
            console.log(`[ScanScreen] Total Detections: ${resultData.detections.length}`);
            console.log(`[ScanScreen] Image Dimensions: ${resultData.imageWidth}x${resultData.imageHeight}`);
            
            if (resultData.detections.length > 0) {
              console.log('[ScanScreen] All Detections:');
              resultData.detections.forEach((det, idx) => {
                console.log(
                  `[ScanScreen]   #${idx + 1} ${det.className} | ` +
                  `Pos:(${det.x.toFixed(2)}, ${det.y.toFixed(2)}) | ` +
                  `Size:(${det.width.toFixed(2)} x ${det.height.toFixed(2)}) | ` +
                  `Conf:${(det.confidence * 100).toFixed(1)}%`
                );
              });
            }
            console.log('[ScanScreen] ====================================');
            console.log('[ScanScreen] Results modal shown.');

        } catch (error) {
            console.error('[ScanScreen] Top-level Error processing image (After detectObjectsYOLO call):', error);
            Alert.alert(t(lang, 'alert_error_title'), t(lang, 'scan_failed_process'));
        } finally {
            console.log('[ScanScreen] Image processing finished.');
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.scanContainer}>
                <View style={styles.scanFrame}>
                    <View style={styles.scanIconContainer}>
                        <Ionicons name="scan" size={80} color="#007AFF" style={styles.scanIcon} />
                    </View>
                    <Text style={styles.scanHint}>{t(lang, 'scan_hint')}</Text>
                    <TouchableOpacity 
                        style={[styles.scanButton, isProcessing && styles.disabledButton]}
                        onPress={handleCameraPress}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
                                <Text style={styles.scanButtonText}>{t(lang, 'scan_scan_now')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
                
                <View style={styles.tipContainer}>
                    <Text style={styles.tipTitle}>{t(lang, 'scan_tips_title')}</Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="sunny" size={18} color="#FF9500" />
                        <Text style={styles.tipText}>{t(lang, 'scan_tip_lighting')}</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="cube" size={18} color="#34C759" />
                        <Text style={styles.tipText}>{t(lang, 'scan_tip_focus')}</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="close-circle" size={18} color="#FF3B30" />
                        <Text style={styles.tipText}>{t(lang, 'scan_tip_reflection')}</Text>
                    </View>
                </View>
            </View>

            {/* Image Source Selection Modal (Unchanged) */}
            <Modal
                isVisible={modalVisible}
                onBackdropPress={() => setModalVisible(false)}
                style={styles.modal}
                backdropOpacity={0.5}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                animationInTiming={300}
                animationOutTiming={300}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{t(lang, 'scan_choose_option')}</Text>
                    <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: '#4285F4' }]}
                        onPress={handleTakePhoto}
                    >
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.modalButtonText}>{t(lang, 'scan_take_photo')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: '#34A853' }]}
                        onPress={handleUploadPhoto}
                    >
                        <Ionicons name="image" size={24} color="white" />
                        <Text style={styles.modalButtonText}>{t(lang, 'scan_choose_gallery')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: '#EA4335' }]}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.modalButtonText}>{t(lang, 'scan_cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isVisible={previewVisible}
                onBackdropPress={handleCancelPreview}
                onBackButtonPress={handleCancelPreview}
                style={styles.modal}
                backdropOpacity={0.5}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                animationInTiming={300}
                animationOutTiming={300}
            >
                <View style={styles.previewContent}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.previewTitle}>{t(lang, 'scan_preview_title')}</Text>
                        <TouchableOpacity style={styles.previewClose} onPress={handleCancelPreview}>
                            <Ionicons name="close" size={20} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    {previewUri ? (
                        <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
                    ) : null}

                    <View style={styles.previewActions}>
                        <TouchableOpacity
                            style={[styles.previewBtn, styles.previewUseBtn]}
                            onPress={handleConfirmPreview}
                            disabled={!previewUri || isProcessing}
                        >
                            <Ionicons name="checkmark" size={18} color="white" />
                            <Text style={styles.previewUseText}>{t(lang, 'scan_preview_use_photo')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.previewBtn, styles.previewRetryBtn]}
                            onPress={handleRetryPreview}
                            disabled={isProcessing}
                        >
                            <Ionicons name="refresh" size={18} color="#007AFF" />
                            <Text style={styles.previewRetryText}>
                                {previewSource === 'camera'
                                    ? t(lang, 'scan_preview_retake')
                                    : t(lang, 'scan_preview_choose_another')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.previewBtn, styles.previewCancelBtn]}
                            onPress={handleCancelPreview}
                            disabled={isProcessing}
                        >
                            <Text style={styles.previewCancelText}>{t(lang, 'scan_preview_cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Results Modal */}
            <Modal
                isVisible={resultsModalVisible}
                onBackdropPress={() => setResultsModalVisible(false)}
                onBackButtonPress={() => setResultsModalVisible(false)}
                style={{ margin: 0 }}
                backdropOpacity={0.5}
                animationIn={'slideInUp'}
                animationOut={'slideOutDown'}
                animationInTiming={300}
                animationOutTiming={300}
                backdropTransitionInTiming={300}
                backdropTransitionOutTiming={300}
            >
                <View style={styles.resultsModalContainer}>
                    <View style={styles.resultsModalContent}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>{t(lang, 'scan_result_title')}</Text>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setResultsModalVisible(false)}
                            >
                                <Ionicons name="close" size={20} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.resultsScrollView} contentContainerStyle={styles.scrollContent}>
                            {result && (
                                <>
                                    {console.log('[ResultsModal] Rendering results:', {
                                      className: result.className,
                                      confidence: (result.confidence * 100).toFixed(1) + '%',
                                      detectionCount: result.detections?.length || 0,
                                      imageDimensions: `${result.imageWidth}x${result.imageHeight}`,
                                    })}
                                    {result.detections && result.detections.length > 0 && 
                                      console.log(
                                        '[ResultsModal] Detection positions and sizes:\n' +
                                        result.detections.map((d, i) => 
                                          `  #${i + 1} ${d.className} | Pos:(${d.x.toFixed(2)},${d.y.toFixed(2)}) Size:(${d.width.toFixed(2)}x${d.height.toFixed(2)}) Conf:${(d.confidence * 100).toFixed(1)}%`
                                        ).join('\n')
                                      )}
                                    {/* Image and Top Detection Info */}
                                    <View style={styles.imageSection}>
                                        <View style={styles.imageWithBoxes}>
                                            <Image 
                                                source={{ uri: result.imageUri }} 
                                                style={styles.largeResultImage} 
                                                resizeMode="stretch"
                                            />
                                            {result.detections && result.detections.length > 0 && (
                                                <View style={styles.boxesOverlay}>
                                                    <BoundingBoxOverlay
                                                        detections={result.detections}
                                                        imageWidth={result.imageWidth}
                                                        imageHeight={result.imageHeight}
                                                        containerWidth={'100%'}
                                                        containerHeight={'100%'}
                                                        debug={BBOX_DEBUG}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                        
                                        <View style={styles.detectionSummary}>
                                            <Text style={styles.speciesName}>{result.className}</Text>
                                            <Text style={styles.scientificName}>{result.scientificName}</Text>
                                            
                                            <View style={styles.confidenceBadge}>
                                                <Ionicons name="ribbon" size={14} color="#FFD700" />
                                                <Text style={styles.confidenceText}>
                                                    {(result.confidence * 100).toFixed(0)}% Confidence
                                                </Text>
                                            </View>
                                            
                                            {result.detections && result.detections.length > 0 && (
                                                <View style={styles.detectionCountBadge}>
                                                    <Ionicons name="checkbox" size={12} color="#007AFF" />
                                                    <Text style={styles.detectionCountText}>
                                                        {result.detections.length} object{result.detections.length !== 1 ? 's' : ''} detected
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* All Detections List */}
                                    {result.detections && result.detections.length > 1 && (
                                        <View style={styles.section}>
                                            <Text style={styles.sectionTitle}>{t(lang, 'scan_all_detections')}</Text>
                                            {result.detections.map((detection, index) => (
                                                <DetectionCard 
                                                    key={index}
                                                    detection={detection}
                                                    index={index}
                                                />
                                            ))}
                                        </View>
                                    )}
                                    
                                    {/* Care Tips */}
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>{t(lang, 'scan_care_tips')}</Text>
                                        <View style={styles.tipsGrid}>
                                            {result.careTips.map((tip, index) => (
                                                <View key={index} style={styles.tipCard}>
                                                    <View style={styles.tipIconContainer}>
                                                        <Ionicons name="fish" size={14} color="#34A853" />
                                                    </View>
                                                    <Text style={styles.tipText}>{tip}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                        
                        <View style={styles.actionButtons}>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={async () => {
                                    try {
                                        if (!result) return;
                                        
                                        const historyEntry = {
                                            imageUri: result.imageUri,
                                            className: result.className,
                                            confidence: result.confidence,
                                            scientificName: result.scientificName,
                                            careTips: result.careTips,
                                            detections: result.detections,
                                            imageWidth: result.imageWidth,
                                            imageHeight: result.imageHeight,
                                        };
                                        
                                        console.log('[ScanScreen] Saving to database:', {
                                            className: historyEntry.className,
                                            confidence: historyEntry.confidence,
                                            detectionsCount: historyEntry.detections?.length || 0,
                                            dims: `${historyEntry.imageWidth}x${historyEntry.imageHeight}`,
                                            careTipsCount: historyEntry.careTips?.length || 0
                                        });
                                        
                                        const saveRes = await addHistoryEntry(historyEntry);
                                        if (saveRes.success) {
                                            Alert.alert(t(lang, 'scan_saved_title'), t(lang, 'scan_saved_body'));
                                            setResultsModalVisible(false);
                                        } else {
                                            Alert.alert(t(lang, 'alert_error_title'), saveRes.error || t(lang, 'scan_failed_save'));
                                        }
                                    } catch (e) {
                                        console.error('Save history error:', e);
                                        Alert.alert(t(lang, 'alert_error_title'), t(lang, 'scan_failed_save'));
                                    }
                                }}
                            >
                                <Ionicons name="save" size={18} color="white" />
                                <Text style={[styles.actionButtonText, {color: 'white'}]}>{t(lang, 'scan_save')}</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.closeModalButton]}
                                onPress={() => setResultsModalVisible(false)}
                            >
                                <Text style={[styles.actionButtonText, {color: '#1C1C1E'}]}>{t(lang, 'scan_close')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ... (Styles remain the same)
const styles = StyleSheet.create({
 // Modal styles
 modal: {
  margin: 0,
  justifyContent: 'flex-end',
 },
 modalContent: {
  width: '100%',
  backgroundColor: 'white',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 24,
  paddingBottom: 40,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 10,
 },
 previewContent: {
  width: '100%',
  backgroundColor: 'white',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
  paddingBottom: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 10,
 },
 previewHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
 },
 previewTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1C1C1E',
 },
 previewClose: {
  padding: 8,
  marginRight: -8,
 },
 previewImage: {
  width: '100%',
  height: undefined,
  aspectRatio: 1,
  borderRadius: 12,
  backgroundColor: '#F2F2F7',
 },
 previewActions: {
  marginTop: 16,
 },
 previewBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  paddingVertical: 14,
  borderRadius: 12,
  marginTop: 10,
 },
 previewUseBtn: {
  backgroundColor: '#007AFF',
 },
 previewUseText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
  marginLeft: 8,
 },
 previewRetryBtn: {
  backgroundColor: 'white',
  borderWidth: 1,
  borderColor: '#E5E5EA',
 },
 previewRetryText: {
  color: '#007AFF',
  fontSize: 16,
  fontWeight: '600',
  marginLeft: 8,
 },
 previewCancelBtn: {
  backgroundColor: '#F2F2F7',
 },
 previewCancelText: {
  color: '#1C1C1E',
  fontSize: 16,
  fontWeight: '600',
 },
 resultsModalContainer: {
  flex: 1,
  justifyContent: 'flex-end',
 },
 resultsModalContent: {
  backgroundColor: 'white',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  width: '100%',
  maxHeight: '90%',
  overflow: 'hidden',
  flexDirection: 'column',
  flex: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 10,
 },
 resultsHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
 },
 resultsScrollView: {
  flex: 1,
  width: '100%',
 },
 scrollContent: {
  paddingBottom: 16,
 },
 imageSection: {
  paddingHorizontal: 20,
  paddingTop: 20,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
 },
 largeResultImage: {
  width: '100%',
  height: undefined,
  aspectRatio: 1,
  borderRadius: 12,
  marginBottom: 16,
 },
 imageWithBoxes: {
  position: 'relative',
  width: '100%',
  height: undefined,
  aspectRatio: 1,
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 16,
 },
 boxesOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 10,
 },
 detectionSummary: {
  backgroundColor: '#F8F9FA',
  borderRadius: 12,
  padding: 12,
 },
 resultsTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1C1C1E',
 },
 closeButton: {
  padding: 8,
  marginRight: -8,
 },
 resultCard: {
  padding: 20,
  flexDirection: 'row',
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
 },
 imageContainer: {
  width: 80,
  height: 80,
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#F8F9FA',
 },
 resultImage: {
  width: '100%',
  height: '100%',
 },
 speciesInfo: {
  flex: 1,
  marginLeft: 16,
 },
 speciesName: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1C1C1E',
  marginBottom: 2,
 },
 scientificName: {
  fontSize: 13,
  color: '#8E8E93',
  fontStyle: 'italic',
  marginBottom: 10,
 },
 confidenceBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F0F7FF',
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 10,
  alignSelf: 'flex-start',
 },
 confidenceText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#007AFF',
  marginLeft: 6,
 },
 section: {
  paddingHorizontal: 20,
  paddingTop: 4,
  paddingBottom: 16,
 },
 sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
  paddingTop: 8,
 },
 sectionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1C1C1E',
  marginLeft: 8,
 },
 tipsGrid: {
  flexDirection: 'column',
 },
 tipCard: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#F5F5F5',
 },
 tipIconContainer: {
  backgroundColor: 'rgba(52, 199, 89, 0.1)',
  width: 24,
  height: 24,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
  marginTop: 1,
 },
 tipText: {
  flex: 1,
  fontSize: 14,
  lineHeight: 20,
  color: '#3A3A3C',
  paddingRight: 8,
 },
 actionButtons: {
  flexDirection: 'row',
  padding: 16,
  paddingTop: 8,
  backgroundColor: '#F8F8F8',
  borderTopWidth: 1,
  borderTopColor: '#E5E5EA',
 },
 actionButton: {
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 14,
  borderRadius: 10,
  marginHorizontal: 4,
 },
 saveButton: {
  backgroundColor: '#007AFF',
 },
 closeButton: {
  backgroundColor: 'white',
  borderWidth: 1,
  borderColor: '#E5E5EA',
 },
 actionButtonText: {
  fontSize: 15,
  fontWeight: '600',
  marginLeft: 8,
 },
 modalTitle: {
  fontSize: 20,
  fontWeight: '700',
  marginBottom: 24,
  color: '#1C1C1E',
  alignSelf: 'flex-start',
 },
 modalButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
 },
 modalButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
 },
 modalIcon: {
  marginRight: 8,
 },
 // Common styles
 // Main container with safe area padding
 container: {
  flex: 1,
  backgroundColor: '#F8F8F8',
  paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
 },
 disabledButton: {
  backgroundColor: '#cccccc',
 },
 resultContainer: {
  marginTop: 20,
  alignItems: 'center',
  padding: 10,
  backgroundColor: '#f8f9fa',
  borderRadius: 10,
  width: '100%',
 },
 resultImage: {
  width: 200,
  height: 200,
  borderRadius: 10,
  marginBottom: 10,
 },
 resultText: {
  fontSize: 16,
  fontWeight: '600',
  textAlign: 'center',
  color: '#333',
 },
 sectionTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1C1C1E',
 },
 scanContainer: {
  flex: 1,
  padding: 20,
  paddingTop: 16,
 },
 scanFrame: {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 24,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
 },
 scanIconContainer: {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: 'rgba(0, 122, 255, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 24,
 },
 scanIcon: {
  opacity: 0.8,
 },
 scanTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: '#1C1C1E',
  marginBottom: 8,
  textAlign: 'center',
 },
 scanHint: {
  fontSize: 15,
  color: '#8E8E93',
  textAlign: 'center',
  marginBottom: 32,
  lineHeight: 22,
  paddingHorizontal: 16,
 },
 scanButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#007AFF',
  paddingVertical: 14,
  paddingHorizontal: 32,
  borderRadius: 12,
  marginTop: 8,
  shadowColor: '#007AFF',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 5,
 },
 buttonIcon: {
  marginRight: 8,
 },
 scanButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
 },
 tipContainer: {
  marginTop: 24,
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 20,
  width: '100%',
 },
 tipTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1C1C1E',
  marginBottom: 12,
 },
 tipItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
 },
 tipText: {
  marginLeft: 12,
  fontSize: 14,
  color: '#636366',
 },
  imageContainerWithBBox: {
    width: 300,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
  },
  detectionCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  detectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  detectionsScrollView: {
    maxHeight: 200,
  },
});

