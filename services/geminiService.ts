import { AnalysisResult } from '../types';

export async function analyzeText(text: string): Promise<AnalysisResult> {
    try {
        // This now calls our own backend API endpoint instead of the Gemini SDK directly.
        // The backend endpoint will be running as a serverless function.
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            // Try to parse the error message from the API response
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `API isteği durumu: ${response.status}`;
            throw new Error(errorMessage);
        }

        const result: AnalysisResult = await response.json();
        return result;

    } catch (error) {
        console.error("API call error:", error);
        if (error instanceof Error) {
            // Prepend a user-friendly message to the technical error.
            throw new Error(`Metin analizi sırasında bir hata oluştu: ${error.message}`);
        }
        throw new Error("Metin analizi sırasında bilinmeyen bir ağ hatası oluştu.");
    }
}
