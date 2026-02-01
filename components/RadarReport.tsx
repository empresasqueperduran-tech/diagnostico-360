import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartDataPoint } from '../types';

interface RadarReportProps {
  data: ChartDataPoint[];
}

export const RadarReport: React.FC<RadarReportProps> = ({ data }) => {
  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 5]} 
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Resultado Actual"
            dataKey="actual"
            stroke="#1e40af" // blue-800
            strokeWidth={2}
            fill="#3b82f6" // blue-500
            fillOpacity={0.4}
            isAnimationActive={true}
          />
          <Radar
            name="Benchmark Ideal"
            dataKey="ideal"
            stroke="#94a3b8" // slate-400
            strokeDasharray="4 4"
            fill="transparent"
            fillOpacity={0}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-gray-600 font-medium text-sm ml-1">{value}</span>}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};