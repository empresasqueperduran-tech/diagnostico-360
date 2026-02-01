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
    label: 'Finanzas (Solidez)',
    icon: Banknote,
    questions: [
      { id: 1, text: 'Conocimiento y Plan: ¿Existen conocimientos financieros en la gerencia y un plan financiero documentado y actualizado?' },
      { id: 2, text: 'Estrategia de Flujo: ¿Se cuenta con la identificación de las estrategias a seguir según el monitoreo del flujo de caja en tiempo real (ingresos vs. gastos)?' },
      { id: 3, text: 'Reservas: ¿Se cuenta con indicadores claros que permitan, en caso de contingencia, activar el uso de provisiones o reservas para la continuidad del negocio?' },
      { id: 4, text: 'Estrategia Global: ¿Se cuenta con la correspondiente planificación estratégica de la empresa actualizada?' }
    ]
  },
  {
    key: 'operaciones',
    label: 'Operaciones (Eficiencia)',
    icon: Settings,
    questions: [
      { id: 1, text: 'Cadena de Valor: ¿La cadena de valor es eficiente desde su inicio hasta su culminación?' },
      { id: 2, text: 'Procesos Críticos: ¿Se cuenta con los procesos críticos del área de operaciones definidos y documentados?' },
      { id: 3, text: 'Infraestructura: ¿La infraestructura actual permite cumplir los tiempos y resultados prometidos sin colapsar ante un aumento de demanda?' },
      { id: 4, text: 'Sistematización: ¿Los procesos operativos funcionan sin depender exclusivamente del "saber hacer" de una sola persona?' }
    ]
  },
  {
    key: 'riesgos',
    label: 'Riesgos (Blindaje)',
    icon: ShieldAlert,
    questions: [
      { id: 1, text: 'Categorización: ¿Se tienen identificados y categorizados los riesgos (Estratégicos, Operativos, Financieros)?' },
      { id: 2, text: 'Mitigación: ¿Se cuenta con estrategias definidas para la mitigación de los riesgos detectados?' },
      { id: 3, text: 'Seguimiento: ¿Se realizan seguimientos periódicos a los riesgos mediante comités?' },
      { id: 4, text: 'Origen: ¿Se conoce con detalle el origen de los riesgos que afectan la operación?' }
    ]
  },
  {
    key: 'talento',
    label: 'Talento (Cultura y Sucesión)',
    icon: Users,
    questions: [
      { id: 1, text: 'Sucesión/Continuidad: ¿En caso de ser empresa familiar existe un plan de sucesión definido, o en caso de no serlo, un plan para el cambio de accionistas/liderazgo?' },
      { id: 2, text: 'Clima Laboral: ¿La empresa ejecuta planes de medición del clima laboral?' },
      { id: 3, text: 'Procesos de RRHH: ¿Se cuenta con los procesos críticos de Talento Humano definidos (selección, evaluación, capacitación)?' },
      { id: 4, text: 'Competencias: ¿Se realizan evaluaciones de competencias y planes de cierre de brechas para el personal clave?' }
    ]
  },
  {
    key: 'mercadeo',
    label: 'Mercadeo (Posicionamiento)',
    icon: Megaphone,
    questions: [
      { id: 1, text: 'Efectividad: ¿El mercadeo está siendo efectivo y se utilizan los canales correctos?' },
      { id: 2, text: 'Procesos de Mercadeo: ¿Se cuenta con los procesos críticos de Mercadeo definidos?' },
      { id: 3, text: 'Segmentación: ¿Se tienen identificados los nichos de mercado y los clientes están segmentados?' },
      { id: 4, text: 'Captación: ¿El cliente nuevo es captado generalmente por las acciones de mercadeo (no solo por referidos)?' }
    ]
  },
  {
    key: 'gobernanza',
    label: 'Gobernanza (Institucionalización)',
    icon: Gavel,
    questions: [
      { id: 1, text: 'Junta Directiva: ¿Existe una Junta Directiva activa y actualizada?' },
      { id: 2, text: 'Decisiones con Datos: ¿La toma de decisiones se realiza mediante el análisis del negocio en la Junta Directiva (y no por intuición)?' },
      { id: 3, text: 'Roles de Socios: ¿Están definidas las funciones y áreas de cada uno de los socios dentro de la empresa?' },
      { id: 4, text: 'Reglas del Juego (Protocolo): ¿Existen reglas escritas y acordadas (un Protocolo o Acuerdo) que definan claramente cómo entran los familiares a trabajar, remuneración y resolución de conflictos?' }
    ]
  },
  {
    key: 'tecnologia',
    label: 'Tecnología (Transformación)',
    icon: Cpu,
    questions: [
      { id: 1, text: 'Herramientas: ¿La empresa cuenta con las herramientas y equipos tecnológicos requeridos?' },
      { id: 2, text: 'Procesos TI: ¿Se cuenta con los procesos críticos tecnológicos definidos?' },
      { id: 3, text: 'Calidad de Data: ¿La data generada es útil y se cuenta con sistemas de información seguros?' },
      { id: 4, text: 'Automatización: ¿Se han automatizado procesos manuales mediante la tecnología?' }
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