
import React, { useState, useRef } from 'react';
import { Save, Upload, Building, Phone, Mail, FileText, Image as ImageIcon, Trash2, Cloud, Key, RefreshCw, Loader2, Info } from 'lucide-react';
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
    alert('Configuración guardada exitosamente.');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Building className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Configuración del Taller</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* NUBE CONFIG */}
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
           <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5" /> Configuración de Nube (Sincronización)
           </h3>
           <p className="text-sm text-indigo-700 mb-4">
              Usa un código para sincronizar tus datos entre múltiples dispositivos (PC, iPhone, Tablet).
           </p>
           <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                 <Key className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
                 <input 
                    type="text" 
                    name="syncCode"
                    value={formData.syncCode || ''}
                    onChange={handleChange}
                    placeholder="Tu Código de Taller..."
                    className="pl-9 w-full rounded-md border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white font-mono"
                 />
              </div>
              <button 
                type="button"
                onClick={onGenerateCode}
                disabled={isSyncing}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Generar Nuevo
              </button>
           </div>
           <p className="text-[10px] text-indigo-500 mt-2 italic">
              * Si ya tienes un código, escríbelo arriba. Si el botón "Generar" falla, intenta de nuevo en 1 minuto.
           </p>
        </div>

        {/* IPHONE HELP */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
                <p className="font-bold mb-1">¿Cómo instalar en iPhone?</p>
                <p>En Safari, toca el botón <strong>Compartir</strong> (cuadrado con flecha) y luego selecciona <strong>"Agregar a inicio"</strong>.</p>
            </div>
        </div>

        {/* Logo Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-4">Logo del Taller (Para PDF)</label>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative group">
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
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2"><Upload className="w-4 h-4" /> Subir Logo</button>
            </div>
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

        <div className="flex justify-end pt-4"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"><Save className="w-5 h-5" /> Guardar Todo</button></div>
      </form>
    </div>
  );
};
