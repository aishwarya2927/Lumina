import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type ParsedSlot = {
  day: string;
  time: string;
  subject: string;
  room?: string;
};

type ParsedTimetable = {
  slots: ParsedSlot[];
  rawText: string;
};

const GEMINI_KEY   = process.env.EXPO_PUBLIC_GEMINI_KEY ?? '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const MODEL_NAME = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

const TIMETABLE_PROMPT = `You are a timetable parser. Extract every class slot from this timetable image.

CRITICAL: Return ONLY a raw JSON object. No markdown. No backticks. No \`\`\`json. No explanation. Just the JSON itself starting with { and ending with }.

Use this exact format:
{
  "slots": [
    {
      "day": "Monday",
      "time": "09:00-10:00",
      "subject": "Mathematics",
      "room": "Room 101"
    }
  ],
  "rawText": ""
}

Rules:
- "day" must be a full day name (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
- "time" must be in HH:MM-HH:MM format
- "room" is optional, omit if not visible
- Skip empty cells and breaks
- Return empty slots array if nothing found
- DO NOT wrap response in markdown code blocks`;

async function parseWithGemini(base64: string): Promise<ParsedTimetable> {
  if (!GEMINI_KEY) {
    throw new Error('Gemini API key is missing. Add EXPO_PUBLIC_GEMINI_KEY to your .env file.');
  }

  const response = await fetch(`${API_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: TIMETABLE_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 16000,
      },
    }),
  });

  console.log('>>> Gemini status:', response.status);

  if (response.status === 429) throw new Error('RATE_LIMIT');

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  
console.log('>>> rawText length:', rawText.length);
console.log('>>> first 100 chars:', rawText.substring(0, 100));

  if (!rawText) throw new Error('Gemini returned an empty response. Please try again.');

 const cleaned = rawText
  .replace(/```json/gi, '')
  .replace(/```/g, '')
  .trim();

// ADD THIS:
console.log('>>> cleaned:', cleaned);

try {
  const parsed = JSON.parse(cleaned) as ParsedTimetable;
  // ADD THIS:
  console.log('>>> slots count:', parsed.slots?.length);
  return { slots: parsed.slots ?? [], rawText: parsed.rawText ?? rawText };
} catch (err) {
  // ADD THIS:
  console.log('>>> JSON parse error:', err);
  return { slots: [], rawText: cleaned };
}
}

export default function TimetableOCRScreen() {
  const [imageUri, setImageUri]             = useState<string | null>(null);
  const [imageBase64, setImageBase64]       = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [timetable, setTimetable]           = useState<ParsedTimetable | null>(null);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);

  const rateLimited = rateLimitUntil !== null && Date.now() < rateLimitUntil;

  const resetImage = () => {
    setImageUri(null);
    setImageBase64(null);
    setTimetable(null);
    setRateLimitUntil(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload your timetable.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      resetImage();
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      resetImage();
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const parseTimetable = async () => {
    console.log('>>> parseTimetable called'); // ADD THIS
    if (!imageUri || !imageBase64 || loading || rateLimited) return;
    setLoading(true);
    try {
      const result = await parseWithGemini(imageBase64);
      if (result.slots.length === 0) {
        Alert.alert('No slots found', 'Try a clearer, well-lit photo of your timetable.');
      }
      setTimetable(result);
    } catch (e: any) {
      if (e.message === 'RATE_LIMIT') {
        const unlockTime = Date.now() + 60000;
        setRateLimitUntil(unlockTime);
        setTimeout(() => setRateLimitUntil(null), 60000);
        Alert.alert('⏳ Rate Limited', 'Wait 60 seconds then try again.');
      } else {
        Alert.alert('Parse failed', e.message ?? 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToSupabase = async () => {
    if (!timetable?.slots.length) return;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      Alert.alert('Missing config', 'Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/timetable_slots`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(timetable.slots),
      });
      if (!res.ok) throw new Error(await res.text());
      Alert.alert('✅ Saved!', `${timetable.slots.length} slots saved to Supabase.`);
      resetImage();
    } catch (e: any) {
      Alert.alert('Save failed', e.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const byDay = timetable?.slots.reduce<Record<string, ParsedSlot[]>>((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {}) ?? {};

  const days = Object.keys(byDay);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.label}>INTELLIGENCE DASHBOARD</Text>
      <Text style={s.title}>Timetable</Text>
      <Text style={s.subtitle}>Photo your timetable — Gemini parses it instantly</Text>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={s.preview} resizeMode="contain" />
      )}

      <View style={s.row}>
        <TouchableOpacity style={s.btnSecondary} onPress={pickImage}>
          <Text style={s.btnSecondaryText}>📁 Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={openCamera}>
          <Text style={s.btnSecondaryText}>📷 Camera</Text>
        </TouchableOpacity>
      </View>

      {imageUri && !loading && (
        <TouchableOpacity
          style={[s.btnPrimary, rateLimited && s.btnDisabled]}
          onPress={parseTimetable}
          disabled={rateLimited || loading}
        >
          <Text style={s.btnPrimaryText}>
            {rateLimited ? '⏳ Rate limited — wait 60s' : 'Parse with Gemini Vision'}
          </Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={s.loaderBox}>
          <ActivityIndicator color="#7c6fef" size="large" />
          <Text style={s.loaderText}>Gemini is reading your timetable...</Text>
        </View>
      )}

      {days.map(day => (
        <View key={day} style={s.dayBlock}>
          <Text style={s.dayTitle}>{day}</Text>
          {byDay[day]
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((slot, i) => (
              <View key={i} style={s.slotCard}>
                <View style={s.slotLeft}>
                  <Text style={s.slotTime}>{slot.time}</Text>
                  {slot.room && <Text style={s.slotRoom}>{slot.room}</Text>}
                </View>
                <Text style={s.slotSubject}>{slot.subject}</Text>
              </View>
            ))}
        </View>
      ))}

      {timetable && timetable.slots.length > 0 && (
        <TouchableOpacity
          style={[s.btnSave, saving && { opacity: 0.6 }]}
          onPress={saveToSupabase}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#3dd68c" />
            : <Text style={s.btnSaveText}>Save {timetable.slots.length} slots to Supabase</Text>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#0d1117' },
  content:          { padding: 20, paddingBottom: 60 },
  label:            { fontSize: 10, letterSpacing: 3, color: '#7a8199', marginBottom: 4 },
  title:            { fontSize: 38, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle:         { fontSize: 13, color: '#7a8199', marginBottom: 24, lineHeight: 20 },
  preview:          { width: '100%', height: 200, borderRadius: 14, marginBottom: 14, backgroundColor: '#161b25', borderWidth: 1, borderColor: '#252d3d' },
  row:              { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btnSecondary:     { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#252d3d', backgroundColor: '#161b25', alignItems: 'center' },
  btnSecondaryText: { color: '#a89ff5', fontSize: 13, fontWeight: '700' },
  btnPrimary:       { backgroundColor: '#7c6fef', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 24 },
  btnPrimaryText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled:      { backgroundColor: '#2a2a3a' },
  loaderBox:        { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loaderText:       { color: '#7a8199', fontSize: 13 },
  dayBlock:         { marginBottom: 20 },
  dayTitle:         { fontSize: 11, letterSpacing: 2.5, color: '#7a8199', textTransform: 'uppercase', marginBottom: 8, fontWeight: '700' },
  slotCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b25', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#7c6fef', borderWidth: 1, borderColor: '#252d3d' },
  slotLeft:         { marginRight: 14, minWidth: 80 },
  slotTime:         { color: '#a89ff5', fontSize: 12, fontWeight: '700' },
  slotRoom:         { color: '#7a8199', fontSize: 11, marginTop: 2 },
  slotSubject:      { flex: 1, color: '#e8eaf0', fontSize: 14, fontWeight: '700' },
  btnSave:          { backgroundColor: '#0f4a30', borderWidth: 1, borderColor: '#3dd68c', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnSaveText:      { color: '#3dd68c', fontSize: 14, fontWeight: '800' },
});