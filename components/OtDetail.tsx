
import React from 'react';
import { ArrowLeft, FileDown, CalendarClock } from 'lucide-react';
import { WorkOrder, WorkshopSettings } from '../types';
import { TAX_RATE } from '../constants';

interface OtDetailProps {
  ot: WorkOrder;
  settings: WorkshopSettings;
  onBack: () => void;
}

export const OtDetail: React.FC<OtDetailProps> = ({ ot, settings, onBack }) => {
  if (!ot) return null;
  const items = ot.items || [];
  const totalGross = items.reduce((s, i) => s + (i.quantity * i.unitPrice) - (i.discount || 0), 0);
  const totalNet = totalGross / (1 + TAX_RATE);
  const totalIVA = totalGross - totalNet;

  const handleDownloadPdf = () => {
    const element = document.getElementById('printable-area');
    const opt = { 
        margin: [10, 10, 10, 10], 
        filename: `OT-${ot.id}_${ot.vehicle.plate}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#FFFFFF',
          letterRendering: true
        }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    if ((window as any).html2pdf) {
        (window as any).html2pdf().set(opt).from(element).save();
    } else {
        window.print();
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="no-print bg-white p-4 border-b flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <button onClick={onBack} className="font-bold flex items-center gap-2 hover:text-blue-600 transition-all text-slate-600">
          <ArrowLeft className="w-5 h-5" /> Volver al Listado
        </button>
        <button onClick={handleDownloadPdf} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black flex items-center gap-3 shadow-lg hover:bg-slate-800 transition-all">
          <FileDown className="w-6 h-6" /> EXPORTAR PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto my-8 shadow-2xl print:shadow-none print:my-0" id="printable-area">
        <div className="bg-white p-10 flex flex-col gap-6 text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6">
                <div className="flex items-center gap-6">
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} className="h-20 w-20 object-contain rounded-lg border border-slate-100 p-1" />
                    )}
                    <div>
                      <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{settings.name}</h1>
                      <p className="text-[10px] tracking-[0.4em] text-blue-600 font-black uppercase mt-1">{settings.subtitle}</p>
                    </div>
                </div>
                <div className="text-right text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                    <p>{settings.address}</p>
                    <p>WhatsApp: {settings.phone}</p>
                    <p>{settings.email}</p>
                </div>
            </div>

            {/* OT Info */}
            <div className="flex justify-between items-end mt-2">
                <div>
                  <h2 className="text-xl font-black uppercase italic text-slate-800">Orden de Trabajo</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Emisión: {ot.date}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-5xl font-black tracking-tighter leading-none text-slate-900">#{ot.id}</h3>
                  <p className="text-[10px] font-black uppercase text-blue-600 mt-1 tracking-widest">{ot.documentType}</p>
                </div>
            </div>

            {/* Client & Vehicle */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="font-black text-[9px] border-b pb-1 uppercase mb-3 text-slate-400 tracking-widest">Datos del Cliente</h4>
                    <p className="font-black text-xl text-slate-900 uppercase">{ot.client.name}</p>
                    <p className="font-bold text-lg text-blue-600 mt-1">{ot.client.phone}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="font-black text-[9px] border-b pb-1 uppercase mb-3 text-slate-400 tracking-widest">Datos del Vehículo</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-bold uppercase">
                        <div><span className="text-[8px] text-slate-400 font-black">Patente</span><br/><span className="text-sm font-black font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{ot.vehicle.plate}</span></div>
                        <div><span className="text-[8px] text-slate-400 font-black">Kilometraje</span><br/>{ot.vehicle.mileage} KM</div>
                        <div className="col-span-2"><span className="text-[8px] text-slate-400 font-black">Marca / Modelo</span><br/>{ot.vehicle.brand} {ot.vehicle.model} ({ot.vehicle.year})</div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="break-inside-avoid">
                <h4 className="font-black text-[9px] uppercase mb-2 text-slate-400 tracking-widest">Diagnóstico y Servicios Realizados:</h4>
                <div className="p-6 bg-white border-2 border-slate-100 rounded-2xl min-h-[100px] text-sm italic leading-relaxed text-slate-700">
                    {ot.description || 'Sin diagnóstico registrado.'}
                </div>
                <div className="mt-3 flex justify-between items-center text-[10px] font-black uppercase">
                  <p className="text-slate-500">Mecánico: <span className="text-slate-900">{ot.mechanic || 'GARCIA MOTORS'}</span></p>
                  {ot.deliveredAt && <p className="text-emerald-600">Entregado el: {ot.deliveredAt}</p>}
                </div>
            </div>

            {/* Table */}
            <div className="break-inside-avoid overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
                        <tr>
                          <th className="p-3 text-left">Descripción del Servicio / Repuesto</th>
                          <th className="p-3 text-center w-20">Cant</th>
                          <th className="p-3 text-right w-32">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length > 0 ? items.map((it, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="p-3 font-bold text-[11px] uppercase text-slate-800">{it.description}</td>
                                <td className="p-3 text-center font-bold">{it.quantity}</td>
                                <td className="p-3 text-right font-black font-mono text-base">${((it.quantity * it.unitPrice) - (it.discount || 0)).toLocaleString()}</td>
                            </tr>
                        )) : (
                          <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">No hay ítems registrados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Totals & Signature Section */}
            <div className="break-inside-avoid mt-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex-1 space-y-4">
                        {ot.isMaintenance && (
                            <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex items-center gap-4">
                                <CalendarClock className="w-10 h-10 text-purple-600" />
                                <div>
                                  <p className="text-[9px] font-black text-purple-800 uppercase leading-none mb-1">Próxima Mantención</p>
                                  <p className="font-black text-lg text-purple-600">{ot.nextMaintenanceDate}</p>
                                </div>
                            </div>
                        )}
                        <div className="text-[10px] text-slate-400 italic">
                          <p>* Los repuestos instalados cuentan con garantía según proveedor.</p>
                          <p>* Este documento acredita los trabajos realizados en su vehículo.</p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-80 space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase px-2">
                          <span>Neto:</span>
                          <span>${Math.round(totalNet).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase px-2">
                          <span>IVA (19%):</span>
                          <span>${Math.round(totalIVA).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border-2 border-slate-900 flex justify-between items-center mt-2">
                          <span className="text-xl font-black italic uppercase tracking-tighter">Total</span>
                          <span className="text-3xl font-black font-mono tracking-tighter italic">${totalGross.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-20 flex justify-between px-10 pb-10">
                    <div className="w-56 border-t-2 border-slate-200 pt-3 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma Cliente</p>
                    </div>
                    <div className="w-56 border-t-2 border-slate-200 pt-3 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GARCIA MOTORS</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
