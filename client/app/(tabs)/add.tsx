import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';

export default function AddScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const saveCourse = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/subjects`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), present: 0, total: 0 }),
        }
      );

      if (response.ok) {
        alert('Course added successfully!');
        setName('');
        router.back();
      } else {
        alert('Failed to add course. Try again.');
      }
    } catch (error) {
      alert('Backend not connected. Check the server!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>Add Course</Text>

      <TextInput
        style={s.input}
        placeholder="Course name"
        placeholderTextColor="#7a8199"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={saveCourse}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>Save Course</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d1117',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#161b25',
    borderWidth: 1,
    borderColor: '#252d3d',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: '#7c6fef',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});