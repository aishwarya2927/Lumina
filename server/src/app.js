const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Timetable OCR route ──────────────────────────────────────────────────
app.post('/api/parse-timetable', async (req, res) => {
  const { base64, mimeType } = req.body;

  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'base64 and mimeType are required' });
  }

  try {
    const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
              {
                text: `You are a timetable parser for an engineering college student.
Extract every class slot from this timetable image.
Return ONLY valid JSON - no markdown, no backticks, no explanation.
Format:
{
  "slots": [
    { "day": "Monday", "time": "9:00-10:00", "subject": "Operating System", "room": "LH1" }
  ]
}
If room is not visible, omit the room field.
If you cannot parse the image, return { "slots": [], "error": "reason" }.`,
              },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json({ slots: parsed.slots ?? [] });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;