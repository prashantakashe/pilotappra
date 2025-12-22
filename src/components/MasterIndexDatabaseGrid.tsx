import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Keyboard, Modal, ActivityIndicator, Animated, Pressable } from 'react-native';
import { MaterialIcons, Feather, FontAwesome } from '@expo/vector-icons';
import { collection, onSnapshot, updateDoc, doc, addDoc, deleteDoc, getFirestore, query, orderBy, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { useNavigation } from '@react-navigation/native';
import AnalyticsModal from './AnalyticsModal';

// Firestore collection name
const PRICE_INDICES_COLLECTION = 'price_indices';

// Column definitions
const COLUMNS = [
  { key: 'period', label: 'PERIOD', width: 100, editable: true },
  { key: 'lBase', label: 'L (BASE)', width: 100, editable: true },
  { key: 'linkingFactor', label: 'LINKING FACTOR', width: 120, editable: true },
  { key: 'labourFinal', label: 'LABOUR (FINAL)', width: 120, calculated: true },
  { key: 'steel', label: 'STEEL (S)', width: 100, editable: true },
  { key: 'cement', label: 'CEMENT (C)', width: 110, editable: true },
  { key: 'material', label: 'MATERIAL (M)', width: 120, editable: true },
  { key: 'pol', label: 'POL (P)', width: 100, editable: true },
  { key: 'action', label: 'ACTION', width: 60, icon: true },
];

const db = getFirestore(getApp());

const MasterIndexDatabaseGrid = ({ hideTitle = false, showAddButton = false, projectId = null }) => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [editing, setEditing] = useState({}); // { [rowId_colKey]: true }
  const inputRefs = useRef({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Fetch and listen to Firestore data
  useEffect(() => {
    console.warn('🎯 MasterIndexDatabaseGrid mounted with projectId:', projectId);
    const q = query(collection(db, PRICE_INDICES_COLLECTION), orderBy('month', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const rows = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          period: docSnap.id, // Use document ID as period
          ...data 
        };
      });
      setData(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [projectId]);

  // Update Firestore on value change
  const handleValueChange = async (rowId, key, value) => {
    if (key === 'period') {
      // Period is document ID, handle separately
      return;
    }
    const rowDoc = doc(db, PRICE_INDICES_COLLECTION, rowId);
    await updateDoc(rowDoc, { [key]: parseFloat(value) || 0 });
  };

  // Add new entry
  const handleAddEntry = async () => {
    setAdding(true);
    try {
      // Generate next month
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const period = nextMonth.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g., "Jan-2026"
      
      await addDoc(collection(db, PRICE_INDICES_COLLECTION), {
        month: period,
        period: period,
        lBase: 0,
        linkingFactor: 0,
        steel: 0,
        cement: 0,
        material: 0,
        pol: 0,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Error adding entry:', error);
    } finally {
      setAdding(false);
    }
  };

  // Delete entry
  const handleDelete = async (rowId) => {
    try {
      await deleteDoc(doc(db, PRICE_INDICES_COLLECTION, rowId));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Handle Analytics Dashboard button press
  const handleOpenAnalytics = () => {
    console.warn('🔵 Analytics Modal button clicked! projectId:', projectId);
    
    // Scale animation for press effect
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Open modal directly
    setShowAnalyticsModal(true);
  };

  // Calculate Labour (Final)
  const calcLabourFinal = (lBase, linkingFactor) => {
    const n1 = parseFloat(lBase);
    const n2 = parseFloat(linkingFactor);
    if (isNaN(n1) || isNaN(n2)) return '';
    return (n1 * n2).toFixed(2);
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.headerRow}>
      {COLUMNS.map(col => (
        <View key={col.key} style={[styles.headerCell, { width: col.width }]}> 
          <Text style={styles.headerText}>{col.label}</Text>
        </View>
      ))}
    </View>
  );

  // Render each row
  const renderRow = ({ item, index }) => {
    const bgColor = index % 2 === 0 ? '#fff' : '#f8fafc';
    return (
      <View style={[styles.dataRow, { backgroundColor: bgColor }]}> 
        {COLUMNS.map(col => {
          if (col.key === 'docs') {
            return (
              <View key={col.key} style={[styles.cell, { width: col.width, alignItems: 'center' }]}> 
                <TouchableOpacity>
                  <Feather name="paperclip" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            );
          }
          if (col.key === 'action') {
            return (
              <View key={col.key} style={[styles.cell, { width: col.width, alignItems: 'center' }]}> 
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Feather name="more-horizontal" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            );
          }
          if (col.calculated) {
            // Calculate labour final = lBase * linkingFactor
            const calcValue = col.key === 'labourFinal' 
              ? (parseFloat(item.lBase || 0) * parseFloat(item.linkingFactor || 0)).toFixed(2)
              : item[col.key] || '0';
            return (
              <View key={col.key} style={[styles.cell, { width: col.width, backgroundColor: '#e0f2fe' }]}> 
                <Text style={[styles.value, { color: '#0f172a', fontWeight: 'bold' }]}> 
                  {calcValue}
                </Text>
              </View>
            );
          }
          if (col.editable) {
            const refKey = `${item.id}_${col.key}`;
            const isEditing = editing[refKey];
            return (
              <View key={col.key} style={[styles.cell, { width: col.width }]}> 
                {isEditing ? (
                  <TextInput
                    ref={ref => (inputRefs.current[refKey] = ref)}
                    style={styles.input}
                    value={item[col.key]?.toString() || ''}
                    keyboardType="numeric"
                    selectTextOnFocus
                    autoFocus
                    onBlur={e => {
                      setEditing({ ...editing, [refKey]: false });
                      handleValueChange(item.id, col.key, (e.target as any).value);
                    }}
                    onChangeText={text => {
                      setData(prev => prev.map(row => row.id === item.id ? { ...row, [col.key]: text } : row));
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setEditing({ ...editing, [refKey]: true })}
                    style={{ minHeight: 24, justifyContent: 'center' }}
                  >
                    <Text style={col.key === 'period' ? styles.period : styles.value}>
                      {item[col.key] || ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }
          // Default: read-only cell
          return (
            <View key={col.key} style={[styles.cell, { width: col.width }]}> 
              <Text style={col.key === 'period' ? styles.period : styles.value}>
                {item[col.key] || ''}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View>
      {!hideTitle && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, color: '#222', fontWeight: 'normal' }}>Master Index Database (2011 - 2025)</Text>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={handleOpenAnalytics}
                style={({ pressed }) => [
                  styles.analyticsButton,
                  {
                    backgroundColor: pressed ? '#1e40af' : '#2563eb',
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <FontAwesome name="area-chart" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 4 }}>Open Analytics Dashboard</Text>
              </Pressable>
            </Animated.View>
            <TouchableOpacity
              style={{ backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
              onPress={handleAddEntry}
              disabled={adding}
            >
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 6 }}>New Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {hideTitle && showAddButton && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 17, color: '#222', fontWeight: 'normal' }}>Master Index Database (2011 - 2025)</Text>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={handleOpenAnalytics}
                style={({ pressed }) => [
                  styles.analyticsButton,
                  {
                    backgroundColor: pressed ? '#1e40af' : '#2563eb',
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <FontAwesome name="area-chart" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Open Analytics Dashboard</Text>
              </Pressable>
            </Animated.View>
            <TouchableOpacity
              style={{ backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
              onPress={handleAddEntry}
              disabled={adding}
            >
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 6 }}>New Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <ScrollView horizontal style={{ width: '100%' }}>
        <View>
          {renderHeader()}
          {loading ? (
            <Text style={{ padding: 16, color: '#888' }}>Loading...</Text>
          ) : data.length === 0 ? (
            <Text style={{ padding: 16, color: '#888' }}>No data available. Click "New Entry" to add your first row.</Text>
          ) : (
            <View style={{ maxHeight: 500, minWidth: 1070 }}>
              <FlatList
                data={data}
                renderItem={renderRow}
                keyExtractor={item => item.id}
                initialNumToRender={15}
                getItemLayout={(_, idx) => ({ length: 48, offset: 48 * idx, index: idx })}
                style={{ minWidth: 1070 }}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Analytics Modal - Opens as overlay without navigation */}
      <AnalyticsModal 
        visible={showAnalyticsModal} 
        projectId={projectId || 'default'}
        onClose={() => setShowAnalyticsModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dataRow: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  period: {
    fontWeight: 'bold',
    color: '#334155',
    fontSize: 14,
  },
  value: {
    textAlign: 'right',
    color: '#222',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 4,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default MasterIndexDatabaseGrid;
