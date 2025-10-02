import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Platform, StatusBar, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHistoryEntries } from '../utils/database';

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [historyData, setHistoryData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setRefreshing(true);
      const rows = await getHistoryEntries();
      // Map DB rows to UI shape
      const mapped = rows.map(r => ({
        id: String(r.id),
        date: r.createdAt,
        disease: r.className === 'Healthy-Fish' ? 'Healthy' : r.className,
        confidence: Number(r.confidence || 0),
        image: r.imageUri, // string uri
        type: r.scientificName || '—',
        location: '',
        notes: '',
      }));
      setHistoryData(mapped);
    } catch (e) {
      console.error('Failed to load history', e);
      setHistoryData([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Filter history based on search and filter
  const filteredHistory = historyData.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = item.disease.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q);
    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'healthy' && item.disease === 'Healthy') ||
      (selectedFilter === 'diseased' && item.disease !== 'Healthy');
    return matchesSearch && matchesFilter;
  });

  const getDiseaseColor = (disease) => {
    switch(disease) {
      case 'Healthy': return '#34C759';
      case 'Streptococcus': return '#FF3B30';
      case 'Columnaris': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const renderItem = ({ item }) => {
    // Check if the image is a local asset (object with uri) or a remote URL (string)
    const imageSource = typeof item.image === 'string' 
      ? { uri: item.image }
      : item.image;
    
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyCardContent}>
          <Image 
            source={imageSource}
            style={styles.historyThumbnail}
            resizeMode="cover"
            onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
          />
          <View style={styles.historyDetails}>
            <View style={styles.historyHeader}>
              <Text style={[styles.diseaseText, { color: getDiseaseColor(item.disease) }]}>
                {item.disease} – {(item.confidence * 100).toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="fish" size={14} color="#8E8E93" />
              <Text style={styles.infoText}>{item.type}</Text>
            </View>
            
            <Text style={styles.dateText}>
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search history..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterContainer}>
          {['all', 'healthy', 'diseased'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHistory} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={60} color="#D1D1D6" />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
  },
  diseaseText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  historyList: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  historyCardContent: {
    flexDirection: 'row',
  },
  historyThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  historyDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  diseaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 6,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#000000',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#000',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
});
