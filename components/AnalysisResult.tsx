
import React from 'react';
import { AnalysisResult as AnalysisResultType } from '../types';
import { SummaryIcon, KeyIdeasIcon, SentimentIcon, RewriteIcon } from './icons';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const getSentimentColor = (sentiment: string) => {
    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('olumlu')) return 'text-green-400';
    if (lowerSentiment.includes('olumsuz')) return 'text-red-400';
    return 'text-yellow-400';
  };
  
  const ResultCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-slate-800/50 rounded-lg p-6 backdrop-blur-sm border border-slate-700">
      <div className="flex items-center mb-4">
        <div className="text-cyan-400 mr-3">{icon}</div>
        <h3 className="text-xl font-bold text-cyan-400">{title}</h3>
      </div>
      <div className="text-slate-300 space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <ResultCard title="Özet" icon={<SummaryIcon />}>
        <p>{result.ozet}</p>
      </ResultCard>

      <ResultCard title="Temel Fikirler" icon={<KeyIdeasIcon />}>
        <ul className="list-disc list-inside space-y-2">
          {result.temelFikirler.map((idea, index) => (
            <li key={index}>{idea}</li>
          ))}
        </ul>
      </ResultCard>

      <ResultCard title="Duygu Tonu" icon={<SentimentIcon />}>
        <p className={`font-semibold text-lg ${getSentimentColor(result.duyguTonu)}`}>
          {result.duyguTonu}
        </p>
      </ResultCard>

      <ResultCard title="Yeniden Yazılmış Metin" icon={<RewriteIcon />}>
        <p className="italic">{result.yenidenYazilmisMetin}</p>
      </ResultCard>
    </div>
  );
};

export default AnalysisResult;
