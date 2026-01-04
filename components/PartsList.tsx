import React, { useState } from 'react';
import { PackageSearch, Search, Car, User, Store, Filter, History } from 'lucide-react';
import { WorkOrder } from '../types';

interface PartsListProps {
  orders: WorkOrder[];
}

export const PartsList: React.FC<PartsListProps> = ({ orders }) => {
  const [filterName, setFilterName] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Derived list of ALL parts and expenses from all OTs
  const allParts = orders.flatMap(ot => 
    ot.items
      .filter(item => item.type === 'expense' || item.type === 'part') // Include Parts and Expenses
      .map(item => ({
        id: item.id,
        otId: ot.id,
        date: ot.date,
        type: item.type, 
        name: item.description,
        internalPrice: item.costPrice || 0,
        sellPrice: item.unitPrice,
        vehicle: ot.vehicle,
        buyer: item.buyer || 'N/A',
        provider: item.provider || 'N/A',
        quantity: item.quantity
      }))
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter based on search inputs
  const filteredParts = allParts.filter(part => {
      const matchName = filterName === '' || part.name.toLowerCase().includes(filterName.toLowerCase());
      const matchModel = filterModel === '' || 
                         part.vehicle.model.toLowerCase().includes(filterModel.toLowerCase()) || 
                         part.vehicle.brand.toLowerCase().includes(filterModel.toLowerCase());
      const matchYear = filterYear === '' || part.vehicle.year.toString().includes(filterYear);
      
      return matchName && matchModel && matchYear;
  });

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <History className="w-8 h-8 text-blue-600" />
                Historial Completo de Repuestos y Gastos
            </h2>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Buscar por Descripción</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Combustible, Pastillas..."
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Buscar por Modelo / Marca</label>
                <div className="relative">
                    <Car className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Chevrolet Sail..."
                        value={filterModel}
                        onChange={(e) => setFilterModel(e.target.value)}
                    />
                </div>
            </div>

            <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Año Vehículo</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: 2018"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / OT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datos Compra</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParts.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                                No se encontraron items con los filtros seleccionados.
                            </td>
                        </tr>
                    ) : (
                        filteredParts.map((part) => (
                            <tr key={`${part.otId}-${part.id}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-blue-600">OT #{part.otId}</div>
                                    <div className="text-xs text-gray-500">{part.date}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                            part.type === 'expense' 
                                            ? 'bg-red-100 text-red-800 border-red-200' 
                                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        }`}>
                                            {part.type === 'expense' ? 'Gasto Interno' : 'Venta Repuesto'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">{part.name}</div>
                                    <div className="text-xs text-gray-500">Cant: {part.quantity}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Car className="w-4 h-4 text-gray-400" />
                                        <div className="text-sm text-gray-700">
                                            {part.vehicle.brand} {part.vehicle.model}
                                            <span className="ml-1 text-xs bg-gray-100 px-1 rounded border">{part.vehicle.year || 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        {part.provider && part.provider !== 'N/A' ? (
                                            <span className="text-xs flex items-center gap-1 text-gray-600" title="Proveedor">
                                                <Store className="w-3 h-3 text-blue-400" /> {part.provider}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Sin proveedor</span>
                                        )}
                                        <span className="text-xs flex items-center gap-1 text-gray-500" title="Comprador">
                                            <User className="w-3 h-3 text-gray-400" /> {part.buyer}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {part.internalPrice > 0 && (
                                        <div className="text-xs text-red-600" title="Costo Interno">
                                            Costo: ${part.internalPrice.toLocaleString()}
                                        </div>
                                    )}
                                    {part.sellPrice > 0 && (
                                        <div className="text-sm font-bold text-emerald-700" title="Precio Venta">
                                            Venta: ${part.sellPrice.toLocaleString()}
                                        </div>
                                    )}
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