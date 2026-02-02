import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DIMENSIONS, INITIAL_SCORES } from './constants';
import { ScoreInput } from './components/ScoreInput';
import { RadarReport } from './components/RadarReport';
import { AnalysisSection } from './components/AnalysisSection';
import { LeadFormModal } from './components/LeadFormModal';
import { ScoresState, DimensionKey, ChartDataPoint, LeadFormData } from './types';
import { LayoutDashboard, FileText, Sparkles, CheckCircle, Info, PlayCircle, Loader2, UserCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';
import { GoogleGenAI } from "@google/genai";

type ViewState = 'welcome' | 'assessment' | 'success';

const App: React.FC = () => {
  // --- ESTADOS DE VISTA Y NAVEGACIÓN ---
  const [currentView, setCurrentView] = useState<ViewState>('welcome');
  
  // Estado de puntajes
  const [scores, setScores] = useState<ScoresState>(INITIAL_SCORES);
  
  // Cambiado a null para que todas inicien cerradas por defecto
  const [openSection, setOpenSection] = useState<DimensionKey | null>(null);
  
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Estados para la post-generación (Contacto Consultor)
  const [lastFormData, setLastFormData] = useState<LeadFormData | null>(null);
  const [isContacting, setIsContacting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  
  // Referencia para capturar el gráfico
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('App loaded v4.0 Fixed EmailJS Config');
    if (!process.env.API_KEY) {
      console.warn("ADVERTENCIA: API_KEY no detectada.");
    }
  }, []);

  const handleScoreChange = (dimKey: DimensionKey, index: number, value: number) => {
    setScores(prev => ({
      ...prev,
      [dimKey]: prev[dimKey].map((s, i) => i === index ? value : s)
    }));
  };

  const toggleSection = (key: DimensionKey) => {
    setOpenSection(openSection === key ? null : key);
  };

  // Cálculos de datos
  const reportData: ChartDataPoint[] = useMemo(() => {
    return DIMENSIONS.map(dim => {
      const dimScores = scores[dim.key];
      const average = dimScores.reduce((a, b) => a + b, 0) / dimScores.length;
      return {
        subject: dim.label,
        actual: parseFloat(average.toFixed(1)),
        ideal: 5.0,
        fullMark: 5
      };
    });
  }, [scores]);

  const overallScore = reportData.reduce((acc, curr) => acc + curr.actual, 0) / reportData.length;

  // --- LÓGICA DE IA ---
  const generateAIAnalysis = async (formData: LeadFormData, data: ChartDataPoint[]) => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return "Análisis no disponible (Falta API Key).";

      const nameParts = formData.nombre.trim().split(' ');
      const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : formData.nombre;

      const ai = new GoogleGenAI({ apiKey });
      const scoresSummary = data.map(d => `- ${d.subject}: ${d.actual}/5.0`).join('\n');
      
      const systemInstruction = `Actúa como un Consultor Senior experto en Estrategia y Perdurabilidad Empresarial. 
      
      Tu objetivo es analizar los resultados de un diagnóstico empresarial y hablarle directamente al cliente (dueño o gerente) usando la segunda persona ("su empresa", "usted", "sus resultados", "su organización").
      
      Reglas de Estilo:
      1. Tono: Profesional, empático, orientado al futuro. Evita el lenguaje técnico excesivo.
      2. Personalización: Usa frases como "Aunque su organización ha invertido en...", "Su base operativa presenta...". Haz que el cliente sienta que le hablas a él.
      3. Extensión: Sé detallado y explicativo (mínimo 2 párrafos por sección). Justifica tus observaciones.
      4. Enfoque: Si hay puntajes bajos en Riesgos o Gobernanza, menciona el concepto de "Fragilidad Estructural".`;
      
      const prompt = `
        Analiza el siguiente diagnóstico de la empresa "${formData.empresa}".
        Puntaje Global: ${overallScore.toFixed(1)} / 5.0.
        
        Desglose de áreas:
        ${scoresSummary}
        
        Genera el contenido del informe con la siguiente estructura estricta (usa texto plano, párrafos bien redactados):

        ENCABEZADO:
        "Estimado ${formData.titulo} ${lastName},"

        1. Opinión Ejecutiva: (Mínimo 150 palabras). Un análisis profundo de la situación actual. Conecta las fortalezas con las debilidades. Explica qué significan estos números para la perdurabilidad del negocio a mediano plazo.
        
        2. Áreas Críticas (Identifica las 2 más bajas): Para cada una, explica claramente el riesgo de no atenderla y da 3 recomendaciones estratégicas y tácticas.
        
        3. Conclusión: Un mensaje final inspirador sobre la importancia de la institucionalización para dejar de ser una empresa reactiva y pasar a ser una empresa perdurable.

        FIRMA (Copia esto exactamente al final):
        Equipo de Consultoría Estratégica
        Empresas que Perduran
        www.empresasqueperduran.com
        +1 (305) 564-5805
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { systemInstruction, temperature: 0.7 },
      });

      return response.text;
    } catch (error) {
      console.error("Error IA:", error);
      return "No se pudo conectar con la IA para generar el análisis narrativo. Sin embargo, los datos numéricos son válidos y precisos.";
    }
  };

  const handleProcessReport = async (formData: LeadFormData) => {
    setIsProcessing(true);
    setLoadingMessage('Analizando datos...');
    setLastFormData(formData);
    
    try {
      setLoadingMessage('Consultando a la IA Experta...');
      const aiAnalysisText = await generateAIAnalysis(formData, reportData);

      setLoadingMessage('Generando PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Generación del PDF
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('Informe Diagnóstico 360', margin, 17);
      pdf.setFontSize(10);
      pdf.text(`Empresa: ${formData.empresa}`, pageWidth - margin, 17, { align: 'right' });

      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, 35);
      pdf.text(`Puntaje Global: ${overallScore.toFixed(1)} / 5.0`, pageWidth - margin, 35, { align: 'right' });

      let chartImageHeight = 0;
      if (chartRef.current) {
        const chartCanvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = chartCanvas.toDataURL('image/png');
        const imgWidth = 140; 
        chartImageHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
        const x = (pageWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', x, 45, imgWidth, chartImageHeight);
      }

      let currentY = 45 + chartImageHeight + 10;
      pdf.setFontSize(14);
      pdf.setTextColor(23, 37, 84);
      pdf.text("Resumen de Métricas", margin, currentY);
      currentY += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      reportData.forEach((item) => {
        pdf.text(`${item.subject}`, margin, currentY);
        pdf.text(`${item.actual.toFixed(1)}`, pageWidth - margin - 20, currentY, { align: 'right' });
        currentY += 6;
      });

      pdf.addPage();
      pdf.setFillColor(240, 249, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(20, 20, 20);
      pdf.setFontSize(16);
      pdf.text('Análisis Estratégico', margin, 20);
      pdf.setFontSize(11);
      
      const splitAnalysis = pdf.splitTextToSize(aiAnalysisText, pageWidth - (margin * 2));
      let textY = 35;
      splitAnalysis.forEach((line: string) => {
        if (textY > pageHeight - margin) { pdf.addPage(); textY = 20; }
        pdf.text(line, margin, textY);
        textY += 6;
      });

      // Enviar Correos
      setLoadingMessage('Enviando reportes...');
      
      // --- ACTUALIZADO SEGÚN CAPTURA DE PANTALLA ---
      const serviceID = 'service_okaskrg'; 
      // El ID de la captura es 'f7f6xho'. Usualmente llevan prefijo 'template_'.
      const templateID = 'template_f7f6xho'; 
      const publicKey = 'E5gBaI4olllFQ0BLk'; 

      // IMPORTANTE: En el Dashboard de EmailJS, cambia el campo "To Email" a: {{to_email}}
      // Si dejas el correo fijo que sale en la foto, el cliente NUNCA recibirá el mail.

      const clientBody = `Hola ${formData.titulo} ${formData.nombre.split(' ')[0]},\n\nGracias por realizar el Diagnóstico para ${formData.empresa}.\n\nAdjunto encontrarás el informe detallado generado por nuestra IA especializada.\n\nAtentamente,\nEquipo de Perdurabilidad.`;

      const adminBody = `NUEVO LEAD (Diagnóstico Completado):\nNombre: ${formData.titulo} ${formData.nombre}\nEmpresa: ${formData.empresa}\nEmail: ${formData.email}\nCelular: ${formData.celular}\nPuntaje Global: ${overallScore.toFixed(1)}`;

      await Promise.all([
        // Correo al Cliente
        emailjs.send(serviceID, templateID, {
          to_email: formData.email,      // Variable {{to_email}} requerida en Dashboard
          name: formData.nombre,         // Coincide con {{name}} en Dashboard
          email: formData.email,         // Coincide con {{email}} en Dashboard (Reply To)
          message: clientBody,           // Coincide con {{message}} en Dashboard
          company_name: formData.empresa
        }, publicKey)
        .then((res) => console.log("Email cliente enviado. Status:", res.status))
        .catch(e => console.error("FALLÓ Email Cliente.", e)),

        // Correo al Admin (Copia)
        emailjs.send(serviceID, templateID, {
          to_email: 'empresasqueperduran@gmail.com', // Variable {{to_email}} requerida en Dashboard
          name: "Sistema de Alertas",    // Coincide con {{name}}
          email: formData.email,         // Para que al responder le llegue al cliente
          message: adminBody,            // Coincide con {{message}}
          company_name: formData.empresa
        }, publicKey)
        .then((res) => console.log("Email admin enviado. Status:", res.status))
        .catch(e => console.error("FALLÓ Email Admin.", e))
      ]);
      
      pdf.save(`Diagnostico_${formData.empresa.replace(/\s+/g, '_')}.pdf`);
      setCurrentView('success');

    } catch (error) {
      console.error("Error general:", error);
      alert("Ocurrió un error en el proceso. Por favor verifica la consola para más detalles.");
    } finally {
      setIsProcessing(false);
      setIsLeadFormOpen(false);
      setLoadingMessage('');
    }
  };

  // --- Solicitar Contacto Consultor ---
  const handleContactRequest = async () => {
    if (!lastFormData) return;
    setIsContacting(true);

    const serviceID = 'service_okaskrg';
    const templateID = 'template_f7f6xho'; // Actualizado ID
    const publicKey = 'E5gBaI4olllFQ0BLk';

    const emailSubject = `LEAD: ${lastFormData.nombre} - ${lastFormData.empresa}`;

    const messageBody = `SOLICITUD DE PROPUESTA PERSONALIZADA\n` +
      `--------------------------------------\n` +
      `El cliente (${lastFormData.titulo} ${lastFormData.nombre}) ha solicitado ser contactado por un consultor especializado.\n\n` +
      `DETALLES DEL CLIENTE:\n` +
      `Nombre: ${lastFormData.nombre}\n` +
      `Empresa: ${lastFormData.empresa}\n` +
      `Email: ${lastFormData.email}\n` +
      `Celular: ${lastFormData.celular}\n` +
      `Sitio Web: ${lastFormData.website || 'No registrado'}\n\n` +
      `RESUMEN DEL DIAGNÓSTICO:\n` +
      `Puntaje Global: ${overallScore.toFixed(1)} / 5.0\n` +
      `Finanzas: ${reportData.find(d => d.subject.includes('Finanzas'))?.actual}\n` +
      `Operaciones: ${reportData.find(d => d.subject.includes('Operaciones'))?.actual}\n` +
      `Riesgos: ${reportData.find(d => d.subject.includes('Riesgos'))?.actual}\n` +
      `Talento: ${reportData.find(d => d.subject.includes('Talento'))?.actual}\n` +
      `Mercadeo: ${reportData.find(d => d.subject.includes('Mercadeo'))?.actual}\n` +
      `Gobernanza: ${reportData.find(d => d.subject.includes('Gobernanza'))?.actual}\n` +
      `Tecnología: ${reportData.find(d => d.subject.includes('Tecnología'))?.actual}`;

    try {
      await emailjs.send(serviceID, templateID, {
        to_email: 'empresasqueperduran@gmail.com', // Enviar al consultor
        name: lastFormData.nombre,
        email: lastFormData.email,
        message: `${emailSubject}\n\n${messageBody}`,
        company_name: lastFormData.empresa
      }, publicKey);
      
      setContactSuccess(true);
    } catch (error) {
      console.error("Error enviando solicitud de contacto (EmailJS)", error);
      alert("Hubo un error al enviar la solicitud. Verifique la consola (F12) para detalles de EmailJS.");
    } finally {
      setIsContacting(false);
    }
  };

  // --- VISTA 1: BIENVENIDA ---
  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-12">
            <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <LayoutDashboard className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Diagnóstico de Perdurabilidad 360°
            </h1>
            <p className="text-blue-100 text-lg sm:text-xl font-light">
              Descubra en menos de 5 minutos qué tan preparada está su empresa para el futuro.
            </p>
          </div>
          <div className="p-8 sm:p-12 bg-white">
            <div className="grid sm:grid-cols-3 gap-6 mb-10 text-left">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">Rápido</div>
                <p className="text-sm text-slate-600">Evalúe 7 dimensiones clave de forma ágil.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">Visual</div>
                <p className="text-sm text-slate-600">Obtenga un radar de vulnerabilidad instantáneo.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">IA Expert</div>
                <p className="text-sm text-slate-600">Reciba un análisis estratégico personalizado.</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('assessment')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold py-4 px-10 rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 mx-auto"
            >
              <PlayCircle size={24} />
              Generar Informe Personalizado
            </button>
            <p className="mt-6 text-xs text-gray-400">
              Herramienta gratuita basada en la metodología de Empresas que Perduran.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA 3: ÉXITO ---
  if (currentView === 'success') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-500">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            ¡Informe Generado con Éxito!
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Hemos enviado el <strong>análisis estratégico detallado</strong> a su correo electrónico y se ha descargado una copia en su dispositivo.
          </p>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-left mb-8 shadow-sm">
            <h3 className="font-bold text-blue-900 text-lg mb-2 flex items-center gap-2">
              <Info size={20} />
              ¿Qué sigue ahora?
            </h3>
            <p className="text-blue-800 text-base mb-6 leading-relaxed">
              Revise las recomendaciones de este informe personalizado.
            </p>
            
            <p className="text-gray-600 text-sm mb-4 italic border-l-4 border-blue-300 pl-3">
              "Haga click aquí si desea que le contacte un consultor especializado, quien diseñará una propuesta personalizada, adaptada a su situación particular, sin compromiso."
            </p>

            {!contactSuccess ? (
              <button 
                onClick={handleContactRequest}
                disabled={isContacting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isContacting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <UserCheck size={18} />
                    Solicitar Consultoría Personalizada
                  </>
                )}
              </button>
            ) : (
              <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg text-sm flex items-start gap-3 animate-in fade-in">
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">¡Solicitud Enviada!</span>
                  Un consultor analizará su caso y le contactará pronto.
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setScores(INITIAL_SCORES);
              setOpenSection(null);
              setContactSuccess(false);
              setLastFormData(null);
              setCurrentView('welcome');
            }}
            className="text-gray-500 hover:text-gray-900 font-medium text-sm underline underline-offset-4"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA 2: EVALUACIÓN (Dashboard Principal) ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <LeadFormModal 
        isOpen={isLeadFormOpen} 
        onClose={() => setIsLeadFormOpen(false)} 
        onSubmit={handleProcessReport}
        isProcessing={isProcessing}
        loadingMessage={loadingMessage}
      />
      
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-900/50 shadow-md">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">Diagnóstico 360°</h1>
                <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">v4.0</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-xs text-gray-400">Puntaje Global</span>
                <span className={`font-bold text-lg ${overallScore > 4 ? 'text-green-400' : overallScore > 2.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {overallScore.toFixed(1)} / 5.0
                </span>
             </div>
            
            <button 
              onClick={() => setIsLeadFormOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 border border-white/10"
            >
              <Sparkles size={16} className="text-yellow-300" />
              <span className="hidden sm:inline">Finalizar e Informe IA</span>
              <span className="sm:hidden">Finalizar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Data Input */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Evaluación</h2>
              <span className="text-sm text-gray-500">7 Dimensiones</span>
            </div>

            {/* INSTRUCCIONES */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <h3 className="text-blue-900 font-bold text-sm flex items-center gap-2 mb-2">
                <Info size={16} />
                ¿Cómo funciona?
              </h3>
              <ul className="text-sm text-blue-800 space-y-2 ml-1">
                <li className="flex gap-2">
                  <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Haga clic en cada una de las cajas de abajo (ej. Finanzas) para desplegar las preguntas.</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Mueva el círculo azul para calificar su empresa del <strong>0</strong> (Crítico) al <strong>5</strong> (Excelente).</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Cuando termine las 7 áreas, presione el botón <strong>"Finalizar e Informe IA"</strong> arriba a la derecha.</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              {DIMENSIONS.map(dim => (
                <ScoreInput
                  key={dim.key}
                  dimension={dim}
                  scores={scores[dim.key]}
                  onChange={handleScoreChange}
                  isOpen={openSection === dim.key}
                  onToggle={() => toggleSection(dim.key)}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Visualization & Report */}
          <div 
            className="lg:col-span-7 space-y-6 bg-white p-6 rounded-xl shadow-none lg:shadow-sm" 
            id="report-content" 
          >
            <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-4">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <FileText size={20} className="text-blue-600" />
                 Resultados en Tiempo Real
               </h2>
            </div>

            {/* Main Radar Chart Card - WRAPPED WITH REF FOR PDF GENERATION */}
            <div className="bg-white rounded-xl border border-gray-100 p-4" ref={chartRef}>
              <div className="mb-4 text-center">
                 <h3 className="text-gray-500 text-sm uppercase tracking-wide font-semibold">Mapa de Vulnerabilidad</h3>
              </div>
              <RadarReport data={reportData} />
              <div className="mt-4 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 opacity-50"></span>
                  <span className="text-gray-600">Su Empresa</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-gray-400 border-dashed"></span>
                  <span className="text-gray-600">Benchmark Institucional</span>
                </div>
              </div>
            </div>

            {/* Analysis & Tables */}
            <AnalysisSection data={reportData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;