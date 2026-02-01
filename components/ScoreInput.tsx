import React from 'react';
import { DimensionDef, ScoresState, DimensionKey } from '../types';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ScoreInputProps {
  dimension: DimensionDef;
  scores: number[];
  onChange: (dimKey: DimensionKey, index: number, value: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({ 
  dimension, 
  scores, 
  onChange, 
  isOpen, 
  onToggle 
}) => {
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Color coding based on score
  const getScoreColor = (score: number) => {
    if (score < 2) return 'text-red-600 bg-red-50 border-red-200';
    if (score < 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-white"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            <dimension.icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{dimension.label}</h3>
            <p className="text-xs text-gray-500">
              {isOpen ? 'Evalúe los 4 indicadores clave' : `${dimension.questions.length} indicadores`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full border text-sm font-bold ${getScoreColor(average)}`}>
            {average.toFixed(1)} / 5.0
          </div>
          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="bg-gray-50 p-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {dimension.questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <div className="flex justify-between text-sm text-gray-700">
                <label htmlFor={`q-${dimension.key}-${idx}`} className="flex-1 mr-4">{q.text}</label>
                <span className="font-medium w-6 text-right">{scores[idx]}</span>
              </div>
              <input
                id={`q-${dimension.key}-${idx}`}
                type="range"
                min="0"
                max="5"
                step="1"
                value={scores[idx]}
                onChange={(e) => onChange(dimension.key, idx, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 px-1">
                <span>Crítico (0)</span>
                <span>Excelente (5)</span>
              </div>
            </div>
          ))}
          <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-xs rounded flex items-start gap-2">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>El puntaje de la dimensión se calcula automáticamente promediando estos 4 factores.</p>
          </div>
        </div>
      )}
    </div>
  );
};