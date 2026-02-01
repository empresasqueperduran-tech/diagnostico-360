import { 
  Banknote, 
  Settings, 
  ShieldAlert, 
  Users, 
  Megaphone, 
  Gavel, 
  Cpu 
} from 'lucide-react';
import { DimensionDef, ScoresState, DimensionKey } from './types';

export const DIMENSIONS: DimensionDef[] = [
  {
    key: 'finanzas',
    label: 'Finanzas',
    icon: Banknote,
    questions: [
      { id: 1, text: '¿Existe un plan financiero documentado y actualizado?' },
      { id: 2, text: '¿Se monitorea el flujo de caja en tiempo real?' },
      { id: 3, text: '¿La rentabilidad es consistente y predecible?' },
      { id: 4, text: '¿Existen reservas para contingencias?' }
    ]
  },
  {
    key: 'operaciones',
    label: 'Operaciones',
    icon: Settings,
    questions: [
      { id: 1, text: '¿Los procesos críticos están estandarizados?' },
      { id: 2, text: '¿Se mide la eficiencia operativa con KPIs claros?' },
      { id: 3, text: '¿La cadena de suministro es resiliente?' },
      { id: 4, text: '¿Existe control de calidad sistemático?' }
    ]
  },
  {
    key: 'riesgos',
    label: 'Riesgos',
    icon: ShieldAlert,
    questions: [
      { id: 1, text: '¿Existe un mapa de riesgos actualizado?' },
      { id: 2, text: '¿Hay planes de continuidad de negocio?' },
      { id: 3, text: '¿Se gestionan los riesgos legales y regulatorios?' },
      { id: 4, text: '¿La ciberseguridad es una prioridad activa?' }
    ]
  },
  {
    key: 'talento',
    label: 'Talento',
    icon: Users,
    questions: [
      { id: 1, text: '¿Hay un plan de sucesión definido?' },
      { id: 2, text: '¿La rotación de personal clave es baja?' },
      { id: 3, text: '¿Existe un sistema de evaluación de desempeño?' },
      { id: 4, text: '¿Se invierte en capacitación continua?' }
    ]
  },
  {
    key: 'mercadeo',
    label: 'Mercadeo',
    icon: Megaphone,
    questions: [
      { id: 1, text: '¿La propuesta de valor es clara y diferenciada?' },
      { id: 2, text: '¿Existe una estrategia digital efectiva?' },
      { id: 3, text: '¿Se mide la satisfacción del cliente (NPS)?' },
      { id: 4, text: '¿La marca tiene reconocimiento en el mercado?' }
    ]
  },
  {
    key: 'gobernanza',
    label: 'Gobernanza',
    icon: Gavel,
    questions: [
      { id: 1, text: '¿Existe una Junta Directiva activa?' },
      { id: 2, text: '¿Las decisiones se basan en datos, no intuición?' },
      { id: 3, text: '¿Hay transparencia en la información a socios?' },
      { id: 4, text: '¿Están definidos los protocolos familiares/societarios?' }
    ]
  },
  {
    key: 'tecnologia',
    label: 'Tecnología',
    icon: Cpu,
    questions: [
      { id: 1, text: '¿Los sistemas están integrados (ERP/CRM)?' },
      { id: 2, text: '¿Se aprovechan los datos para la toma de decisiones?' },
      { id: 3, text: '¿La infraestructura tecnológica es escalable?' },
      { id: 4, text: '¿Existe innovación tecnológica constante?' }
    ]
  }
];

// Initial mock data simulating an "average" company (approx 2.5 - 3.5)
export const INITIAL_SCORES: ScoresState = {
  finanzas: [3, 2, 4, 3],
  operaciones: [4, 3, 3, 3],
  riesgos: [2, 1, 2, 2], // Low score example
  talento: [3, 4, 3, 3],
  mercadeo: [2, 2, 3, 2], // Low score example
  gobernanza: [3, 2, 2, 3],
  tecnologia: [4, 4, 3, 4]
};