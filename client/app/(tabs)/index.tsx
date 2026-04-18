import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, ScrollView, StatusBar, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router'; // <--- 1. Import added

const BACKEND_IP = "10.10.62.123";
const PORT = "5000";
const API_URL = `http://${BACKEND_IP}:${PORT}/attendance`;

export default function WinningDashboard() {
  const router = useRouter(); // <--- 2. Router initialized
  const [subjects, setSubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      setSubjects([
        { id: '1', name: 'Applied Mathematics', present: 22, total: 27, color: '#6366f1' },
        { id: '2', name: 'Operating Systems', present: 18, total: 24, color: '#f43f5e' },
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAttendance();
  }, []);

  const markAttendance = async (id, isPresent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubjects(prev => prev.map(sub => {
      if (sub.id === id) {
        return { ...sub, present: isPresent ? sub.present + 1 : sub.present, total: sub.total + 1 };
      }
      return sub;
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
          <Text style={styles.welcomeText}>Lumina Intelligence</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Overall</Text>
            <Text style={styles.summaryValue}>82%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={[styles.summaryValue, {color: '#10b981'}]}>Safe ✅</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Course Analysis</Text>

        {subjects.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}><Ionicons name="book-outline" size={24} color={item.color} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.subjectName}>{item.name}</Text>
                <Text style={styles.ratioText}>{item.present} of {item.total} attended</Text>
              </View>
            </View>
            <View style={styles.actionGroup}>
               <TouchableOpacity onPress={() => markAttendance(item.id, true)} style={styles.circleBtn}>
                  <Ionicons name="add" size={24} color="#10b981" />
               </TouchableOpacity>
               <TouchableOpacity onPress={() => markAttendance(item.id, false)} style={styles.circleBtn}>
                  <Ionicons name="remove" size={24} color="#f43f5e" />
               </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 3. FAB ADDED AT THE BOTTOM OF SAFEAREAVIEW */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/add')} // This matches add.tsx
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 25 },
  dateText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  welcomeText: { color: '#0f172a', fontSize: 32, fontWeight: '800' },
  summaryCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, flexDirection: 'row', marginBottom: 30 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: '#94a3b8', fontSize: 12 },
  summaryValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  divider: { width: 1, backgroundColor: '#334155', marginHorizontal: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginBottom: 15 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  subjectName: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  ratioText: { color: '#64748b', fontSize: 14 },
  actionGroup: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'flex-end' },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  // 4. FAB STYLE ADDED
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#6366f1',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});