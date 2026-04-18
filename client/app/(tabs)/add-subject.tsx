import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function AddSubject() {
  const router = useRouter();
  const [subjectName, setSubjectName] = useState('');
  const [minAttendance, setMinAttendance] = useState('75');

  const handleCreate = () => {
    if (subjectName.trim() === '') return;
    
    // Pro touch: Success vibration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    console.log(`Created: ${subjectName} with goal ${minAttendance}%`);
    
    // For now, we just go back to the dashboard
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <Text style={styles.title}>New Course</Text>
        <Text style={styles.subtitle}>Fill in the details to start tracking.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>COURSE NAME</Text>
          <TextInput 
            style={styles.input}
            placeholder="e.g. Data Structures"
            placeholderTextColor="#94a3b8"
            value={subjectName}
            onChangeText={setSubjectName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MINIMUM ATTENDANCE GOAL (%)</Text>
          <TextInput 
            style={styles.input}
            keyboardType="numeric"
            value={minAttendance}
            onChangeText={setMinAttendance}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
          <Text style={styles.submitBtnText}>Create Subject</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 40 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 10 },
  input: { 
    backgroundColor: '#f8fafc', 
    padding: 18, 
    borderRadius: 16, 
    fontSize: 16, 
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  submitBtn: { 
    backgroundColor: '#1e293b', 
    padding: 20, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10,
    marginTop: 20,
    elevation: 8,
    shadowColor: '#1e293b',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});