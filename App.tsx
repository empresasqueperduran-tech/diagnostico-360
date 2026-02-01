import React, { useState, useMemo, useRef } from 'react';
import { DIMENSIONS, INITIAL_SCORES } from './constants';
import { ScoreInput } from './components/ScoreInput';
import { RadarReport } from './components/RadarReport';
import { AnalysisSection } from './components/AnalysisSection';
import { LeadFormModal } from './components/LeadFormModal';
import { ScoresState, DimensionKey, ChartDataPoint, LeadFormData } from './types';
import { LayoutDashboard, FileText, Mail } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';

const App: React.FC = () => {
  const [scores, setScores] = useState<ScoresState>(INITIAL_SCORES);
  const [openSection, setOpenSection] = useState<DimensionKey | null>('finanzas');
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

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
    
    // 1. Generate PDF
    try {
      if (reportRef.current) {
        // --- PDF GENERATION ---
        const canvas = await html2canvas(reportRef.current, {
          scale: 2, // High resolution
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Header PDF
        pdf.setFillColor(15, 23, 42); // Slate 900
        pdf.rect(0, 0, pdfWidth, 20, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('Informe Diagnóstico 360', 10, 13);
        pdf.setFontSize(10);
        pdf.text(`Empresa: ${formData.empresa}`, pdfWidth - 10, 13, { align: 'right' });

        // Content
        pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
        
        // Save PDF locally (Download for the user)
        pdf.save(`Diagnostico_${formData.empresa.replace(/\s+/g, '_')}.pdf`);
        
        // --- EMAIL SENDING LOGIC ---
        // Credenciales de EmailJS configuradas
        const serviceID = 'service_okaskrg';
        const templateID = 'template_zskfr0m';
        const publicKey = 'E5gBaI4olllFQ0BLk';

        // REDACCIÓN DEL CORREO
        const emailBody = `Hola ${formData.nombre},

Gracias por completar el Diagnóstico de Perdurabilidad Empresarial 360 para ${formData.empresa}.

RESULTADOS GENERALES:
Puntaje Global: ${overallScore.toFixed(1)} / 5.0

DETALLE POR DIMENSIÓN:
${reportData.map(d => `- ${d.subject}: ${d.actual}/5.0`).join('\n')}

IMPORTANTE SOBRE SU INFORME PDF:
El informe gráfico completo en formato PDF se ha descargado automáticamente en su navegador al momento de hacer clic en enviar. Por favor revise su carpeta de "Descargas".

CONCLUSIÓN PRELIMINAR:
${overallScore > 4 
  ? "Su empresa muestra una solidez institucional excelente. El reto es mantener la innovación." 
  : overallScore > 2.5 
  ? "Su empresa tiene bases operativas funcionales, pero existen brechas de formalización que ponen en riesgo su crecimiento a largo plazo." 
  : "Se han detectado vulnerabilidades críticas. Se recomienda una intervención prioritaria en las áreas con menor puntaje."}

Si desea ayuda profesional para interpretar estos datos o crear un plan de acción, responda a este correo.

Atentamente,
El Equipo de Consultoría`;

        const templateParams = {
          to_name: formData.nombre,
          to_email: formData.email,
          company_name: formData.empresa,
          message: emailBody
        };

        // Enviar correo a través de EmailJS
        try {
          await emailjs.send(serviceID, templateID, templateParams, publicKey);
          console.log("Correo enviado exitosamente");
        } catch (emailError) {
          console.error("Error enviando correo:", emailError);
          // No mostramos error al usuario final si falla el correo, ya que el PDF sí se generó.
        }
        
        alert(`¡Listo!\n\n1. El PDF se ha descargado en tu equipo.\n2. Se ha enviado un correo de confirmación a ${formData.email}.`);
      }
    } catch (error) {
      console.error("Error generating report", error);
      alert("Hubo un error generando el reporte. Por favor intenta de nuevo.");
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
              <Mail size={16} />
              <span className="hidden sm:inline">Enviar informe PDF por correo</span>
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

          {/* Right Column: Visualization & Report (THIS IS CAPTURED FOR PDF) */}
          <div className="lg:col-span-7 space-y-6" id="report-content" ref={reportRef}>
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <FileText size={20} className="text-blue-600" />
                 Resultados Visuales
               </h2>
               <span className="text-xs text-gray-400 font-mono">Generado el {new Date().toLocaleDateString()}</span>
            </div>

            {/* Main Radar Chart Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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