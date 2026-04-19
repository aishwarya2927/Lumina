import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ActivityIndicator, TextInput, Alert } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const supabase = createClient('https://jjyvsayedxfzmcsssbai.supabase.co', 'sb_publishable_Buro_BCxX3HJBrDRA3x4ag_1Cy5WEWL');

export default function LuminaDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gmailCount, setGmailCount] = useState(0);
  const [latestAlert, setLatestAlert] = useState("No recent alerts");
  
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '742306666500-8dhk6vodj5tei50kkankpvb7947r0g9k.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    extraParams: { prompt: 'select_account' }, 
  });

  useEffect(() => {
    fetchAttendance();
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      setUserInfo(authentication);
      fetchRealGmailData(authentication.accessToken);
    }
  }, [response]);

  // --- DATABASE FUNCTIONS ---

  const fetchAttendance = async () => {
    setRefreshing(true);
    const { data } = await supabase.from('SUBJECTS').select('*').order('name', { ascending: true });
    if (data) setSubjects(data);
    setRefreshing(false);
  };

  const fetchExpenses = async () => {
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (data) setExpenses(data);
  };

  const deleteSubject = async (id) => {
    const { error } = await supabase.from('SUBJECTS').delete().eq('id', id);
    if (!error) fetchAttendance();
    else Alert.alert("Error", "Could not delete subject");
  };

  const handleUpdate = async (id, att, tot, pres) => {
    const newAtt = pres ? (att || 0) + 1 : (att || 0);
    const newTot = (tot || 0) + 1;
    await supabase.from('SUBJECTS').update({ attendedClasses: newAtt, totalClasses: newTot }).eq('id', id);
    fetchAttendance();
  };

  const addNewSubject = async () => {
    if (!newSubjectName.trim()) return;
    await supabase.from('SUBJECTS').insert([{ name: newSubjectName, attendedClasses: 0, totalClasses: 0 }]);
    setNewSubjectName('');
    setShowAddSubjectModal(false);
    fetchAttendance();
  };

  const addExpense = async () => {
    if (!expenseName || !expenseAmount) {
      Alert.alert("Error", "Please fill both fields");
      return;
    }

    // 1. SYMBOL MAPPING ENGINE
    const symbolMap = {
      'vada': '🍔', 'pav': '🍔', 'samosa': '🥟', 'tea': '☕', 'chai': '☕',
      'coffee': '☕', 'auto': '🛺', 'train': '🚆', 'bus': '🚌', 'pen': '🖊️',
      'xerox': '📄', 'print': '🖨️', 'canteen': '🍽️', 'juice': '🥤'
    };

    const lowercaseName = expenseName.toLowerCase();
    const detectedSymbol = Object.keys(symbolMap).find(key => lowercaseName.includes(key));
    const finalNameWithSymbol = detectedSymbol 
      ? `${symbolMap[detectedSymbol]} ${expenseName}` 
      : `💰 ${expenseName}`;

    // 2. SAVE TO SUPABASE (Using lowercase 'expenses')
    const { error } = await supabase
      .from('expenses')
      .insert([{ 
        item_name: finalNameWithSymbol, 
        amount: parseInt(expenseAmount) 
      }]);

    if (error) {
      Alert.alert("Database Error", error.message);
    } else {
      setExpenseName('');
      setExpenseAmount('');
      setShowExpenseModal(false);
      fetchExpenses(); 
    }
  };

  const fetchRealGmailData = async (token) => {
    setIsSyncing(true);
    try {
      const query = "is:unread newer_than:1d (assignment OR exam OR spit)";
      const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listData = await listRes.json();
      setGmailCount(listData.resultSizeEstimate || 0);
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  };

  // --- CALCULATIONS ---
  const totalSpend = expenses.reduce((sum, item) => sum + item.amount, 0);
  const stressScore = Math.min((subjects.length * 4) + (gmailCount * 10), 100);
  const stressColor = stressScore < 40 ? '#10b981' : stressScore < 75 ? '#fbbf24' : '#f43f5e';

  // --- RENDER HELPERS ---

  const renderSubject = ({ item }) => {
    const total = item.totalClasses || 0;
    const attended = item.attendedClasses || 0;
    const displayPercentage = total > 0 ? Math.min(attended / total, 1) : 0;
    const isSafe = displayPercentage >= 0.75;
    const canBunk = isSafe ? Math.max(0, Math.floor((attended / 0.75) - total)) : 0;
    const mustAttend = !isSafe ? Math.max(0, Math.ceil((0.75 * total - attended) / 0.25)) : 0;

    return (
      <View style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.subjectName}>{item.name}</Text>
            <Text style={styles.lecturesText}>{attended}/{total} Lectures</Text>
          </View>
          <View style={[styles.percBadge, { borderColor: isSafe ? '#10b981' : '#f43f5e' }]}>
            <Text style={[styles.percText, { color: isSafe ? '#10b981' : '#f43f5e' }]}>{Math.round(displayPercentage * 100)}%</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${displayPercentage * 100}%`, backgroundColor: isSafe ? '#6366f1' : '#f43f5e' }]} />
        </View>
        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.statusTag, { color: isSafe ? '#10b981' : '#f43f5e' }]}>{isSafe ? '• STABLE' : '• ACTION REQUIRED'}</Text>
            <Text style={styles.bunkText}>{isSafe ? `Safe to bunk: ${canBunk}` : `Attend next: ${mustAttend}`}</Text>
          </View>
          
          <View style={styles.controls}>
             <TouchableOpacity onPress={() => deleteSubject(item.id)} style={{marginRight: 15}}>
                <Ionicons name="trash-outline" size={22} color="#f43f5e" />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => handleUpdate(item.id, attended, total, false)}>
                <Ionicons name="close-circle-outline" size={32} color="#94a3b8" />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => handleUpdate(item.id, attended, total, true)}>
                <Ionicons name="checkmark-circle" size={36} color="#6366f1" />
             </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <FlatList 
        data={subjects} 
        renderItem={renderSubject} 
        keyExtractor={(item) => item.id.toString()} 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {fetchAttendance(); fetchExpenses();}} tintColor="#fff" />}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.greeting}>INTELLIGENCE DASHBOARD</Text>
                <Text style={styles.mainTitle}>Lumina</Text>
              </View>
              <TouchableOpacity style={[styles.googleBtn, userInfo && { borderColor: '#10b981' }]} onPress={() => { setUserInfo(null); promptAsync(); }}>
                {isSyncing ? <ActivityIndicator size="small" color="#10b981" /> : <Ionicons name="logo-google" size={20} color={userInfo ? "#10b981" : "#fff"} />}
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.stressBox}>
                <Text style={styles.statsLabel}>SYSTEM STRESS</Text>
                <View style={styles.meterBg}><View style={[styles.meterFill, { width: `${stressScore}%`, backgroundColor: stressColor }]} /></View>
                <Text style={[styles.stressStatus, { color: stressColor }]}>{stressScore < 40 ? 'OPTIMAL' : stressScore < 75 ? 'LOADED' : 'CRITICAL'}</Text>
              </View>
              <View style={styles.miniHeatmap}>
                  <Text style={styles.statsLabel}>ACTIVITY VELOCITY</Text>
                  <View style={styles.heatmapRow}>
                      {[...Array(12)].map((_, i) => <View key={i} style={[styles.heatSquare, { backgroundColor: userInfo ? '#10b981' : '#6366f1', opacity: 0.4 }]} />)}
                  </View>
              </View>
            </View>

            <View style={styles.expenseSummary}>
                <Text style={styles.statsLabel}>WEEKLY STUDENT WRAP</Text>
                <Text style={styles.totalSpend}>₹{totalSpend}</Text>
                
                <View style={{ marginTop: 10, marginBottom: 5 }}>
                  {expenses.slice(0, 3).map((item, index) => (
                    <Text key={index} style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
                      {item.item_name} — ₹{item.amount}
                    </Text>
                  ))}
                </View>

                <TouchableOpacity onPress={() => setShowExpenseModal(true)} style={styles.miniLogBtn}>
                    <Ionicons name="receipt-outline" size={14} color="#6366f1" />
                    <Text style={styles.miniLogText}>Log Expense</Text>
                </TouchableOpacity>
            </View>

            <View style={{flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 10}}>
                {userInfo && (
                <TouchableOpacity style={styles.syncBadge} onPress={() => setShowIntelligenceModal(true)}>
                    <Text style={styles.syncText}>• {gmailCount} ALERTS LIVE</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddSubjectModal(true)}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addBtnText}>Subject</Text>
                </TouchableOpacity>
            </View>
          </View>
        }
      />

      {/* MODALS */}
      <Modal transparent visible={showIntelligenceModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Intelligence Report</Text>
            <Text style={styles.infoLabel}>Unread stressors detected in last 24h: <Text style={{color: '#10b981'}}>{gmailCount}</Text></Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIntelligenceModal(false)}><Text style={styles.closeBtnText}>DISMISS</Text></TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <Modal transparent visible={showAddSubjectModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalBox}>
            <Text style={styles.modalTitle}>New Subject</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#64748b" value={newSubjectName} onChangeText={setNewSubjectName} />
            <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddSubjectModal(false)}><Text style={{color: '#fff'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={addNewSubject}><Text style={{color: '#fff', fontWeight: 'bold'}}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showExpenseModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalBox}>
            <Text style={styles.modalTitle}>Log Expense</Text>
            <TextInput style={styles.input} placeholder="Item" placeholderTextColor="#64748b" value={expenseName} onChangeText={setExpenseName} />
            <TextInput style={[styles.input, {marginTop: 10}]} placeholder="Amount" placeholderTextColor="#64748b" keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} />
            <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowExpenseModal(false)}><Text style={{color: '#fff'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={addExpense}><Text style={{color: '#fff', fontWeight: 'bold'}}>Log It</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { marginTop: 60, marginBottom: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  mainTitle: { color: '#fff', fontSize: 36, fontWeight: '900' },
  googleBtn: { width: 45, height: 45, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  statsContainer: { flexDirection: 'row', gap: 12 },
  stressBox: { flex: 1.5, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  miniHeatmap: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statsLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', marginBottom: 10 },
  meterBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 },
  meterFill: { height: '100%', borderRadius: 2 },
  stressStatus: { fontSize: 14, fontWeight: '900', marginTop: 10, color: '#fff' },
  heatmapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  heatSquare: { width: 10, height: 10, borderRadius: 2 },
  expenseSummary: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, marginTop: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  totalSpend: { color: '#fff', fontSize: 28, fontWeight: '900', marginVertical: 5 },
  miniLogBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  miniLogText: { color: '#6366f1', fontSize: 10, fontWeight: '800' },
  syncBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  syncText: { color: '#10b981', fontSize: 9, fontWeight: '900' },
  addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addBtnText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  addModalBox: { width: '80%', backgroundColor: '#1e293b', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 15 },
  infoLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { flex: 1, backgroundColor: '#6366f1', padding: 15, borderRadius: 15, alignItems: 'center' },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 15, alignItems: 'center' },
  closeBtn: { marginTop: 30, backgroundColor: '#6366f1', padding: 15, borderRadius: 15, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '800' },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  subjectName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  lecturesText: { color: '#64748b', fontSize: 12, marginTop: 4 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, marginTop: 15 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTag: { fontSize: 10, fontWeight: '800' },
  bunkText: { color: '#64748b', fontSize: 10, fontWeight: '600', marginTop: 2 },
  percBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  percText: { fontSize: 12, fontWeight: '800' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }
});