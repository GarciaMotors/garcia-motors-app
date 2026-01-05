
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, User, Car, Wrench, Calculator, ShieldAlert, X, ScanLine, Link as LinkIcon, PackageCheck, CalendarClock, Trash2, Search } from 'lucide-react';
import { WorkOrder, WorkItem, ItemType, DocumentType, Vehicle, DamagePoint } from '../types';
import { TAX_RATE } from '../constants';

interface OtFormProps {
  initialData?: WorkOrder | null;
  existingOrders?: WorkOrder[];
  onSave: (ot: WorkOrder) => void;
  onCancel: () => void;
}

const capitalize = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase());
const formatNumber = (num: number | undefined) => (num === undefined || num === null) ? '' : num.toLocaleString('es-CL');
const parseNumber = (str: string) => {
    const clean = str.replace(/\./g, '').replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
};

const CarCroquis = ({ points, onAddPoint, onRemovePoint, readOnly = false }: { 
    points: DamagePoint[], 
    onAddPoint?: (x: number, y: number) => void,
    onRemovePoint?: (id: string) => void,
    readOnly?: boolean
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const handleClick = (e: React.MouseEvent) => {
        if (readOnly || !onAddPoint || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onAddPoint(x, y);
    };

    return (
        <div className="relative w-full max-w-[280px] aspect-[3/5] mx-auto select-none bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden">
            <svg ref={svgRef} viewBox="0 0 300 500" preserveAspectRatio="xMidYMid meet" className={`w-full h-full ${!readOnly ? 'cursor-crosshair' : ''}`} onClick={handleClick}>
                <path d="M70,40 Q150,25 230,40 C260,50 265,100 265,150 L265,340 C265,420 250,470 230,480 Q150,490 70,480 C50,470 35,420 35,340 L35,150 C35,100 40,50 70,40 Z" fill="#ffffff" stroke="#000000" strokeWidth="10" />
                <path d="M75,130 Q150,115 225,130 L240,165 Q150,155 60,165 Z" fill="#cbd5e1" stroke="#000000" strokeWidth="4" />
                <path d="M75,345 Q150,355 225,345 L215,380 Q150,390 85,380 Z" fill="#cbd5e1" stroke="#000000" strokeWidth="4" />
                <line x1="150" y1="40" x2="150" y2="470" stroke="#000000" strokeWidth="1" strokeDasharray="5,5" />
                <text x="150" y="30" textAnchor="middle" fontSize="18" fontWeight="black" fill="#000000">FRENTE</text>
                <text x="150" y="490" textAnchor="middle" fontSize="18" fontWeight="black" fill="#000000">ATRÁS</text>
            </svg>
            {points.map(p => (
                <div key={p.id} onClick={(e) => { e.stopPropagation(); if(!readOnly && onRemovePoint) onRemovePoint(p.id); }}
                    className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[11px] font-black cursor-pointer z-10 bg-red-600 text-white"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}>X</div>
            ))}
        </div>
    );
};

export const OtForm: React.FC<OtFormProps> = ({ initialData, existingOrders = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState<WorkOrder>({
    id: '', otType: 'normal', parentOtId: '', warrantyReason: '', date: new Date().toISOString().split('T')[0], status: 'in-progress', documentType: 'cotizacion', mechanic: '', description: '',
    client: { name: '', phone: '' }, vehicle: { brand: '', model: '', plate: '', year: '', mileage: '', vin: '' }, items: [], notes: '', clientProvidesParts: false, isMaintenance: false,
    maintenanceIntervalMonths: 6, nextMaintenanceDate: '', maintenanceAlertDismissed: false, technicalRecommendations: '', visualInspectionComments: '', damagePoints: [], hasScanner: false, scannerLink: ''
  });

  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  useEffect(() => {
    if (initialData) {
        setFormData(initialData);
        setClientSearch(initialData.client.name);
    } else {
        const maxId = existingOrders.reduce((max, order) => { const num = parseInt(order.id); return !isNaN(num) && num > max ? num : max; }, 5089);
        setFormData(prev => ({ ...prev, id: (maxId + 1).toString() }));
    }
  }, [initialData, existingOrders]);

  useEffect(() => {
    if (formData.isMaintenance && formData.date) {
        const d = new Date(formData.date);
        d.setMonth(d.getMonth() + (formData.maintenanceIntervalMonths || 6));
        setFormData(prev => ({ ...prev, nextMaintenanceDate: d.toISOString().split('T')[0] }));
    }
  }, [formData.isMaintenance, formData.maintenanceIntervalMonths, formData.date]);

  // Sugerencias de Mecánicos (Se actualiza con cada cambio en el estado de las órdenes)
  const mechanicList = useMemo(() => {
      const names = existingOrders.map(o => o.mechanic).filter(m => m && m.length > 2);
      // Incluir también los nombres que se van escribiendo en la sesión actual?
      // Por ahora solo de órdenes guardadas.
      return Array.from(new Set(names)).sort();
  }, [existingOrders]);

  // Sugerencias de Clientes
  const clientSuggestions = useMemo(() => {
      if (!clientSearch || clientSearch.length < 2) return [];
      const term = clientSearch.toLowerCase();
      const results = new Map();
      existingOrders.forEach(o => {
          if (o.client.name.toLowerCase().includes(term)) {
              results.set(o.client.name + o.vehicle.plate, { client: o.client, vehicle: o.vehicle });
          }
      });
      return Array.from(results.values()).slice(0, 5);
  }, [existingOrders, clientSearch]);

  const selectClientSuggestion = (s: {client: any, vehicle: any}) => {
      setFormData(prev => ({ 
          ...prev, 
          client: { ...s.client }, 
          vehicle: { ...s.vehicle, mileage: '', vin: s.vehicle.vin || '' } 
      }));
      setClientSearch(s.client.name);
      setShowClientSuggestions(false);
  };

  const handleItemUpdate = (id: string, field: keyof WorkItem, value: any) => {
      setFormData(prev => ({ ...prev, items: prev.items.map(item => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === 'isBuyerPaid') updated.paymentDate = value ? new Date().toISOString().split('T')[0] : '';
          return updated;
      }) }));
  };

  const calculateTotal = () => formData.items.reduce((s, i) => s + (i.unitPrice * i.quantity) - (i.discount || 0), 0);
  const totalGross = calculateTotal();
  const totalNet = totalGross / (1 + TAX_RATE);
  const totalIva = totalGross - totalNet;

  return (
    <div className="animate-fade-in pb-20 space-y-6">
      <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={() => setFormData({...formData, otType: 'normal'})} className={`px-4 py-2 rounded-lg border-2 font-black transition-all ${formData.otType === 'normal' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}>NORMAL</button>
          <button type="button" onClick={() => setFormData({...formData, otType: 'warranty'})} className={`px-4 py-2 rounded-lg border-2 font-black transition-all ${formData.otType === 'warranty' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white'}`}>GARANTÍA</button>
          <label className={`px-4 py-2 rounded-lg border-2 font-black flex items-center gap-2 cursor-pointer transition-all ${formData.isMaintenance ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white'}`}>
              <input type="checkbox" checked={formData.isMaintenance} onChange={e => setFormData({...formData, isMaintenance: e.target.checked})} className="w-4 h-4" /> MANTENCIÓN
          </label>
      </div>

      <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><label className="text-[10px] font-black uppercase text-gray-400">OT #</label><input type="text" readOnly value={formData.id} className="w-full rounded p-2 bg-gray-100 font-bold" /></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400">Fecha</label><input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full rounded p-2 border" /></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400">Estado</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full rounded p-2 border font-bold"><option value="pending">Pendiente</option><option value="in-progress">En Progreso</option><option value="completed">Terminado</option><option value="delivered">Entregado</option></select></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400">Venta</label><select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value as DocumentType})} className="w-full rounded p-2 border bg-blue-50 font-bold"><option value="cotizacion">Presupuesto</option><option value="boleta">Boleta</option><option value="factura">Factura</option></select></div>
        </div>

        {formData.otType === 'warranty' && (
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div><label className="text-xs font-black text-orange-800 uppercase">OT Original de Referencia</label><input type="text" value={formData.parentOtId} onChange={e => setFormData({...formData, parentOtId: e.target.value})} className="w-full rounded p-2 border border-orange-200" placeholder="Ej: 5089" /></div>
                <div><label className="text-xs font-black text-orange-800 uppercase">Motivo de Garantía</label><input type="text" value={formData.warrantyReason} onChange={e => setFormData({...formData, warrantyReason: capitalize(e.target.value)})} className="w-full rounded p-2 border border-orange-200" /></div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 relative">
                <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2"><User className="w-5 h-5 text-blue-600" /> Cliente</h3>
                <div className="relative">
                    <input 
                        type="text" required placeholder="Nombre Completo..." 
                        value={clientSearch} 
                        onChange={e => { setClientSearch(e.target.value); setFormData({...formData, client: {...formData.client, name: capitalize(e.target.value)}}); setShowClientSuggestions(true); }} 
                        className="w-full rounded p-2 border font-bold" 
                    />
                    {showClientSuggestions && clientSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-2xl z-50 divide-y overflow-hidden mt-1">
                            {clientSuggestions.map((s, i) => (
                                <div key={i} className="p-2 hover:bg-blue-50 cursor-pointer text-xs" onClick={() => selectClientSuggestion(s)}>
                                    <div className="font-bold">{s.client.name}</div>
                                    <div className="text-gray-400 uppercase">{s.vehicle.brand} {s.vehicle.model} ({s.vehicle.plate})</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <input type="tel" required placeholder="WhatsApp..." value={formData.client.phone} onChange={e => setFormData({...formData, client: {...formData.client, phone: e.target.value}})} className="w-full rounded p-2 border" />
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2 mb-4"><Car className="w-5 h-5 text-blue-600" /> Vehículo</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" required placeholder="PATENTE" value={formData.vehicle.plate} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, plate: e.target.value.toUpperCase()}})} className="rounded p-2 border uppercase font-bold" />
                    <input type="text" required placeholder="Marca" value={formData.vehicle.brand} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, brand: capitalize(e.target.value)}})} className="rounded p-2 border" />
                    <input type="text" required placeholder="Modelo" value={formData.vehicle.model} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, model: capitalize(e.target.value)}})} className="rounded p-2 border" />
                    <input type="text" placeholder="Año" value={formData.vehicle.year} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, year: e.target.value}})} className="rounded p-2 border" />
                    <input type="text" placeholder="KM" value={formData.vehicle.mileage} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, mileage: e.target.value}})} className="rounded p-2 border" />
                    <input type="text" placeholder="VIN / CHASIS" value={formData.vehicle.vin} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, vin: e.target.value.toUpperCase()}})} className="rounded p-2 border font-mono text-xs uppercase" />
                </div>
            </div>
        </div>

        {formData.isMaintenance && (
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in shadow-inner">
                <h3 className="md:col-span-2 font-black text-purple-800 flex items-center gap-2"><CalendarClock className="w-5 h-5" /> CONFIGURACIÓN DE MANTENCIÓN</h3>
                <div><label className="text-[10px] font-black text-purple-600 uppercase">Meses para Próximo Aviso</label><input type="number" value={formData.maintenanceIntervalMonths} onChange={e => setFormData({...formData, maintenanceIntervalMonths: parseInt(e.target.value) || 0})} className="w-full p-2 rounded border border-purple-200" /></div>
                <div><label className="text-[10px] font-black text-purple-600 uppercase">Fecha Sugerida de Regreso</label><input type="date" value={formData.nextMaintenanceDate} onChange={e => setFormData({...formData, nextMaintenanceDate: e.target.value})} className="w-full p-2 rounded border border-purple-200" /></div>
            </div>
        )}

        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-800"><ScanLine className="w-5 h-5 text-blue-600" /> Diagnóstico y Servicios</h3>
            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: capitalize(e.target.value)})} placeholder="Escriba aquí los síntomas, fallas detectadas y trabajos realizados..." className="w-full rounded p-3 border shadow-inner text-sm bg-slate-50" />
            <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <input type="checkbox" checked={formData.hasScanner} onChange={e => setFormData({...formData, hasScanner: e.target.checked})} className="w-5 h-5 cursor-pointer" id="chk-scan" />
                    <label htmlFor="chk-scan" className="text-xs font-black text-blue-800 cursor-pointer">ESCÁNER COMPUTARIZADO REALIZADO</label>
                </div>
                {formData.hasScanner && (
                    <div className="flex-1 min-w-[300px] animate-scale-in">
                        <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Link de Informe Escáner</label>
                        <input type="url" value={formData.scannerLink} onChange={e => setFormData({...formData, scannerLink: e.target.value})} placeholder="Pegue aquí el link del informe (PDF/Cloud)..." className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                )}
            </div>
            <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Mecánico a Cargo</label>
                <input 
                    type="text" list="mechanics" value={formData.mechanic} 
                    onChange={e => setFormData({...formData, mechanic: capitalize(e.target.value)})} 
                    className="w-full rounded p-2 border font-bold" 
                    placeholder="Escriba o seleccione mecánico..."
                />
                <datalist id="mechanics">
                    {mechanicList.map((m, i) => <option key={i} value={m} />)}
                </datalist>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold uppercase tracking-tighter italic">Cálculo de Insumos y Mano de Obra</h3><div className="flex gap-2"><button type="button" onClick={() => setFormData(p => ({...p, items: [...p.items, {id: Date.now().toString(), description: '', type: 'part', quantity: 1, unitPrice: 0, costPrice: 0, buyer: '', provider: '', purchaseDocType: 'boleta', isBuyerPaid: false}]}))} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-black text-xs shadow-md">+ REPUESTO</button><button type="button" onClick={() => setFormData(p => ({...p, items: [...p.items, {id: Date.now().toString(), description: '', type: 'labor', quantity: 1, unitPrice: 0}]}))} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black text-xs shadow-md">+ M. OBRA</button></div></div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-slate-900 text-white uppercase"><tr className="text-left"><th className="p-3">Tipo</th><th className="p-3">Detalle</th><th className="p-3 text-center">Cant</th><th className="p-3 bg-orange-700 w-72">Compra (Costo/Prov/Comp/Pago)</th><th className="p-3 text-right">Venta</th><th className="p-3 text-right">Subtotal</th><th className="w-10"></th></tr></thead>
                    <tbody className="divide-y border-b">
                        {formData.items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-black text-slate-400">{item.type === 'part' ? 'REP' : 'M.O.'}</td>
                                <td className="p-3"><input type="text" value={item.description} onChange={e => handleItemUpdate(item.id, 'description', capitalize(e.target.value))} className="w-full p-1 border rounded uppercase font-bold" /></td>
                                <td className="p-3"><input type="number" value={item.quantity} onChange={e => handleItemUpdate(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-12 p-1 border rounded text-center font-bold" /></td>
                                <td className="p-3 bg-orange-50 space-y-1">
                                    {item.type === 'part' && (
                                        <>
                                            <div className="flex gap-1"><input type="text" placeholder="Costo" value={formatNumber(item.costPrice)} onChange={e => handleItemUpdate(item.id, 'costPrice', parseNumber(e.target.value))} className="w-1/2 p-1 border rounded font-black text-orange-700" /><select value={item.purchaseDocType} onChange={e => handleItemUpdate(item.id, 'purchaseDocType', e.target.value)} className="w-1/2 p-1 border rounded font-bold"><option value="boleta">Boleta</option><option value="factura">Factura</option><option value="cotizacion">N/A</option></select></div>
                                            <div className="flex gap-1"><input type="text" placeholder="Proveedor" value={item.provider} onChange={e => handleItemUpdate(item.id, 'provider', capitalize(e.target.value))} className="w-1/2 p-1 border rounded text-[9px]" /><input type="text" placeholder="Comprador" value={item.buyer} onChange={e => handleItemUpdate(item.id, 'buyer', capitalize(e.target.value))} className="w-1/2 p-1 border rounded text-[9px]" /></div>
                                            <label className="flex items-center gap-1 text-[10px] font-black text-orange-900 cursor-pointer"><input type="checkbox" checked={item.isBuyerPaid} onChange={e => handleItemUpdate(item.id, 'isBuyerPaid', e.target.checked)} className="w-4 h-4" /> ¿PAGADO AL COMPRADOR? {item.paymentDate && <span className="text-emerald-600">({item.paymentDate})</span>}</label>
                                        </>
                                    )}
                                </td>
                                <td className="p-3"><input type="text" value={formatNumber(item.unitPrice)} onChange={e => handleItemUpdate(item.id, 'unitPrice', parseNumber(e.target.value))} className="w-full p-1 border rounded text-right font-black text-blue-700" /></td>
                                <td className="p-3 text-right font-black text-lg">${((item.unitPrice * item.quantity) - (item.discount || 0)).toLocaleString()}</td>
                                <td className="p-3 text-center"><button type="button" onClick={() => setFormData(p => ({...p, items: p.items.filter(i => i.id !== item.id)}))} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Resumen Neto/IVA/Total corregido */}
            <div className="mt-4 flex flex-col items-end gap-1">
                <div className="text-xs font-bold text-gray-400 flex gap-4">
                  <span>NETO: ${Math.round(totalNet).toLocaleString()}</span>
                  <span>IVA (19%): ${Math.round(totalIva).toLocaleString()}</span>
                </div>
                <div className="w-72 bg-slate-900 text-white p-5 rounded-2xl shadow-xl text-right">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total a Pagar Cliente</p>
                    <p className="text-4xl font-black font-mono tracking-tighter italic text-blue-400">
                        ${totalGross.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center">
            <h3 className="font-bold self-start mb-6 uppercase italic">Inspección de Daños Exteriores</h3>
            <CarCroquis points={formData.damagePoints || []} onAddPoint={(x,y) => setFormData(p => ({...p, damagePoints: [...(p.damagePoints || []), {id: Date.now().toString(), x, y, type: 'dent'}]}))} onRemovePoint={id => setFormData(p => ({...p, damagePoints: (p.damagePoints || []).filter(pt => pt.id !== id)}))} />
            <p className="text-[10px] text-gray-400 mt-4 italic">Haz clic sobre la silueta del vehículo para marcar abolladuras o rayas detectadas en la recepción.</p>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 z-50"><button type="button" onClick={onCancel} className="px-6 py-3 border bg-white rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-all">CANCELAR</button><button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-xl font-black shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"><Save className="w-6 h-6" /> GUARDAR ORDEN</button></div>
      </form>
    </div>
  );
};
