// IMPORTANT: This file is intended to be deployed as a serverless function
// in the /api directory of your project (e.g., on Vercel or Netlify).
// It creates an API endpoint at /api/analyze.
// This code WILL NOT RUN in the current browser-based development environment.

import { GoogleGenAI, Type } from "@google/genai";

// This is a placeholder for a generic serverless function handler.
// The exact signature (e.g., req, res) might change based on your hosting provider.
// This example uses the standard Request and Response objects.
export default async function handler(req: Request): Promise<Response> {
    // Handle different HTTP methods
    switch (req.method) {
        case 'GET':
            return handleGet(req);
        case 'POST':
            return handlePost(req);
        case 'PUT':
            return handlePut(req);
        case 'DELETE':
            return handleDelete(req);
        default:
            return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json', 'Allow': 'GET, POST, PUT, DELETE' },
            });
    }
}

// GET: Retrieve analysis history or specific analysis by ID
async function handleGet(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
        // Return a specific analysis (mock data for example)
        return new Response(JSON.stringify({
            id,
            timestamp: new Date().toISOString(),
            analysis: {
                ozet: "Örnek özet",
                temelFikirler: ["Fikir 1", "Fikir 2"],
                duyguTonu: "Nötr",
                yenidenYazilmisMetin: "Örnek metin"
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Return list of analyses (mock data for example)
    return new Response(JSON.stringify({
        analyses: [
            { id: "1", timestamp: new Date().toISOString() },
            { id: "2", timestamp: new Date().toISOString() }
        ]
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

// POST: Create new analysis
async function handlePost(req: Request): Promise<Response> {

    // Check for API key on the server
    if (!process.env.GEMINI_API_KEY) {
        console.error("API_KEY environment variable not set on the server.");
        return new Response(JSON.stringify({ message: 'Internal Server Error: API key not configured.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { text } = await req.json();

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return new Response(JSON.stringify({ message: '"text" field is required and cannot be empty.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const analysisSchema = {
            type: Type.OBJECT,
            properties: {
                ozet: { type: Type.STRING, description: "Metnin 2-3 cümlelik kısa ve anlamlı bir özeti." },
                temelFikirler: { type: Type.ARRAY, description: "Metindeki en önemli 3-5 ana fikri listeleyen maddeler.", items: { type: Type.STRING } },
                duyguTonu: { type: Type.STRING, description: "Metnin genel duygu tonu. Sadece 'Olumlu', 'Olumsuz' veya 'Nötr' kelimelerinden birini kullan." },
                yenidenYazilmisMetin: { type: Type.STRING, description: "Metnin dilbilgisi ve anlam bütünlüğü korunarak daha akıcı ve akademik bir Türkçe ile yeniden yazılmış hali." },
            },
            required: ["ozet", "temelFikirler", "duyguTonu", "yenidenYazilmisMetin"],
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Lütfen aşağıdaki Türkçe metni analiz et. Metni özetle, temel fikirleri maddeler halinde belirt, genel duygu tonunu değerlendir ve metni daha akıcı bir Türkçeyle yeniden yaz. \n\nMETİN:\n"""\n${text}\n"""`,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });
        
        const analysisId = crypto.randomUUID(); // Generate a unique ID for the analysis
        const parsedResponse = JSON.parse(response.text);
        const fullResponse = {
            id: analysisId,
            timestamp: new Date().toISOString(),
            analysis: parsedResponse
        };
        
        // Return 201 Created with the Location header and full response
        return new Response(JSON.stringify(fullResponse), {
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Location': `/api/analyze?id=${analysisId}` // Add Location header pointing to the new resource
            },
        });

    } catch (error) {
        console.error("API Error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return new Response(JSON.stringify({ message: 'Failed to analyze text.', error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// PUT: Update existing analysis
async function handlePut(req: Request): Promise<Response> {
    try {
        const { id, text } = await req.json();

        if (!id) {
            return new Response(JSON.stringify({ message: '"id" field is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return new Response(JSON.stringify({ message: '"text" field is required and cannot be empty.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Update logic would go here (mock response for example)
        return new Response(JSON.stringify({
            id,
            message: 'Analysis updated successfully',
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("API Error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return new Response(JSON.stringify({ message: 'Failed to update analysis.', error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// DELETE: Remove an analysis
async function handleDelete(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ message: '"id" parameter is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Delete logic would go here (mock response for example)
    return new Response(JSON.stringify({
        message: `Analysis with id ${id} deleted successfully`,
        timestamp: new Date().toISOString()
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
