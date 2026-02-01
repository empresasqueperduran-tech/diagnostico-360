import React, { useState, useMemo, useRef } from 'react';
import { DIMENSIONS, INITIAL_SCORES } from './constants';
import { ScoreInput } from './components/ScoreInput';
import { RadarReport } from './components/RadarReport';
import { AnalysisSection } from './components/AnalysisSection';
import { LeadFormModal } from './components/LeadFormModal';
import { ScoresState, DimensionKey, ChartDataPoint, LeadFormData } from './types';
import { LayoutDashboard, FileText, Download, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [scores, setScores] = useState<ScoresState>(INITIAL_SCORES);
  const [openSection, setOpenSection] = useState<DimensionKey | null>('finanzas');
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Usamos una referencia específica solo para el gráfico
  const chartRef = useRef<HTMLDivElement>(null);

  const handleScoreChange = (dimKey: DimensionKey, index: number, value: number) => {
    setScores(prev => ({
      ...prev,
      [dimKey]: prev[dimKey].map((s, i) => i === index ? value : s)
    }));
  };

  const toggleSection = (key: DimensionKey) => {
    setOpenSection(openSection === key ? null : key);
  };

  // Prepare data for charts and tables
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
      // NOTA: En producción, asegúrate de que process.env.API_KEY esté disponible o usa un proxy.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const scoresSummary = data.map(d => `- ${d.subject}: ${d.actual}/5.0`).join('\n');
      
      // Prompt con "Metodología Experta" inyectada (Simulación de Base de Conocimiento)
      const systemInstruction = `
        Actúa como un Consultor Senior de Estrategia Empresarial especializado en "Perdurabilidad Corporativa".
        Tu objetivo es analizar los puntajes de un diagnóstico empresarial y redactar un informe ejecutivo directo y contundente.
        
        LA METODOLOGÍA DE PERDURABILIDAD:
        Te basas en el principio de que una empresa perdurable debe equilibrar 3 pilares:
        1. Eficiencia Operativa (Finanzas, Operaciones, Tecnología).
        2. Cohesión Cultural (Talento, Gobernanza).
        3. Adaptabilidad al Mercado (Mercadeo, Riesgos).
        
        ESTILO DE REDACCIÓN:
        - Profesional, corporativo, empático pero firme.
        - Evita generalidades. Sé específico basado en los puntajes bajos.
        - Estructura tu respuesta en texto plano con párrafos claros (sin markdown complejo como negritas ** o tablas, ya que esto irá a un PDF simple).
        - Usa viñetas simples con guiones (-) si es necesario.
      `;

      const prompt = `
        Empresa: ${companyName}
        Puntaje Global: ${overallScore.toFixed(1)}/5.0
        
        Puntajes por Dimensión:
        ${scoresSummary}
        
        Tarea:
        1. Escribe una "Opinión Ejecutiva" de 1 párrafo resumiendo la salud actual de la empresa.
        2. Identifica las 2 áreas más críticas (puntajes más bajos) y prescribe 3 recomendaciones tácticas concretas para cada una.
        3. Escribe una conclusión motivadora sobre el potencial de escalabilidad.
        
        Mantén el texto total bajo 400 palabras.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview', // Modelo rápido y capaz
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      return response.text;
    } catch (error) {
      console.error("Error AI generation:", error);
      return "No se pudo generar el análisis detallado por IA en este momento. Sin embargo, los datos numéricos adjuntos son precisos.";
    }
  };

  const handleProcessReport = async (formData: LeadFormData) => {
    setIsProcessing(true);
    setLoadingMessage('Analizando datos...');
    
    try {
      // 1. Generar Análisis de IA en paralelo a la preparación visual
      setLoadingMessage('Consultando a la IA Experta...');
      const aiAnalysisText = await generateAIAnalysis(formData.empresa, reportData);

      // 2. Generar PDF
      setLoadingMessage('Generando documento PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // --- PÁGINA 1: VISUAL ---
      // Encabezado
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('Informe Diagnóstico 360', margin, 17);
      pdf.setFontSize(10);
      pdf.setTextColor(200, 200, 200);
      pdf.text(`Empresa: ${formData.empresa}`, pageWidth - margin, 17, { align: 'right' });

      // Info
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, 35);
      pdf.text(`Puntaje Global: ${overallScore.toFixed(1)} / 5.0`, pageWidth - margin, 35, { align: 'right' });

      // Gráfico
      let chartImageHeight = 0;
      if (chartRef.current) {
        const chartCanvas = await html2canvas(chartRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        const imgData = chartCanvas.toDataURL('image/png');
        const imgWidth = 140; 
        chartImageHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
        const x = (pageWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', x, 45, imgWidth, chartImageHeight);
      }

      // Tabla Resumen Pág 1
      let currentY = 45 + chartImageHeight + 10;
      pdf.setFontSize(14);
      pdf.setTextColor(23, 37, 84);
      pdf.text("Resumen de Métricas", margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      reportData.forEach((item) => {
        const gap = 5 - item.actual;
        pdf.text(`${item.subject}`, margin, currentY);
        pdf.text(`${item.actual.toFixed(1)}`, pageWidth - margin - 20, currentY, { align: 'right' });
        currentY += 6;
      });

      // --- PÁGINA 2: ANÁLISIS IA ---
      pdf.addPage();
      
      // Encabezado Pág 2
      pdf.setFillColor(240, 249, 255); // Fondo azul muy claro para diferenciar
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('Análisis Estratégico & Recomendaciones', margin, 17);
      
      // Cuerpo del texto IA
      pdf.setTextColor(20, 20, 20);
      pdf.setFontSize(11);
      
      const splitAnalysis = pdf.splitTextToSize(aiAnalysisText, pageWidth - (margin * 2));
      let textY = 40;
      
      // Renderizar texto con paginación simple si fuera muy largo (aunque limitamos a 400 palabras)
      splitAnalysis.forEach((line: string) => {
        if (textY > pageHeight - margin) {
          pdf.addPage();
          pdf.setFillColor(240, 249, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          textY = 20;
        }
        pdf.text(line, margin, textY);
        textY += 6;
      });

      // Disclaimer IA
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Este análisis fue generado con inteligencia artificial basada en la metodología de Perdurabilidad 360.", margin, pageHeight - 10);

      // 3. Enviar Correo
      setLoadingMessage('Enviando confirmación...');
      const serviceID = 'service_okaskrg';
      const templateID = 'template_zskfr0m';
      const publicKey = 'E5gBaI4olllFQ0BLk';

      const firstName = formData.nombre.split(' ')[0];
      const emailBody = `Hola ${firstName},

El sistema inteligente ha completado el análisis de ${formData.empresa}.

Hemos generado un informe PDF de 2 páginas que incluye:
1. Tu Mapa de Vulnerabilidad Visual.
2. Un Análisis Estratégico redactado específicamente para tus resultados, con recomendaciones prácticas.

El archivo se ha descargado automáticamente en tu dispositivo.

Atentamente,
Tu Consultor Digital`;

      await emailjs.send(serviceID, templateID, {
        to_name: formData.nombre,
        to_email: formData.email,
        company_name: formData.empresa,
        message: emailBody,
      }, publicKey);
      
      // 4. Descargar
      pdf.save(`Diagnostico_Estrategico_${formData.empresa.replace(/\s+/g, '_')}.pdf`);
      
      alert(`¡Informe Inteligente Listo!\n\nSe ha generado un PDF con análisis estratégico detallado.\nVerifica tus descargas.`);

    } catch (error) {
      console.error("Error process", error);
      alert("Hubo un error generando el informe inteligente. Se descargará la versión básica.");
      // Fallback básico si falla la IA o algo más
      const pdf = new jsPDF();
      pdf.text("Informe Básico (Error en IA)", 10, 10);
      pdf.save("Diagnostico_Basico.pdf");
    } finally {
      setIsProcessing(false);
      setIsLeadFormOpen(false);
      setLoadingMessage('');
    }
  };

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
              <h1 className="text-lg font-bold tracking-tight">Diagnóstico 360°</h1>
              <p className="text-xs text-gray-400 font-light hidden sm:block">Perdurabilidad Empresarial</p>
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
              <span className="hidden sm:inline">Generar Informe con IA</span>
              <span className="sm:hidden">Informe IA</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Data Input */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Evaluación</h2>
              <span className="text-sm text-gray-500">7 Dimensiones</span>
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
                 Resultados Visuales
               </h2>
               <span className="text-xs text-gray-400 font-mono">Generado el {new Date().toLocaleDateString()}</span>
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
                  <span className="text-gray-600">Benchmark Institucional (Meta)</span>
                </div>
              </div>
            </div>

            {/* Analysis & Tables */}
            <AnalysisSection data={reportData} />
            
            <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
              <p>Diagnóstico de Perdurabilidad Empresarial 360 - {new Date().getFullYear()} (Actualizado)</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;