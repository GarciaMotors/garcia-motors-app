
import React, { useState, useMemo } from 'react';
import { Eye, Edit, Trash2, Search, Printer, EyeOff, Filter, Wrench, User, Car, Clock, X } from 'lucide-react';
import { WorkOrder } from '../types';
import { STATUS_COLORS, STATUS_LABELS, TAX_RATE } from '../constants';

interface OtListProps {
  orders: WorkOrder[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const OtList: React.FC<OtListProps> = ({ orders, onView, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMechanic, setFilterMechanic] = useState('');
  const [filterPlate, setFilterPlate] = useState('');
  const [filterDiagnosis, setFilterDiagnosis] = useState('');
  const [showFinancials, setShowFinancials] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(ot => {
      const matchesGlobal = searchTerm === '' || 
                            ot.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ot.id.includes(searchTerm);
      
      const matchesStatus = filterStatus === '' || ot.status === filterStatus;
      const matchesMechanic = filterMechanic === '' || (ot.mechanic && ot.mechanic.toLowerCase().includes(filterMechanic.toLowerCase()));
      const matchesPlate = filterPlate === '' || ot.vehicle.plate.toLowerCase().includes(filterPlate.toLowerCase());
      const matchesDiagnosis = filterDiagnosis === '' || (ot.description && ot.description.toLowerCase().includes(filterDiagnosis.toLowerCase()));
      
      return matchesGlobal && matchesStatus && matchesMechanic && matchesPlate && matchesDiagnosis;
    });
  }, [orders, searchTerm, filterStatus, filterMechanic, filterPlate, filterDiagnosis]);

  const mechanicsList = useMemo(() => {
    const list = orders.map(o => o.mechanic).filter(Boolean);
    return Array.from(new Set(list));
  }, [orders]);

  const calculateRealProfit = (ot: WorkOrder) => {
      const totalSale = ot.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const totalCost = ot.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);
      let effectiveIncome = ot.documentType === 'cotizacion' ? totalSale : totalSale / (1 + TAX_RATE);
      return effectiveIncome - totalCost;
  };

  const formatCurrency = (amount: number) => {
      if (!showFinancials) return '$ •••••';
      return `$${Math.round(amount).toLocaleString()}`;
  };

  const clearFilters = () => {
      setSearchTerm('');
      setFilterStatus('');
      setFilterMechanic('');
      setFilterPlate('');
      setFilterDiagnosis('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete(id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Órdenes de Trabajo</h2>
        <div className="flex gap-2">
            <button onClick={clearFilters} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"><X className="w-4 h-4" /> Limpiar</button>
            <button onClick={() => setShowFinancials(!showFinancials)} className="p-2 bg-white border rounded-xl shadow-sm text-slate-400 hover:text-blue-600 transition-all">{showFinancials ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Folio / Cliente</label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input type="text" className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div><label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Patente</label><input type="text" className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs uppercase" placeholder="JXTY85" value={filterPlate} onChange={(e) => setFilterPlate(e.target.value)} /></div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Mecánico</label>
            <select value={filterMechanic} onChange={e => setFilterMechanic(e.target.value)} className="block w-full p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white">
              <option value="">Todos</option>
              {mechanicsList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Diagnóstico</label><input type="text" className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs" placeholder="Palabra clave..." value={filterDiagnosis} onChange={(e) => setFilterDiagnosis(e.target.value)} /></div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Estado</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="block w-full p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white">
              <option value="">Todos</option>
              {Object.keys(STATUS_LABELS).map(k => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
            </select>
          </div>
      </div>

      <div className="bg-white shadow-sm overflow-x-auto rounded-2xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Folio / Fecha</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Vehículo</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Venta Total</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-emerald-600 uppercase tracking-wider">Utilidad</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">No se encontraron órdenes.</td></tr>
            ) : (
              filteredOrders.map((ot) => (
                  <tr key={ot.id} onClick={() => onView(ot.id)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-blue-600">#{ot.id}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{ot.date}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-800 uppercase truncate max-w-[120px]">{ot.client.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{ot.client.phone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-xs font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block uppercase font-mono tracking-tighter text-slate-700">{ot.vehicle.plate}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">{ot.vehicle.brand} {ot.vehicle.model}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-slate-900">{formatCurrency(ot.items.reduce((s,i) => s + (i.unitPrice * i.quantity), 0))}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-emerald-600">{formatCurrency(calculateRealProfit(ot))}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STATUS_COLORS[ot.status]}`}>
                        {STATUS_LABELS[ot.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onView(ot.id)} className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all"><Printer className="w-5 h-5" /></button>
                        <button onClick={() => onEdit(ot.id)} className="text-slate-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition-all"><Edit className="w-5 h-5" /></button>
                        <button 
                          onClick={(e) => handleDelete(e, ot.id)} 
                          className="text-slate-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
