
import React, { useState, useRef } from 'react';
import { Save, Upload, Building, Phone, Mail, FileText, Image as ImageIcon, Trash2, Cloud, Key, RefreshCw, Loader2, Info, CheckCircle, Copy } from 'lucide-react';
import { WorkshopSettings } from '../types';

interface SettingsProps {
  settings: WorkshopSettings;
  onSave: (settings: WorkshopSettings) => void;
  onGenerateCode?: () => void;
  isSyncing?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onGenerateCode, isSyncing }) => {
  const [formData, setFormData] = useState<WorkshopSettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const copyToClipboard = () => {
    if (formData.syncCode) {
      navigator.clipboard.writeText(formData.syncCode);
      alert("Copiado al portapapeles");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('✅ Guardado. Usa el botón "Subir" en el Panel para sincronizar por primera vez.');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Building className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* NUBE CONFIG SEGURA */}
        <div className="bg-indigo-900 p-6 rounded-xl shadow-xl text-white">
           <h3 className="font-bold mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5" /> Sincronización en la Nube
           </h3>
           
           <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                  <label className="block text-xs font-bold text-indigo-200 mb-2 uppercase tracking-wider">Tu ID de Sincronización</label>
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <Key className="absolute left-3 top-2.5 h-4 w-4 text-indigo-300" />
                          <input 
                            type="text" 
                            name="syncCode"
                            value={formData.syncCode || ''}
                            onChange={handleChange}
                            placeholder="Pega aquí el código del otro equipo..."
                            className="pl-9 w-full rounded-md border-transparent shadow-sm p-2 bg-indigo-800 text-white font-mono font-bold placeholder-indigo-400 focus:ring-2 focus:ring-indigo-400"
                          />
                      </div>
                      <button 
                        type="button"
                        onClick={copyToClipboard}
                        className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-md"
                        title="Copiar Código"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                  </div>
                  <p className="text-[10px] text-indigo-300 mt-3 leading-relaxed">
                    <strong>¡IMPORTANTE!</strong> Para que tus equipos se hablen, deben tener el MISMO código. Genera uno en tu PC y pégalo en tu celular.
                  </p>
              </div>

              <button 
                type="button"
                onClick={onGenerateCode}
                className="w-full bg-emerald-500 text-white px-4 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition shadow-lg"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Generar Nuevo Código en la Nube
              </button>
           </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase font-bold">Nombre del Taller</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase font-bold">Dirección</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase font-bold">Teléfono</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase font-bold">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" /></div>
        </div>

        {/* Logo Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-4 text-xs uppercase font-bold">Logo para PDF</label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative group">
              {formData.logoUrl ? (
                <>
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={removeLogo} className="text-white hover:text-red-400"><Trash2 className="w-6 h-6" /></button>
                  </div>
                </>
              ) : <ImageIcon className="w-8 h-8 text-gray-400" />}
            </div>
            <div className="flex-1">
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md flex items-center gap-2"><Upload className="w-4 h-4" /> Subir Logo</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"><Save className="w-5 h-5" /> Guardar Todo</button></div>
      </form>
    </div>
  );
};
