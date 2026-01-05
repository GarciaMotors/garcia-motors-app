
import React, { useState } from 'react';
import { PackageSearch, Search, Car, User, Store, Filter, History, CheckCircle, Clock } from 'lucide-react';
import { WorkOrder } from '../types';

interface PartsListProps {
  orders: WorkOrder[];
}

export const PartsList: React.FC<PartsListProps> = ({ orders }) => {
  const [filterName, setFilterName] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const allParts = orders.flatMap(ot => 
    ot.items
      .filter(item => item.type === 'part')
      .map(item => ({
        id: item.id,
        otId: ot.id,
        date: ot.date,
        name: item.description,
        internalPrice: item.costPrice || 0,
        sellPrice: item.unitPrice,
        vehicle: ot.vehicle,
        buyer: item.buyer || 'Taller',
        provider: item.provider || 'N/A',
        quantity: item.quantity,
        isBuyerPaid: item.isBuyerPaid
      }))
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredParts = allParts.filter(part => {
      const matchName = filterName === '' || part.name.toLowerCase().includes(filterName.toLowerCase());
      const matchModel = filterModel === '' || 
                         part.vehicle.model.toLowerCase().includes(filterModel.toLowerCase()) || 
                         part.vehicle.brand.toLowerCase().includes(filterModel.toLowerCase());
      const matchYear = filterYear === '' || part.vehicle.year.toString().includes(filterYear);
      
      return matchName && matchModel && matchYear;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 italic uppercase tracking-tighter">
                <History className="w-8 h-8 text-blue-600" />
                Historial de Repuestos
            </h2>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Descripción</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="text" className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500" placeholder="Ej: Pastillas..." value={filterName} onChange={(e) => setFilterName(e.target.value)} />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Modelo</label>
                <div className="relative">
                    <Car className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="text" className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500" placeholder="Ej: Kia Rio..." value={filterModel} onChange={(e) => setFilterModel(e.target.value)} />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Año</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="text" className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500" placeholder="Ej: 2020" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
                </div>
            </div>
        </div>

        <div className="bg-white shadow-sm overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">OT / Fecha</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Repuesto</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehículo</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor / Comprador</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Valores</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {filteredParts.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">No se encontraron registros.</td></tr>
                    ) : (
                        filteredParts.map((part) => (
                            <tr key={`${part.otId}-${part.id}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-black text-blue-600 tracking-tighter italic">OT #{part.otId}</div>
                                    <div className="text-[10px] text-gray-400 font-bold">{part.date}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900 uppercase tracking-tight">{part.name}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase">Cantidad: {part.quantity}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs font-bold text-gray-700 uppercase">{part.vehicle.brand} {part.vehicle.model}</div>
                                    <div className="text-[10px] text-gray-400 font-mono font-bold uppercase">{part.vehicle.plate}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1"><Store className="w-3 h-3 text-blue-400"/> {part.provider}</div>
                                        <div className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                                            <User className="w-3 h-3 text-gray-300"/> {part.buyer}
                                            {part.isBuyerPaid ? (
                                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded flex items-center gap-0.5 font-bold uppercase"><CheckCircle className="w-2 h-2"/> Pagado</span>
                                            ) : (
                                                <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded flex items-center gap-0.5 font-bold uppercase animate-pulse"><Clock className="w-2 h-2"/> Pendiente</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                                    <div className="text-[10px] text-orange-600 font-bold">COSTO: ${part.internalPrice.toLocaleString()}</div>
                                    <div className="text-sm font-black text-slate-900">VENTA: ${part.sellPrice.toLocaleString()}</div>
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
