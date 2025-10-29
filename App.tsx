
import React, { useState, useCallback } from 'react';
import { AnalysisResult as AnalysisResultType } from './types';
import { analyzeText } from './services/geminiService';
import AnalysisResult from './components/AnalysisResult';
import Loader from './components/Loader';

const App: React.FC = () => {
  const exampleText = "Son yıllarda yapay zekâ teknolojileri hızla gelişmektedir. Bu durum, eğitim alanında kişiselleştirilmiş öğrenme olanaklarını artırmıştır. Ancak bazı öğretmenler, bu teknolojilerin öğrencilerde bağımlılık oluşturabileceğinden endişe duymaktadır.";
  const [inputText, setInputText] = useState<string>(exampleText);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async () => {
    if (!inputText.trim()) {
      setError("Lütfen analiz edilecek bir metin girin.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeText(inputText);
      setAnalysisResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Bilinmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 p-1 rounded-lg">
             <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-slate-900 px-4 py-2 rounded-md">
                Türkçe Metin Analiz Asistanı
             </h1>
          </div>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Metinlerinizi yapay zeka ile analiz edin: Özetleyin, temel fikirleri çıkarın, duygu tonunu belirleyin ve yeniden yazın.
          </p>
        </header>

        <main>
          <div className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700">
            <label htmlFor="text-input" className="block text-lg font-medium text-slate-300 mb-2">
              Analiz Edilecek Metin
            </label>
            <textarea
              id="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Buraya analiz etmek istediğiniz metni yapıştırın..."
              className="w-full h-48 p-4 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 resize-none"
              disabled={isLoading}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAnalysis}
                disabled={isLoading || !inputText.trim()}
                className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? <Loader /> : 'Analiz Et'}
                {isLoading && <span className="ml-2">Analiz Ediliyor...</span>}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              <strong>Hata:</strong> {error}
            </div>
          )}

          {analysisResult && <AnalysisResult result={analysisResult} />}
        </main>
        
        <footer className="text-center mt-12 text-slate-500 text-sm">
            <p>Yapay Zeka Destekli Metin Analizi | Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
