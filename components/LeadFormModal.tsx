import React, { useState } from 'react';
import { X, Mail, Loader2, Download } from 'lucide-react';
import { LeadFormData } from '../types';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  isProcessing: boolean;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ isOpen, onClose, onSubmit, isProcessing }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    nombre: '',
    empresa: '',
    website: '',
    email: '',
    celular: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Download size={20} className="text-blue-400" />
              Descargar Informe
            </h3>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">
              Completa tus datos para <strong>descargar el PDF</strong> inmediatamente. También te enviaremos un análisis complementario a tu correo.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellido</label>
            <input 
              required
              name="nombre"
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej. Juan Pérez"
              value={formData.nombre}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input 
              required
              name="empresa"
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej. Soluciones S.A.S"
              value={formData.empresa}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input 
                required
                name="celular"
                type="tel" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="+57 300..."
                value={formData.celular}
                onChange={handleChange}
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
               <input 
                name="website"
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="tuempresa.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              required
              name="email"
              type="email" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50 border-blue-200"
              placeholder="juan@empresa.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Descargar Informe y Registrarse
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Sus datos son confidenciales. Al descargar acepta recibir información de análisis.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};