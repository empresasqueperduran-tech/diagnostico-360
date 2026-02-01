import React from 'react';

export type DimensionKey = 
  | 'finanzas' 
  | 'operaciones' 
  | 'riesgos' 
  | 'talento' 
  | 'mercadeo' 
  | 'gobernanza' 
  | 'tecnologia';

export interface SubQuestion {
  id: number;
  text: string;
}

export interface DimensionDef {
  key: DimensionKey;
  label: string;
  icon: React.ComponentType<any>;
  questions: SubQuestion[];
}

export type ScoresState = Record<DimensionKey, number[]>;

export interface ChartDataPoint {
  subject: string;
  actual: number;
  ideal: number;
  fullMark: number;
}

export interface LeadFormData {
  nombre: string;
  empresa: string;
  website: string;
  email: string;
  celular: string;
}