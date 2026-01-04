import React, { useState, useMemo } from 'react';
import { CalendarDays, Plus, Trash2, User, Clock, AlignLeft, Check, X, CalendarClock, MessageCircle, AlertTriangle, AlertCircle, Send } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';

interface AgendaProps {
  appointments: Appointment[];
  onAdd: (apt: Appointment) => void;
  onDelete: (id: string) => void;
  onUpdate?: (updatedApt: Appointment) => void; // New prop for updates
}

// Helper to capitalize (Title Case)
const capitalize = (str: string) => {
    return str.replace(/\b\w/g, l => l.toUpperCase());
};

// Helper for WhatsApp
const sendWhatsApp = (clientName: string, issue: string, date: string, time: string) => {
    // Nota: Como no tenemos teléfono garantizado en el objeto Cita simple, 
    // abriremos WhatsApp Web en blanco con el mensaje precargado para que el usuario seleccione el contacto.
    // O si en el futuro se agrega el campo teléfono a la cita, se usará aquí.
    
    const msg = `Hola ${clientName}, le recordamos su hora en el taller para mañana ${date} a las ${time}. Motivo: ${issue}. ¿Confirma asistencia?`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`; // Abre lista de contactos si no hay número
    window.open(url, '_blank');
};

export const Agenda: React.FC<AgendaProps> = ({ appointments, onAdd, onDelete, onUpdate }) => {
  const [newApt, setNewApt] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    clientName: '',
    plate: '',
    issue: ''
  });

  const [rescheduleData, setRescheduleData] = useState<{id: string, date: string, time: string} | null>(null);

  // Check for bad history (Cancellation Warning)
  const cancellationHistoryWarning = useMemo(() => {
    if (!newApt.clientName) return false;
    // Check if client has ANY cancelled appointments in the past
    return appointments.some(a => 
        a.status === 'cancelled' && 
        a.clientName.trim().toLowerCase() === newApt.clientName.trim().toLowerCase()
    );
  }, [newApt.clientName, appointments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.clientName || !newApt.date) return;

    onAdd({
      id: Date.now().toString(),
      date: newApt.date,
      time: newApt.time,
      clientName: newApt.clientName,
      plate: newApt.plate.toUpperCase(),
      issue: newApt.issue,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Reset fields except date
    setNewApt(prev => ({ ...prev, clientName: '', plate: '', issue: '' }));
  };

  const handleChange = (field: keyof typeof newApt) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let val = e.target.value;
      if (field === 'clientName' || field === 'issue') val = capitalize(val);
      if (field === 'plate') val = val.toUpperCase();
      setNewApt(prev => ({ ...prev, [field]: val }));
  };

  // --- ACTIONS ---

  const handleStatusChange = (apt: Appointment, newStatus: AppointmentStatus) => {
      if (onUpdate) {
          onUpdate({ ...apt, status: newStatus });
      }
  };

  const startReschedule = (apt: Appointment) => {
      setRescheduleData({
          id: apt.id,
          date: apt.date,
          time: apt.time
      });
  };

  const saveReschedule = () => {
      if (rescheduleData && onUpdate) {
          const apt = appointments.find(a => a.id === rescheduleData.id);
          if (apt) {
              onUpdate({ 
                  ...apt, 
                  date: rescheduleData.date, 
                  time: rescheduleData.time,
                  status: 'pending' // Reset to pending after reschedule usually, or keep confirmed? Let's confirm logic. Usually pending until re-confirmed.
              });
          }
      }
      setRescheduleData(null);
  };

  // Group appointments by date
  const sortedAppointments = [...appointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Agenda de Taller</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Nueva Cita
            </h3>
            
            {cancellationHistoryWarning && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-800">¡Aviso Importante!</p>
                        <p className="text-xs text-red-700 mt-1">
                            El cliente <strong>{newApt.clientName}</strong> tiene citas canceladas anteriormente. 
                            Se recomienda confirmar asistencia inmediatamente o solicitar abono antes de agendar.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input 
                            type="date" 
                            required
                            value={newApt.date}
                            onChange={handleChange('date')}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                        <input 
                            type="time" 
                            required
                            value={newApt.time}
                            onChange={handleChange('time')}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Cliente</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Ej: Pedro Pascal"
                        value={newApt.clientName}
                        onChange={handleChange('clientName')}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
                    <input 
                        type="text" 
                        placeholder="XXXX99"
                        value={newApt.plate}
                        onChange={handleChange('plate')}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border uppercase"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Problema / Motivo</label>
                    <textarea 
                        rows={3}
                        placeholder="Ej: Cambio de aceite, ruidos en frenos..."
                        value={newApt.issue}
                        onChange={handleChange('issue')}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex justify-center items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Agendar Cita
                </button>
            </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Próximas Citas
            </h3>
            
            {sortedAppointments.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                    No hay citas agendadas.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {sortedAppointments.map(apt => {
                        const isPast = new Date(`${apt.date}T${apt.time}`) < new Date();
                        const isCancelled = apt.status === 'cancelled';
                        const isConfirmed = apt.status === 'confirmed';
                        
                        // FIX: Use specific Time to prevent Timezone shift to previous day
                        const displayDate = new Date(apt.date + 'T00:00:00');
                        
                        return (
                            <div key={apt.id} className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition
                                ${isCancelled ? 'bg-red-50 opacity-70' : isConfirmed ? 'bg-green-50' : 'hover:bg-gray-50 bg-white'}
                            `}>
                                <div className="flex gap-4">
                                    <div className={`flex flex-col items-center justify-center rounded-lg p-2 min-w-[70px] border 
                                        ${isCancelled ? 'bg-red-100 text-red-700 border-red-200' : 
                                          isConfirmed ? 'bg-green-100 text-green-700 border-green-200' : 
                                          'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        <span className="text-xs font-bold uppercase">{displayDate.toLocaleDateString('es-CL', { month: 'short' })}</span>
                                        <span className="text-xl font-bold">{displayDate.getDate()}</span>
                                        <span className="text-xs">{apt.time}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-bold ${isCancelled ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                {apt.clientName}
                                            </h4>
                                            {apt.plate && (
                                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded border uppercase font-bold">
                                                    {apt.plate}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 flex items-start gap-1">
                                            <AlignLeft className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                                            {apt.issue || 'Sin detalles'}
                                        </div>
                                        
                                        {/* Status Text */}
                                        <div className="mt-1">
                                            {isCancelled && <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Cancelado</span>}
                                            {isConfirmed && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Confirmado</span>}
                                            {(!isConfirmed && !isCancelled) && <span className="text-xs text-yellow-600 font-bold">Pendiente confirmación</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 ml-auto md:ml-0 flex-wrap justify-end">
                                    {!isCancelled && (
                                        <>
                                            <button
                                                onClick={() => sendWhatsApp(apt.clientName, apt.issue, apt.date, apt.time)}
                                                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                                                title="Enviar recordatorio WhatsApp"
                                            >
                                                <Send className="w-3 h-3" /> Aviso
                                            </button>

                                            {!isConfirmed && (
                                                <button
                                                    onClick={() => handleStatusChange(apt, 'confirmed')}
                                                    className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" /> Confirmar
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => startReschedule(apt)}
                                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1"
                                            >
                                                <CalendarClock className="w-3 h-3" /> Reagendar
                                            </button>

                                            <button
                                                onClick={() => handleStatusChange(apt, 'cancelled')}
                                                className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1"
                                            >
                                                <X className="w-3 h-3" /> Cancelar
                                            </button>
                                        </>
                                    )}

                                    {/* Delete Button (Always available or only for admin/cleanup) */}
                                    <button 
                                        onClick={() => onDelete(apt.id)}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* Reschedule Modal/Overlay (Simple inline implementation) */}
      {rescheduleData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-sm animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <CalendarClock className="w-5 h-5 text-blue-600" /> Reagendar Cita
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Fecha</label>
                          <input 
                              type="date" 
                              className="w-full border rounded p-2"
                              value={rescheduleData.date}
                              onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Hora</label>
                          <input 
                              type="time" 
                              className="w-full border rounded p-2"
                              value={rescheduleData.time}
                              onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                          <button 
                              onClick={() => setRescheduleData(null)}
                              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={saveReschedule}
                              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-bold"
                          >
                              Guardar Cambios
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};