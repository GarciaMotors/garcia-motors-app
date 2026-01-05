
import React, { useState, useRef } from 'react';
import { Save, Upload, Building, Phone, Mail, Image as ImageIcon, Trash2 } from 'lucide-react';
import { WorkshopSettings } from '../types';

interface SettingsProps {
  settings: WorkshopSettings;
  onSave: (settings: WorkshopSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
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
    alert('✅ Configuración guardada localmente.');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Building className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Configuración del Taller</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
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

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
                <Save className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h4 className="font-bold text-blue-800 text-sm">Almacenamiento Local</h4>
                <p className="text-xs text-blue-600 mt-1">
                    Sus datos se almacenan de forma privada en este navegador. Para transferirlos a otro equipo o asegurarlos, use la opción de **"Descargar Copia de Seguridad"** en el Panel de Control.
                </p>
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                <Save className="w-5 h-5" /> Guardar Configuración
            </button>
        </div>
      </form>
    </div>
  );
};
