
import React, { useState, useRef } from 'react';
import { Save, Upload, Building, Phone, Mail, FileText, Image as ImageIcon, Trash2, Cloud, Key, RefreshCw, Loader2, Info, CheckCircle } from 'lucide-react';
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
    alert('✅ Configuración guardada. Ya puedes ir al Panel a Subir/Bajar datos.');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Building className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* NUBE CONFIG REFORZADA */}
        <div className="bg-white p-6 rounded-xl border-2 border-indigo-200 shadow-md">
           <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-600" /> Conectar con la Nube
           </h3>
           
           <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                  <label className="block text-sm font-bold text-indigo-800 mb-2">Código de Sincronización</label>
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <Key className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
                          <input 
                            type="text" 
                            name="syncCode"
                            value={formData.syncCode || ''}
                            onChange={handleChange}
                            placeholder="Ej: Garcia2024"
                            className="pl-9 w-full rounded-md border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white font-mono font-bold"
                          />
                      </div>
                      <button 
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Conectar
                      </button>
                  </div>
                  <p className="text-[11px] text-indigo-600 mt-2">
                    💡 <strong>Cómo funciona:</strong> Inventa un código (mínimo 4 letras) y dale a Conectar. Escribe el MISMO código en tu otro equipo para compartir los datos.
                  </p>
              </div>

              <div className="flex items-center gap-2 text-gray-400 py-1">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-[10px] font-bold uppercase">o usa uno automático</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <button 
                type="button"
                onClick={onGenerateCode}
                className="w-full bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-md font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 transition"
              >
                <RefreshCw className="w-3 h-3" /> Generar Código Aleatorio
              </button>
           </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Taller</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" /></div>
        </div>

        {/* Logo Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-4">Logo del Taller (Para PDF)</label>
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
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2"><Upload className="w-4 h-4" /> Subir Logo</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"><Save className="w-5 h-5" /> Guardar Todo</button></div>
      </form>
    </div>
  );
};
