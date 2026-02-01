import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DIMENSIONS, INITIAL_SCORES } from './constants';
import { ScoreInput } from './components/ScoreInput';
import { RadarReport } from './components/RadarReport';
import { AnalysisSection } from './components/AnalysisSection';
import { LeadFormModal } from './components/LeadFormModal';
import { ScoresState, DimensionKey, ChartDataPoint, LeadFormData } from './types';
import { LayoutDashboard, FileText, Sparkles, ArrowRight, CheckCircle, Info, PlayCircle } from 'lucide-react';
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
  
  // Referencia para capturar el gráfico
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('App loaded v3.3 Flow Update');
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
  const generateAIAnalysis = async (companyName: string, data: ChartDataPoint[]) => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return "Análisis no disponible (Falta API Key).";

      const ai = new GoogleGenAI({ apiKey });
      const scoresSummary = data.map(d => `- ${d.subject}: ${d.actual}/5.0`).join('\n');
      
      const systemInstruction = `Actúa como Consultor Senior en Perdurabilidad Empresarial. Breve, directo y estratégico.`;
      
      const prompt = `
        Empresa: ${companyName}. Global: ${overallScore.toFixed(1)}/5.0.
        Puntajes: ${scoresSummary}.
        
        Redacta:
        1. Opinión Ejecutiva (1 párrafo).
        2. 2 Áreas Críticas con 3 recomendaciones c/u.
        3. Conclusión motivadora.
        Máximo 400 palabras. Texto plano.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { systemInstruction, temperature: 0.7 },
      });

      return response.text;
    } catch (error) {
      console.error("Error IA:", error);
      return "No se pudo conectar con la IA. Los datos numéricos son válidos.";
    }
  };

  const handleProcessReport = async (formData: LeadFormData) => {
    setIsProcessing(true);
    setLoadingMessage('Analizando datos...');
    
    try {
      setLoadingMessage('Consultando a la IA Experta...');
      const aiAnalysisText = await generateAIAnalysis(formData.empresa, reportData);

      setLoadingMessage('Generando PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Generación del PDF (Simplificada para brevedad, misma lógica visual)
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
      const serviceID = 'service_okaskrg';
      const templateID = 'template_zskfr0m';
      const publicKey = 'E5gBaI4olllFQ0BLk';

      const clientBody = `Hola ${formData.nombre.split(' ')[0]},\n\nGracias por realizar el Diagnóstico para ${formData.empresa}.\n\nAdjunto encontrarás el informe. Los datos indican áreas que requieren atención experta para garantizar la perdurabilidad.\n\nTe invitamos a agendar una sesión estratégica respondiendo a este correo.\n\nAtentamente,\nEquipo de Perdurabilidad.`;

      const adminBody = `NUEVO LEAD:\nNombre: ${formData.nombre}\nEmpresa: ${formData.empresa}\nEmail: ${formData.email}\nCelular: ${formData.celular}\nPuntaje: ${overallScore.toFixed(1)}`;

      await Promise.all([
        emailjs.send(serviceID, templateID, {
          to_name: formData.nombre,
          to_email: formData.email,
          company_name: formData.empresa,
          message: clientBody,
          reply_to: 'empresasqueperduran@gmail.com'
        }, publicKey).catch(e => console.error("Client email failed", e)),

        emailjs.send(serviceID, templateID, {
          to_name: "Admin",
          to_email: 'empresasqueperduran@gmail.com',
          company_name: formData.empresa,
          message: adminBody,
          reply_to: formData.email
        }, publicKey).catch(e => console.error("Admin email failed", e))
      ]);
      
      pdf.save(`Diagnostico_${formData.empresa.replace(/\s+/g, '_')}.pdf`);
      
      // CAMBIO DE ESTADO: Ir a pantalla de éxito
      setCurrentView('success');

    } catch (error) {
      console.error("Error", error);
      alert("Error generando el informe. Intente nuevamente.");
    } finally {
      setIsProcessing(false);
      setIsLeadFormOpen(false);
      setLoadingMessage('');
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
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            ¡Informe Generado con Éxito!
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Gracias por confiar en nuestro diagnóstico. Hemos enviado el <strong>análisis estratégico detallado</strong> a su correo electrónico y se ha descargado una copia en su dispositivo.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-left mb-8">
            <h3 className="font-bold text-blue-900 text-sm mb-1">¿Qué sigue ahora?</h3>
            <p className="text-blue-800 text-sm">
              Revise las recomendaciones de la IA. Si desea profundizar en cómo implementar estos cambios, responda a nuestro correo para agendar una sesión estratégica.
            </p>
          </div>
          <button 
            onClick={() => {
              setScores(INITIAL_SCORES);
              setOpenSection(null);
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
                <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">v3.3</span>
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

            {/* INSTRUCCIONES CLARAS (Estilo Niño) */}
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