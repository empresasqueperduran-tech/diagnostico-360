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
      { id: 1, text: 'Conocimiento y Plan: ¿Cuenta la gerencia con conocimientos financieros sólidos y un plan presupuestario anual documentado?' },
      { id: 2, text: 'Rentabilidad Real: ¿El monitoreo del flujo de caja demuestra consistentemente que los ingresos superan a los gastos operativos y financieros?' },
      { id: 3, text: 'Reservas y Contingencia: ¿Existen indicadores claros que activen el uso de provisiones o reservas para garantizar la continuidad ante una crisis?' },
      { id: 4, text: 'Estrategia: ¿Existe una planificación estratégica financiera actualizada alineada con los objetivos de largo plazo?' }
    ]
  },
  {
    key: 'operaciones',
    label: 'Operaciones',
    icon: Settings,
    questions: [
      { id: 1, text: 'Cadena de Valor: ¿Es la cadena de valor eficiente y fluida desde la solicitud del cliente hasta la entrega final (sin cuellos de botella)?' },
      { id: 2, text: 'Infraestructura: ¿Las herramientas, equipos y espacios actuales soportarían un aumento del 30% en la demanda?' },
      { id: 3, text: 'Procesos Operativos: ¿Están documentados los procesos críticos de la operación (el "cómo se hace") para no depender de una sola persona?' },
      { id: 4, text: 'Medición: ¿Se cumplen los tiempos de entrega prometidos al cliente de forma consistente?' }
    ]
  },
  {
    key: 'riesgos',
    label: 'Riesgos',
    icon: ShieldAlert,
    questions: [
      { id: 1, text: 'Mapa de Riesgos: ¿Están identificados los riesgos que podrían detener el negocio mañana (legales, operativos, mercado)?' },
      { id: 2, text: 'Mitigación: ¿Se revisan estos riesgos periódicamente en comités formales?' },
      { id: 3, text: 'Legalidad: ¿La empresa cumple con toda la normativa legal/fiscal para evitar multas que afecten el patrimonio?' },
      { id: 4, text: 'Procesos de Riesgo: ¿Existen protocolos de actuación definidos en caso de que un riesgo se materialice?' }
    ]
  },
  {
    key: 'talento',
    label: 'Talento',
    icon: Users,
    questions: [
      { id: 1, text: 'Sucesión/Continuidad: ¿Existe un plan definido para la sucesión del liderazgo o para el cambio de accionistas (sea empresa familiar o no)?' },
      { id: 2, text: 'Clima Laboral: ¿Se ejecutan planes periódicos para medir el clima organizacional y la satisfacción del equipo?' },
      { id: 3, text: 'Competencias: ¿El personal clave ocupa su cargo por mérito y capacidad demostrada?' },
      { id: 4, text: 'Procesos de RRHH: ¿Están definidos los procesos de captación, evaluación y desarrollo del personal?' }
    ]
  },
  {
    key: 'mercadeo',
    label: 'Mercadeo',
    icon: Megaphone,
    questions: [
      { id: 1, text: 'Posicionamiento: ¿Está claramente definido el perfil del cliente ideal y el nicho de mercado?' },
      { id: 2, text: 'Efectividad: ¿Las acciones de mercadeo traen clientes nuevos de forma recurrente (no solo referidos)?' },
      { id: 3, text: 'ROI: ¿Se mide el retorno de la inversión de las campañas publicitarias?' },
      { id: 4, text: 'Procesos Comerciales: ¿Está definido y sistematizado el proceso de ventas y atención al cliente?' }
    ]
  },
  {
    key: 'gobernanza',
    label: 'Gobernanza',
    icon: Gavel,
    questions: [
      { id: 1, text: 'Junta Directiva: ¿Existe una Junta Directiva (o Comité de Dirección) activa y actualizada que analice el negocio periódicamente?' },
      { id: 2, text: 'Toma de Decisiones: ¿Las decisiones estratégicas se toman en la Junta basándose en análisis de datos, no solo en la intuición?' },
      { id: 3, text: 'Roles de Socios: ¿Están claramente definidas y separadas las funciones de los socios de las funciones de los empleados/ejecutivos?' },
      { id: 4, text: 'Reglas de Juego: ¿Existen acuerdos formales (Protocolo Familiar o Acuerdo de Accionistas) que regulen la relación futura entre los dueños?' }
    ]
  },
  {
    key: 'tecnologia',
    label: 'Tecnología',
    icon: Cpu,
    questions: [
      { id: 1, text: 'Herramientas: ¿El software y hardware actual facilita el trabajo o lo entorpece?' },
      { id: 2, text: 'Datos: ¿La tecnología permite obtener datos confiables para la toma de decisiones en tiempo real?' },
      { id: 3, text: 'Seguridad: ¿Está protegida la información crítica del negocio (backups, ciberseguridad)?' },
      { id: 4, text: 'Procesos TI: ¿Se utiliza la tecnología para automatizar tareas manuales repetitivas?' }
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