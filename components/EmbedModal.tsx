import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  // Gets the current URL to create the iframe src. 
  // In a production environment, you might hardcode the production URL here.
  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://tu-app-url.com';
  
  const iframeCode = `<iframe 
  src="${appUrl}" 
  width="100%" 
  height="900" 
  frameborder="0" 
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"
  title="Diagnóstico de Perdurabilidad 360"
></iframe>`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800">
            <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
              <Code size={20} />
            </div>
            <h3 className="font-bold">Insertar en tu sitio web</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Copia el siguiente fragmento de código HTML y pégalo en el editor de tu sitio web para mostrar este diagnóstico interactivo a tus visitantes.
          </p>
          
          <div className="relative group">
            <div className="absolute top-2 right-2">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors backdrop-blur-md border border-white/10 text-xs font-medium"
                title="Copiar código"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span className="text-green-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-4 pt-10 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 whitespace-pre-wrap break-all shadow-inner">
              {iframeCode}
            </pre>
          </div>

          <div className="bg-indigo-50 text-indigo-800 text-xs p-3 rounded border border-indigo-100">
            <strong>Tip:</strong> Puedes ajustar los valores de <code>width</code> (ancho) y <code>height</code> (alto) en el código según el espacio disponible en tu página.
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};