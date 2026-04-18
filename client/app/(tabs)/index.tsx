import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 1. SUPABASE CONNECTION
const supabaseUrl = 'https://jjyvsayedxfzmcsssbai.supabase.co';
const supabaseAnonKey = 'sb_publishable_Buro_BCxX3HJBrDRA3x4ag_1Cy5WEWL';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LuminaDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // 2. FETCH DATA (View Stats Task)
  const fetchAttendance = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('SUBJECTS')
        .select('*');
      
      if (error) throw error;
      if (data) setSubjects(data);
    } catch (error) {
      console.error("Fetch Error:", error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // 3. UPDATE ATTENDANCE (Button Marks Attendance Task)
  const handleAttendance = async (id, attended, total, isPresent) => {
    try {
      const { error } = await supabase
        .from('SUBJECTS')
        .update({
          attendedClasses: isPresent ? (attended || 0) + 1 : (attended || 0),
          totalClasses: (total || 0) + 1
        })
        .eq('id', id);

      if (error) throw error;
      fetchAttendance(); 
    } catch (error) {
      alert("Update failed. Make sure 'id' matches in Supabase!");
    }
  };

  const renderSubject = ({ item }) => {
    // Safety check to prevent "Something went wrong" (Division by Zero)
    const total = item.totalClasses || 0;
    const attended = item.attendedClasses || 0;
    const percentage = total > 0 ? (attended / total) : 0;
    const isSafe = percentage >= 0.75; 

    return (
      <View style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.subjectName}>{item.name || 'Untitled'}</Text>
            <Text style={styles.statSubtext}>{attended} / {total} Lectures</Text>
          </View>
          <View style={[styles.percentageBadge, { borderColor: item.color || '#6366f1' }]}>
            <Text style={[styles.percentageText, { color: item.color || '#6366f1' }]}>
              {Math.round(percentage * 100)}%
            </Text>
          </View>
        </View>

        {/* Neon Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBg} />
          <LinearGradient
            colors={[item.color || '#6366f1', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${percentage * 100}%` }]}
          />
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusIndicator, { backgroundColor: isSafe ? '#10b98120' : '#f43f5e20' }]}>
            <View style={[styles.dot, { backgroundColor: isSafe ? '#10b981' : '#f43f5e' }]} />
            <Text style={[styles.statusLabel, { color: isSafe ? '#10b981' : '#f43f5e' }]}>
              {isSafe ? 'On Track' : 'Danger Zone'}
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity 
              onPress={() => handleAttendance(item.id, item.attendedClasses, item.totalClasses, false)} 
              style={styles.controlBtn}>
              <Ionicons name="close-circle-outline" size={28} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleAttendance(item.id, item.attendedClasses, item.totalClasses, true)} 
              style={styles.controlBtn}>
              <Ionicons name="checkmark-circle" size={32} color={item.color || '#6366f1'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>INTELLIGENCE DASHBOARD</Text>
        <Text style={styles.mainTitle}>Lumina</Text>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={renderSubject}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAttendance} tintColor="#fff" />}
        ListEmptyComponent={<Text style={{color: '#fff', textAlign: 'center', marginTop: 20}}>No Subjects Found</Text>}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 70, marginBottom: 30 },
  greeting: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  mainTitle: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1, marginTop: 5 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  subjectName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statSubtext: { color: '#64748b', fontSize: 13, marginTop: 4 },
  percentageBadge: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  percentageText: { fontSize: 16, fontWeight: '800' },
  progressContainer: { height: 8, width: '100%', marginBottom: 25 },
  progressBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlBtn: { padding: 2 }
});