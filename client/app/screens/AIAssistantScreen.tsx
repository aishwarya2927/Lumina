import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';

const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Lumina, an AI study assistant for engineering students. 
You help with subjects like Operating Systems, Computer Networks (CCN), 
Design and Analysis of Algorithms (DAA), Python Data Structures (PDS), 
Mobile Development (MDM), and general engineering topics.
Keep answers concise, clear and student-friendly. Use examples where helpful.`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_QUESTIONS = [
  'Explain Deadlock in OS',
  'What is TCP vs UDP?',
  'Explain Dynamic Programming',
  'What is process scheduling?',
  'Explain OSI model layers',
];

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Lumina AI 🎓 Ask me anything about your engineering subjects — OS, CCN, DAA, PDS, MDM or any topic!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const question = text ?? input.trim();
    if (!question || loading) return;

    const userMessage: Message = { role: 'user', content: question };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error('API failed');

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not answer that. Try again!';

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      // Fallback responses
      const fallback = getFallback(question);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const getFallback = (q: string): string => {
    const query = q.toLowerCase();
    if (query.includes('deadlock'))
      return 'Deadlock occurs when processes are waiting for resources held by each other. Four conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Prevention: Break any one condition.';
    if (query.includes('tcp') || query.includes('udp'))
      return 'TCP is connection-oriented, reliable, ordered delivery. UDP is connectionless, faster, no guarantee. Use TCP for web/email, UDP for video/gaming.';
    if (query.includes('dynamic programming') || query.includes('dp'))
      return 'Dynamic Programming solves problems by breaking into subproblems and storing results (memoization). Examples: Fibonacci, Knapsack, LCS. Key: Optimal substructure + Overlapping subproblems.';
    if (query.includes('os') || query.includes('operating system'))
      return 'OS manages hardware resources, provides process management, memory management, file systems, and I/O handling. Examples: Windows, Linux, macOS.';
    if (query.includes('osi'))
      return 'OSI has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. Remember: Please Do Not Throw Sausage Pizza Away.';
    if (query.includes('scheduling'))
      return 'CPU Scheduling algorithms: FCFS (simple, convoy effect), SJF (optimal avg wait), Round Robin (time quantum, fair), Priority (starvation possible).';
    if (query.includes('ccn') || query.includes('network'))
      return 'Computer Networks: devices communicate via protocols. Key concepts: IP addressing, routing, TCP/IP stack, DNS, HTTP, subnetting.';
    if (query.includes('algorithm') || query.includes('daa'))
      return 'DAA covers sorting (QuickSort O(nlogn)), searching, graph algorithms (Dijkstra, BFS, DFS), greedy methods, divide & conquer, and NP-completeness.';
    return "Great question! This is a core engineering concept. Break it down into fundamentals, understand the theory, then practice with examples. Check your textbook's relevant chapter for detailed coverage.";
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.label}>INTELLIGENCE DASHBOARD</Text>
        <Text style={s.title}>AI Assistant</Text>
        <Text style={s.subtitle}>Ask anything about your engineering subjects</Text>
      </View>

      {/* Quick Questions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.quickScroll}
        contentContainerStyle={s.quickContainer}
      >
        {QUICK_QUESTIONS.map((q, i) => (
          <TouchableOpacity
            key={i}
            style={s.quickBtn}
            onPress={() => sendMessage(q)}
          >
            <Text style={s.quickBtnText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={s.messages}
        contentContainerStyle={s.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              s.bubble,
              msg.role === 'user' ? s.userBubble : s.aiBubble
            ]}
          >
            {msg.role === 'assistant' && (
              <Text style={s.aiLabel}>🎓 Lumina AI</Text>
            )}
            <Text style={[
              s.bubbleText,
              msg.role === 'user' ? s.userText : s.aiText
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={s.aiBubble}>
            <Text style={s.aiLabel}>🎓 Lumina AI</Text>
            <ActivityIndicator color="#7c6fef" size="small" />
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Ask about OS, CCN, DAA, PDS..."
          placeholderTextColor="#7a8199"
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Text style={s.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#0d1117' },
  header:           { padding: 20, paddingBottom: 8 },
  label:            { fontSize: 10, letterSpacing: 3, color: '#7a8199', marginBottom: 4 },
  title:            { fontSize: 38, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle:         { fontSize: 13, color: '#7a8199', lineHeight: 20 },
  quickScroll:      { maxHeight: 50, marginBottom: 8 },
  quickContainer:   { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  quickBtn:         { backgroundColor: '#161b25', borderWidth: 1, borderColor: '#7c6fef', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  quickBtnText:     { color: '#a89ff5', fontSize: 12, fontWeight: '600' },
  messages:         { flex: 1, paddingHorizontal: 16 },
  messagesContent:  { paddingVertical: 8, gap: 12 },
  bubble:           { maxWidth: '85%', borderRadius: 16, padding: 12 },
  userBubble:       { backgroundColor: '#7c6fef', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble:         { backgroundColor: '#161b25', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#252d3d' },
  aiLabel:          { color: '#7c6fef', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bubbleText:       { fontSize: 14, lineHeight: 20 },
  userText:         { color: '#fff' },
  aiText:           { color: '#e8eaf0' },
  inputRow:         { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#252d3d', alignItems: 'flex-end' },
  input:            { flex: 1, backgroundColor: '#161b25', borderWidth: 1, borderColor: '#252d3d', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, maxHeight: 100 },
  sendBtn:          { backgroundColor: '#7c6fef', borderRadius: 12, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled:  { opacity: 0.4 },
  sendBtnText:      { color: '#fff', fontSize: 18 },
});