import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { randomUUID } from 'crypto';

const app = express();
const PORT = Number(process.env.PORT || 5000);

// In-memory store for analyses (development only)
const analyses = new Map<string, any>();

app.use(cors());
app.use(express.json());

// Simple request logger to help debugging incoming requests
app.use((req, _res, next) => {
  try {
    const bodyPreview = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '';
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${bodyPreview}`);
  } catch (e) {
    console.log('[HTTP] request logging error', e);
  }
  next();
});

// Sağlık kontrolü
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// GET: list analyses or return one by id
app.get('/api/analyze', (req, res) => {
  const id = req.query.id as string | undefined;
  if (id) {
    const item = analyses.get(id);
    if (!item) {
      return res.status(404).json({ message: `Analysis with id ${id} not found.` });
    }
    return res.json(item);
  }

  // Return brief list of stored analyses
  const list = Array.from(analyses.values()).map((a: any) => ({ id: a.id, timestamp: a.timestamp }));
  return res.json({ analyses: list });
});

app.post('/api/analyze', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Internal Server Error: API key not configured.' });
    }
    const { text } = req.body as { text?: string };
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ message: '"text" field is required and cannot be empty.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        ozet: { type: Type.STRING, description: 'Metnin 2-3 cümlelik kısa ve anlamlı bir özeti.' },
        temelFikirler: { type: Type.ARRAY, description: 'Metindeki en önemli 3-5 ana fikri listeleyen maddeler.', items: { type: Type.STRING } },
        duyguTonu: { type: Type.STRING, description: "Metnin genel duygu tonu. Sadece 'Olumlu', 'Olumsuz' veya 'Nötr' kelimelerinden birini kullan." },
        yenidenYazilmisMetin: { type: Type.STRING, description: 'Metnin dilbilgisi ve anlam bütünlüğü korunarak daha akıcı ve akademik bir Türkçe ile yeniden yazılmış hali.' },
      },
      required: ['ozet', 'temelFikirler', 'duyguTonu', 'yenidenYazilmisMetin'],
    } as const;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Lütfen aşağıdaki Türkçe metni analiz et. Metni özetle, temel fikirleri maddeler halinde belirt, genel duygu tonunu değerlendir ve metni daha akıcı bir Türkçeyle yeniden yaz. \n\nMETİN:\n"""\n${text}\n"""`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    // Build a 201 Created response with an id and Location header
    try {
  const analysisId = randomUUID();
  const parsed = JSON.parse(response.text);
  const fullResponse = { id: analysisId, timestamp: new Date().toISOString(), analysis: parsed };
  // store in-memory for GET access during development
  analyses.set(analysisId, fullResponse);
  res.setHeader('Location', `/api/analyze?id=${analysisId}`);
  res.status(201).json(fullResponse);
    } catch (e) {
      // Fallback: if parsing fails, just send raw response with 200
      console.error('Failed to parse AI response or set 201:', e);
      res.type('application/json').send(response.text);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to analyze text.', error: message });
  }
});

// Prod'da Vite çıktısını serve et
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// PUT: update an existing analysis by id
app.put('/api/analyze', async (req, res) => {
  try {
    const { id, text } = req.body as { id?: string; text?: string };
    if (!id) return res.status(400).json({ message: '"id" field is required.' });
    if (!analyses.has(id)) return res.status(404).json({ message: `Analysis with id ${id} not found.` });
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ message: '"text" field is required and cannot be empty.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Internal Server Error: API key not configured.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        ozet: { type: Type.STRING },
        temelFikirler: { type: Type.ARRAY, items: { type: Type.STRING } },
        duyguTonu: { type: Type.STRING },
        yenidenYazilmisMetin: { type: Type.STRING },
      },
      required: ['ozet', 'temelFikirler', 'duyguTonu', 'yenidenYazilmisMetin'],
    } as const;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Lütfen aşağıdaki Türkçe metni analiz et. Metni özetle, temel fikirleri maddeler halinde belirt, genel duygu tonunu değerlendir ve metni daha akıcı bir Türkçeyle yeniden yaz. \n\nMETİN:\n"""\n${text}\n"""`,
      config: { responseMimeType: 'application/json', responseSchema: analysisSchema },
    });

    const parsed = JSON.parse(response.text);
    const updated = { id, timestamp: new Date().toISOString(), analysis: parsed };
    analyses.set(id, updated);
    return res.status(200).json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to update analysis.', error: message });
  }
});

// DELETE: remove an analysis by id (supports query parameter or JSON body)
app.delete('/api/analyze', (req, res) => {
  try {
    const id = (req.query.id as string) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ message: '"id" parameter or body field is required.' });
    if (!analyses.has(id)) return res.status(404).json({ message: `Analysis with id ${id} not found.` });

  analyses.delete(id);
  // 204 No Content is appropriate for successful DELETE when no body is returned
  return res.sendStatus(204);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to delete analysis.', error: message });
  }
});