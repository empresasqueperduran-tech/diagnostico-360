import React from 'react';
import { ChartDataPoint } from '../types';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

interface AnalysisSectionProps {
  data: ChartDataPoint[];
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ data }) => {
  // Sort by gap (descending) to find biggest weaknesses
  const sortedByGap = [...data].sort((a, b) => (b.ideal - b.actual) - (a.ideal - a.actual));
  const criticalAreas = sortedByGap.slice(0, 2);
  const strongestAreas = [...data].sort((a, b) => (b.actual) - (a.actual)).slice(0, 1);

  const getGapColor = (gap: number) => {
    if (gap > 2.5) return 'text-red-600 font-bold';
    if (gap > 1.0) return 'text-yellow-600 font-medium';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Critical Analysis Card */}
      <div className="bg-white rounded-xl p-5 border border-red-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
          <AlertTriangle className="text-red-500" size={20} />
          Áreas Críticas de Atención
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Basado en su diagnóstico, las siguientes dimensiones presentan la mayor brecha respecto a una empresa institucionalizada y requieren intervención prioritaria:
        </p>
        <div className="space-y-3">
          {criticalAreas.map((item) => (
            <div key={item.subject} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
              <div>
                <span className="font-bold text-gray-800">{item.subject}</span>
                <span className="text-gray-600 text-sm ml-2">
                   (Brecha: {(item.ideal - item.actual).toFixed(1)})
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Se recomienda implementar un plan de acción inmediato para fortalecer los controles y procesos en esta área.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Tabla de Brechas (Gap Analysis)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3">Dimensión</th>
                <th className="px-4 py-3 text-center">Actual</th>
                <th className="px-4 py-3 text-center">Meta</th>
                <th className="px-4 py-3 text-center">Brecha</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => {
                const gap = row.ideal - row.actual;
                return (
                  <tr key={row.subject} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.subject}</td>
                    <td className="px-4 py-3 text-center text-blue-700 font-semibold">{row.actual.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center text-gray-400">5.0</td>
                    <td className={`px-4 py-3 text-center ${getGapColor(gap)}`}>-{gap.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${gap > 2.5 ? 'bg-red-100 text-red-700' : 
                          gap > 1.0 ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-green-100 text-green-700'}`}>
                        {gap > 2.5 ? 'Crítico' : gap > 1.0 ? 'Mejorable' : 'Sólido'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
       {/* Strength Highlight */}
       {strongestAreas.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-bold text-green-800 text-sm">Fortaleza Principal</h4>
            <p className="text-green-700 text-xs mt-1">
              Su desempeño más alto es en <span className="font-bold">{strongestAreas[0].subject}</span> ({strongestAreas[0].actual.toFixed(1)}). Utilice esta fortaleza como palanca para mejorar las áreas más débiles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};