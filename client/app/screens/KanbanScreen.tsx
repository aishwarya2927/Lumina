import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'doing' | 'want_to_do';
  created_at: string;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export default function KanbanScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'doing' | 'want_to_do'>('want_to_do');
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/kanban_tasks?order=created_at.desc`,
        { headers }
      );
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/kanban_tasks`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ 
            title: title.trim(), 
            description: description.trim(), 
            status 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error(">>> Supabase Error:", data);
        throw new Error(data.message || "Failed to add task");
      }
      
      setTasks(prev => [data[0], ...prev]);
      setTitle('');
      setDescription('');
      setStatus('want_to_do');
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const moveTask = async (task: Task) => {
    const newStatus = task.status === 'doing' ? 'want_to_do' : 'doing';
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/kanban_tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: newStatus }),
      });
      if(!res.ok) throw new Error();
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch {
      Alert.alert('Error', 'Failed to move task');
    }
  };

  const deleteTask = async (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/kanban_tasks?id=eq.${id}`, {
              method: 'DELETE',
              headers,
            });
            if(!res.ok) throw new Error();
            setTasks(prev => prev.filter(t => t.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete task');
          }
        }
      }
    ]);
  };

  const doing = tasks.filter(t => t.status === 'doing');
  const wantToDo = tasks.filter(t => t.status === 'want_to_do');

  const TaskCard = ({ task }: { task: Task }) => (
    <View style={[s.card, task.status === 'doing' && s.cardDoing]}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>{task.title}</Text>
        <TouchableOpacity onPress={() => deleteTask(task.id)}>
          <Text style={s.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>
      {task.description ? <Text style={s.cardDesc}>{task.description}</Text> : null}
      <TouchableOpacity
        style={[s.moveBtn, task.status === 'doing' ? s.moveBtnBack : s.moveBtnForward]}
        onPress={() => moveTask(task)}
      >
        <Text style={[s.moveBtnText, task.status === 'doing' ? s.moveBtnTextBack : s.moveBtnTextForward]}>
          {task.status === 'doing' ? '← Move to Want To Do' : 'Move to Doing →'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#7c6fef" size="large" />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>INTELLIGENCE DASHBOARD</Text>
        <Text style={s.title}>Kanban</Text>
        <Text style={s.subtitle}>Track what you're doing and what's next</Text>

        <View style={s.column}>
          <View style={s.columnHeader}>
            <View style={[s.dot, { backgroundColor: '#7c6fef' }]} />
            <Text style={s.columnTitle}>DOING</Text>
            <Text style={s.columnCount}>{doing.length}</Text>
          </View>
          {doing.length === 0 ? (
            <Text style={s.emptyText}>No tasks in progress</Text>
          ) : (
            doing.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </View>

        <View style={s.column}>
          <View style={s.columnHeader}>
            <View style={[s.dot, { backgroundColor: '#3dd68c' }]} />
            <Text style={s.columnTitle}>WANT TO DO</Text>
            <Text style={s.columnCount}>{wantToDo.length}</Text>
          </View>
          {wantToDo.length === 0 ? (
            <Text style={s.emptyText}>No pending tasks</Text>
          ) : (
            wantToDo.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)}>
        <Text style={s.fabText}>+ Add Task</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>New Task</Text>
            <TextInput style={s.input} placeholder="Task title *" placeholderTextColor="#7a8199" value={title} onChangeText={setTitle} />
            <TextInput style={[s.input, s.inputMulti]} placeholder="Description (optional)" placeholderTextColor="#7a8199" value={description} onChangeText={setDescription} multiline numberOfLines={3} />

            <Text style={s.inputLabel}>Add to column:</Text>
            <View style={s.statusRow}>
              <TouchableOpacity style={[s.statusBtn, status === 'want_to_do' && s.statusBtnActive]} onPress={() => setStatus('want_to_do')}>
                <Text style={[s.statusBtnText, status === 'want_to_do' && s.statusBtnTextActive]}>Want To Do</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.statusBtn, status === 'doing' && s.statusBtnActivePurple]} onPress={() => setStatus('doing')}>
                <Text style={[s.statusBtnText, status === 'doing' && s.statusBtnTextActive]}>Doing</Text>
              </TouchableOpacity>
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={addTask} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Add Task</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d1117' },
  centered: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 10, letterSpacing: 3, color: '#7a8199', marginBottom: 4 },
  title: { fontSize: 38, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#7a8199', marginBottom: 24, lineHeight: 20 },
  column: { marginBottom: 28 },
  columnHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  columnTitle: { fontSize: 11, letterSpacing: 2.5, color: '#7a8199', fontWeight: '700', flex: 1 },
  columnCount: { fontSize: 12, color: '#7a8199', backgroundColor: '#161b25', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  emptyText: { color: '#7a8199', fontSize: 13, fontStyle: 'italic', paddingLeft: 4 },
  card: { backgroundColor: '#161b25', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#252d3d', borderLeftWidth: 3, borderLeftColor: '#3dd68c' },
  cardDoing: { borderLeftColor: '#7c6fef' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { color: '#e8eaf0', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  cardDesc: { color: '#7a8199', fontSize: 13, marginBottom: 10, lineHeight: 18 },
  deleteBtn: { color: '#7a8199', fontSize: 16, padding: 2 },
  moveBtn: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  moveBtnForward: { borderColor: '#7c6fef', backgroundColor: 'rgba(124,111,239,0.1)' },
  moveBtnBack: { borderColor: '#252d3d', backgroundColor: 'transparent' },
  moveBtnText: { fontSize: 11, fontWeight: '700' },
  moveBtnTextForward: { color: '#a89ff5' },
  moveBtnTextBack: { color: '#7a8199' },
  fab: { position: 'absolute', bottom: 24, right: 20, left: 20, backgroundColor: '#7c6fef', borderRadius: 14, padding: 16, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#161b25', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: '#252d3d' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 16 },
  input: { backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#252d3d', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 12 },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  inputLabel: { color: '#7a8199', fontSize: 12, marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statusBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#252d3d', alignItems: 'center' },
  statusBtnActive: { borderColor: '#3dd68c', backgroundColor: 'rgba(61,214,140,0.1)' },
  statusBtnActivePurple:{ borderColor: '#7c6fef', backgroundColor: 'rgba(124,111,239,0.1)' },
  statusBtnText: { color: '#7a8199', fontSize: 13, fontWeight: '700' },
  statusBtnTextActive: { color: '#fff' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#252d3d', alignItems: 'center' },
  cancelBtnText: { color: '#7a8199', fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#7c6fef', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});