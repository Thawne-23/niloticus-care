import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';
import { classifyImage } from '../tfliteClassifier';
import { addHistoryEntry } from '../utils/database';

export default function ScanScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleCameraPress = () => {
    setModalVisible(true);
  };

  const handleTakePhoto = async () => {
    setModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleUploadPhoto = async () => {
    setModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is needed to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const processImage = async (uri) => {
    try {
      setIsProcessing(true);

      // Run TFLite classification
      const prediction = await classifyImage(uri);

      // Domain-specific extras
      const scientificNameMap = {
        'Bacterial Aeromonas Disease': 'Aeromonas hydrophila',
        'Healthy-Fish': 'Oreochromis niloticus',
        'Streptococcus': 'Streptococcus agalactiae',
        'Tilapia Lake Virus': 'Tilapia tilapinevirus',
      };

      const careTipsMap = {
        'Bacterial Aeromonas Disease': [
          'Improve water quality; reduce organic load',
          'Isolate affected fish to prevent spread',
          'Consult a vet for appropriate antibiotics',
        ],
        'Healthy-Fish': [
          'Maintain temperature 25-30°C',
          'Provide balanced diet and avoid overfeeding',
          'Keep ammonia and nitrite at 0 ppm',
        ],
        'Streptococcus': [
          'Quarantine affected fish immediately',
          'Increase aeration; reduce stocking density',
          'Seek guidance for vaccine or treatment protocols',
        ],
        'Tilapia Lake Virus': [
          'Implement strict biosecurity and quarantine',
          'Disinfect equipment and avoid cross-contamination',
          'Report suspected outbreaks to authorities',
        ],
      };

      const scientificName = scientificNameMap[prediction.className] || '';
      const careTips = careTipsMap[prediction.className] || [];

      const resultData = {
        className: prediction.className,
        confidence: prediction.confidence,
        scientificName,
        careTips,
        imageUri: uri,
        timestamp: new Date().toISOString(),
      };

      setResult(resultData);
      setResultsModalVisible(true);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
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
          <Text style={styles.scanHint}>Point your camera at an object to identify it or upload an image from your gallery</Text>
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
                <Text style={styles.scanButtonText}>Scan Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>Scanning Tips</Text>
          <View style={styles.tipItem}>
            <Ionicons name="sunny" size={18} color="#FF9500" />
            <Text style={styles.tipText}>Ensure good lighting</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="cube" size={18} color="#34C759" />
            <Text style={styles.tipText}>Focus on one object at a time</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="close-circle" size={18} color="#FF3B30" />
            <Text style={styles.tipText}>Avoid reflective surfaces</Text>
          </View>
        </View>
      </View>

      {/* Image Source Selection Modal */}
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
          <Text style={styles.modalTitle}>Choose an option</Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#4285F4' }]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.modalButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#34A853' }]}
            onPress={handleUploadPhoto}
          >
            <Ionicons name="image" size={24} color="white" />
            <Text style={styles.modalButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#EA4335' }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={resultsModalVisible}
        onBackdropPress={() => setResultsModalVisible(false)}
        onBackButtonPress={() => setResultsModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
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
              <Text style={styles.resultsTitle}>Scan Result</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setResultsModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {result && (
              <>
                <View style={styles.resultCard}>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: result.imageUri }} 
                      style={styles.resultImage} 
                      resizeMode="cover"
                    />
                  </View>
                  
                  <View style={styles.speciesInfo}>
                    <Text style={styles.speciesName}>{result.className}</Text>
                    <Text style={styles.scientificName}>{result.scientificName}</Text>
                    
                    <View style={styles.confidenceBadge}>
                      <Ionicons name="ribbon" size={14} color="#FFD700" />
                      <Text style={styles.confidenceText}>
                        {(result.confidence * 100).toFixed(0)}% Confidence
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Care Tips</Text>
                  </View>
                  
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
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={async () => {
                      try {
                        if (!result) return;
                        const saveRes = await addHistoryEntry({
                          imageUri: result.imageUri,
                          className: result.className,
                          confidence: result.confidence,
                          scientificName: result.scientificName,
                          careTips: result.careTips,
                        });
                        if (saveRes.success) {
                          Alert.alert('Saved', 'Scan saved to history.');
                          setResultsModalVisible(false);
                        } else {
                          Alert.alert('Error', saveRes.error || 'Failed to save history.');
                        }
                      } catch (e) {
                        console.error('Save history error:', e);
                        Alert.alert('Error', 'Failed to save history.');
                      }
                    }}
                  >
                    <Ionicons name="save" size={18} color="white" />
                    <Text style={[styles.actionButtonText, {color: 'white'}]}>Save</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => setResultsModalVisible(false)}
                  >
                    <Text style={[styles.actionButtonText, {color: '#1C1C1E'}]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  resultsModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 16,
  },
  resultsModalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
});
