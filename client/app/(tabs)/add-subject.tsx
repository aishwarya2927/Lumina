import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// 1. CONNECTION
const supabase = createClient('https://jjyvsayedxfzmcsssbai.supabase.co', 'sb_publishable_Buro_BCxX3HJBrDRA3x4ag_1Cy5WEWL');

export default function AddSubject() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 2. INSERT LOGIC
  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a subject name");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('SUBJECTS')
        .insert([
          { 
            name: name, 
            attendedClasses: 0, 
            totalClasses: 0, 
            color: '#8b5cf6' // Default purple color
          }
        ]);

      if (error) throw error;

      Alert.alert("Success", "Subject added to Lumina!");
      setName('');
      router.push('/'); // Navigate back to Dashboard
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>New Intelligence</Text>
        <Text style={styles.subtitle}>Enter the name of the subject you want to track.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Computer Networks"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>INITIALIZE SUBJECT</Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30 },
  content: { width: '100%' },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 10 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 40, lineHeight: 24 },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  input: { height: 60, color: '#fff', fontSize: 18 },
  button: {
    backgroundColor: '#6366f1',
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});