import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  StatusBar,
  TextInput,
  RefreshControl,
  Alert,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getHistoryEntries,
  archiveHistoryEntry,
  deleteArchivedHistory
} from '../utils/database';
import { getLanguage, t } from '../utils/i18n';

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [historyData, setHistoryData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [lang, setLang] = useState('en');

  const navigation = useNavigation();

  const loadLanguage = useCallback(async () => {
    const current = await getLanguage();
    setLang(current);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setRefreshing(true);
      const rows = await getHistoryEntries({ includeArchived: true });
      const mapped = rows.map(r => ({
        id: String(r.id),
        date: r.createdAt,
        disease: r.className === 'Healthy-Fish' ? 'Healthy' : r.className,
        rawClassName: r.className,
        confidence: Number(r.confidence || 0),
        image: r.imageUri,
        type: r.scientificName || '—',
        archived: Boolean(r.archived),
        detections: Array.isArray(r.detections) ? r.detections : [],
        careTips: Array.isArray(r.careTips) ? r.careTips : [],
        imageWidth: typeof r.imageWidth === 'number' ? r.imageWidth : 0,
        imageHeight: typeof r.imageHeight === 'number' ? r.imageHeight : 0,
      }));
      setHistoryData(mapped);
      setSelectedItems([]);
    } catch (e) {
      console.error('Failed to load history', e);
      setHistoryData([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadLanguage();
    const unsubscribe = navigation.addListener('focus', () => {
      loadLanguage();
    });
    return unsubscribe;
  }, [loadHistory, loadLanguage, navigation]);

  const filteredHistory = historyData
    .filter(item => item.archived === showArchived)
    .filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.disease.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q);

      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'healthy' && item.disease === 'Healthy') ||
        (selectedFilter === 'diseased' && item.disease !== 'Healthy');

      return matchesSearch && matchesFilter;
    });

  const getDiseaseColor = (disease) => {
    switch (disease) {
      case 'Healthy': return '#34C759';
      case 'Streptococcus': return '#FF3B30';
      case 'Columnaris': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const toggleSelectItem = (item) => {
    if (selectedItems.includes(item.id)) {
      setSelectedItems(prev => prev.filter(id => id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, item.id]);
    }
  };

  const handleArchiveSelected = async () => {
    try {
      for (let id of selectedItems) {
        await archiveHistoryEntry(id, true);
      }
      await loadHistory();
    } catch (e) {
      console.error('Failed to archive', e);
      Alert.alert(t(lang, 'alert_error_title'), t(lang, 'history_failed_archive'));
    }
  };

  const handleUnarchiveSelected = async () => {
    try {
      for (let id of selectedItems) {
        await archiveHistoryEntry(id, false);
      }
      await loadHistory();
    } catch (e) {
      console.error('Failed to unarchive', e);
      Alert.alert(t(lang, 'alert_error_title'), t(lang, 'history_failed_unarchive'));
    }
  };

  const handleDeleteArchived = async () => {
    if (selectedItems.length === 0) {
      Alert.alert(
        t(lang, 'history_delete_all_title'),
        t(lang, 'history_delete_all_body'),
        [
          { text: t(lang, 'alert_cancel'), style: 'cancel' },
          {
            text: t(lang, 'history_delete_action'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteArchivedHistory();
                await loadHistory();
              } catch (e) {
                console.error(e);
                Alert.alert(t(lang, 'alert_error_title'), t(lang, 'history_failed_delete_archived'));
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        t(lang, 'history_delete_selected_title'),
        t(lang, 'history_delete_selected_body'),
        [
          { text: t(lang, 'alert_cancel'), style: 'cancel' },
          {
            text: t(lang, 'history_delete_action'),
            style: 'destructive',
            onPress: async () => {
              try {
                for (let id of selectedItems) {
                  await deleteArchivedHistory(id);
                }
                await loadHistory();
              } catch (e) {
                console.error(e);
                Alert.alert(t(lang, 'alert_error_title'), t(lang, 'history_failed_delete_selected_archived'));
              }
            }
          }
        ]
      );
    }
  };

  const handleLongPress = (item) => {
    toggleSelectItem(item);
  };

  const renderItem = ({ item }) => {
    const imageSource = typeof item.image === 'string' ? { uri: item.image } : item.image;
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const isSelected = selectedItems.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.historyCard,
          item.archived && styles.archivedCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => {
          if (selectedItems.length > 0) toggleSelectItem(item);
          else navigation.navigate('DetailsHistory', { item });
        }}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.historyCardContent}>
          <Image
            source={imageSource}
            style={styles.historyThumbnail}
            resizeMode="cover"
          />
          <View style={styles.historyDetails}>
            <View style={styles.historyHeader}>
              <Text style={[styles.diseaseText, { color: getDiseaseColor(item.disease) }]}>
                {item.disease} – {(item.confidence * 100).toFixed(0)}%
              </Text>
              {item.archived && <Ionicons name="archive" size={16} color="#8E8E93" />}
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="fish" size={14} color="#8E8E93" />
              <Text style={styles.infoText}>{item.type}</Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder={t(lang, 'history_search_placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterContainer}>
          {['all', 'healthy', 'diseased'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, selectedFilter === f && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(f)}
            >
              <Text style={[styles.filterButtonText, selectedFilter === f && styles.filterButtonTextActive]}>
                {f === 'all'
                  ? t(lang, 'history_filter_all')
                  : f === 'healthy'
                    ? t(lang, 'history_filter_healthy')
                    : t(lang, 'history_filter_diseased')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Archive Toggle & Action Buttons */}
        <View style={styles.archiveControls}>
          <TouchableOpacity
            style={[styles.archiveToggle, showArchived && styles.archiveToggleActive]}
            onPress={() => {
              setShowArchived(!showArchived);
              setSelectedItems([]);
            }}
          >
            <Ionicons name="archive" size={18} color={showArchived ? '#FFF' : '#007AFF'} />
            <Text style={[styles.archiveToggleText, showArchived && styles.archiveToggleTextActive]}>
              {showArchived ? t(lang, 'history_showing_archived') : t(lang, 'history_show_archived')}
            </Text>
          </TouchableOpacity>

          {showArchived ? (
            selectedItems.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteArchived}>
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  <Text style={styles.deleteText}>{t(lang, 'history_delete')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.archiveButton} onPress={handleUnarchiveSelected}>
                  <Ionicons name="archive-outline" size={18} color="#007AFF" />
                  <Text style={styles.archiveButtonText}>{t(lang, 'history_unarchive')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteArchived}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                <Text style={styles.deleteText}>{t(lang, 'history_delete_all_archived')}</Text>
              </TouchableOpacity>
            )
          ) : selectedItems.length > 0 ? (
            <TouchableOpacity
              style={styles.archiveButton}
              onPress={handleArchiveSelected}
            >
              <Ionicons name="archive-outline" size={18} color="#007AFF" />
              <Text style={styles.archiveButtonText}>{t(lang, 'history_archive')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <FlatList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.historyList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadHistory}
              tintColor="#007AFF"
              colors={['#007AFF']}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadHistory}
              tintColor="#007AFF"
              colors={['#007AFF']}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>
              {showArchived ? t(lang, 'history_empty_archived') : t(lang, 'history_empty')}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  historyList: { padding: 16 },
  historyCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  archivedCard: { opacity: 0.6 },
  selectedCard: { borderWidth: 2, borderColor: '#007AFF' },
  historyCardContent: { flexDirection: 'row' },
  historyThumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 16 },
  historyDetails: { flex: 1, justifyContent: 'center' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  diseaseText: { fontSize: 16, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  infoText: { fontSize: 13, color: '#8E8E93', marginLeft: 6 },
  dateText: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  searchContainer: { padding: 16, paddingBottom: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: '#000' },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F2F2F7' },
  filterButtonActive: { backgroundColor: '#007AFF' },
  filterButtonText: { color: '#000', fontWeight: '500' },
  filterButtonTextActive: { color: '#FFF' },
  archiveControls: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  archiveToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#007AFF' },
  archiveToggleActive: { backgroundColor: '#007AFF' },
  archiveToggleText: { marginLeft: 6, color: '#007AFF', fontWeight: '500' },
  archiveToggleTextActive: { color: '#FFF' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  deleteText: { marginLeft: 6, color: '#FF3B30', fontWeight: '500' },
  archiveButton: { flexDirection: 'row', alignItems: 'center' },
  archiveButtonText: { marginLeft: 6, color: '#007AFF', fontWeight: '500' },
  emptyScrollContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#8E8E93', marginTop: 16, textAlign: 'center' }
});
