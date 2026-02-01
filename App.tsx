import React, { useState, useMemo, useRef } from 'react';
import { DIMENSIONS, INITIAL_SCORES } from './constants';
import { ScoreInput } from './components/ScoreInput';
import { RadarReport } from './components/RadarReport';
import { AnalysisSection } from './components/AnalysisSection';
import { LeadFormModal } from './components/LeadFormModal';
import { ScoresState, DimensionKey, ChartDataPoint, LeadFormData } from './types';
import { LayoutDashboard, FileText, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';

const App: React.FC = () => {
  const [scores, setScores] = useState<ScoresState>(INITIAL_SCORES);
  const [openSection, setOpenSection] = useState<DimensionKey | null>('finanzas');
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  const handleProcessReport = async (formData: LeadFormData) => {
    setIsProcessing(true);
    
    try {
      // --- 1. GENERACIÓN DE PDF (Para descarga local) ---
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;

      // Encabezado
      pdf.setFillColor(15, 23, 42); // Slate 900
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('Informe Diagnóstico 360', margin, 17);
      
      pdf.setFontSize(10);
      pdf.setTextColor(200, 200, 200);
      pdf.text(`Empresa: ${formData.empresa}`, pageWidth - margin, 17, { align: 'right' });

      // Información General
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, 35);
      pdf.text(`Solicitante: ${formData.nombre}`, margin, 42);

      // Puntaje Global
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Puntaje Global: ${overallScore.toFixed(1)} / 5.0`, pageWidth - margin, 42, { align: 'right' });

      // Capturar Gráfico
      let chartImageHeight = 0;
      if (chartRef.current) {
        const chartCanvas = await html2canvas(chartRef.current, {
          scale: 2, // Mayor calidad para descarga local
          backgroundColor: '#ffffff'
        });
        const imgData = chartCanvas.toDataURL('image/png'); // PNG para mejor calidad
        const imgWidth = 140; 
        chartImageHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
        const x = (pageWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', x, 50, imgWidth, chartImageHeight);
      }

      // Tabla de Resultados
      let currentY = 50 + chartImageHeight + 15;
      
      pdf.setFontSize(14);
      pdf.setTextColor(23, 37, 84); 
      pdf.text("Detalle de Dimensiones", margin, currentY);
      
      currentY += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("DIMENSIÓN", margin, currentY);
      pdf.text("PUNTAJE", pageWidth - margin - 40, currentY);
      pdf.text("BRECHA", pageWidth - margin, currentY, { align: 'right' });
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
      
      currentY += 10;
      pdf.setTextColor(0, 0, 0);

      reportData.forEach((item) => {
        const gap = 5 - item.actual;
        pdf.text(item.subject, margin, currentY);
        
        if (item.actual < 3) pdf.setTextColor(220, 38, 38); 
        else pdf.setTextColor(0, 0, 0);
        
        pdf.text(`${item.actual.toFixed(1)} / 5.0`, pageWidth - margin - 35, currentY);
        
        pdf.setTextColor(100, 100, 100);
        pdf.text(`-${gap.toFixed(1)}`, pageWidth - margin, currentY, { align: 'right' });
        
        pdf.setTextColor(0, 0, 0); 
        currentY += 8;
      });

      // Conclusión
      currentY += 15;
      pdf.setFillColor(240, 249, 255); 
      pdf.rect(margin, currentY, pageWidth - (margin * 2), 40, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(23, 37, 84);
      pdf.text("Análisis Preliminar", margin + 5, currentY + 10);
      
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      
      let conclusion = "";
      if (overallScore > 4) conclusion = "Excelente nivel de institucionalización. Enfoque estratégico: Innovación y expansión.";
      else if (overallScore > 2.5) conclusion = "Operación funcional pero dependiente. Se detectan brechas de formalización que requieren atención para escalar.";
      else conclusion = "Nivel de vulnerabilidad alto. Se recomienda intervención prioritaria en las áreas marcadas en rojo para asegurar la continuidad.";
      
      const splitText = pdf.splitTextToSize(conclusion, pageWidth - (margin * 2) - 10);
      pdf.text(splitText, margin + 5, currentY + 20);

      // --- 2. ENVÍO DE CORREO (SOLO DATOS, SIN ADJUNTO) ---
      // Esto asegura que el correo salga rápido y no falle por peso
      const serviceID = 'service_okaskrg';
      const templateID = 'template_zskfr0m';
      const publicKey = 'E5gBaI4olllFQ0BLk';

      const firstName = formData.nombre.split(' ')[0];
      const emailBody = `Hola ${firstName},

Gracias por utilizar nuestra herramienta de Diagnóstico 360 para ${formData.empresa}.

Tus datos han sido registrados correctamente. El informe PDF detallado se ha generado y descargado en tu dispositivo.

RESUMEN DE TU DIAGNÓSTICO:
- Puntaje Global: ${overallScore.toFixed(1)} / 5.0
- Brecha Principal: ${reportData.sort((a,b) => a.actual - b.actual)[0].subject}

En los próximos días te enviaremos información complementaria para ayudarte a mejorar estos indicadores.

Si deseas agendar una sesión de revisión de estos resultados, responde a este correo.

Atentamente,
Carlos Borjas
Consultor de Empresas`;

      const templateParams = {
        to_name: formData.nombre,
        to_email: formData.email,
        company_name: formData.empresa,
        message: emailBody,
        // IMPORTANTE: No enviamos 'content' (el PDF) por correo para evitar errores de tamaño.
        // El usuario lo descarga directamente.
      };

      // Enviamos el correo en segundo plano
      await emailjs.send(serviceID, templateID, templateParams, publicKey);
      
      // --- 3. DESCARGA DEL PDF ---
      pdf.save(`Diagnostico_${formData.empresa.replace(/\s+/g, '_')}.pdf`);
      
      alert(`¡Registro Exitoso!\n\n1. Tu informe PDF se está descargando automáticamente.\n2. Hemos enviado un respaldo de los datos a ${formData.email}.`);

    } catch (error) {
      console.error("Error process", error);
      // Si falla el correo, al menos aseguramos la descarga del PDF
      alert("Tu informe se generó correctamente y se descargará ahora.");
      try {
         // Reintentar solo descarga si falló algo previo
         const pdf = new jsPDF('p', 'mm', 'a4');
         pdf.text("Copia de seguridad del informe", 10, 10);
         pdf.save("Diagnostico_Respaldo.pdf");
      } catch(e) {}
    } finally {
      setIsProcessing(false);
      setIsLeadFormOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <LeadFormModal 
        isOpen={isLeadFormOpen} 
        onClose={() => setIsLeadFormOpen(false)} 
        onSubmit={handleProcessReport}
        isProcessing={isProcessing}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/30"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Descargar Informe PDF</span>
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
              <p>Diagnóstico de Perdurabilidad Empresarial 360 - {new Date().getFullYear()}</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;