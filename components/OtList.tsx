import React, { useState } from 'react';
import { Eye, Edit, Trash2, Search, Printer, EyeOff, TrendingUp, FileSpreadsheet, ShieldAlert } from 'lucide-react';
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
  const [showFinancials, setShowFinancials] = useState(false);

  const filteredOrders = orders.filter(ot => 
    ot.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.id.includes(searchTerm) ||
    (ot.mechanic && ot.mechanic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateTotal = (ot: WorkOrder) => {
    const total = ot.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return total;
  };

  const calculateRealProfit = (ot: WorkOrder) => {
      // 1. Total Venta (Lo que paga el cliente)
      const totalSale = ot.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      // 2. Costo Interno Total (Lo que gastamos en repuestos/insumos)
      // Se resta el gasto completo (Bruto) porque es dinero que salió de la caja.
      const totalCost = ot.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

      // 3. Ingreso Efectivo (Depende si pagamos IVA o no)
      let effectiveIncome = 0;

      if (ot.documentType === 'cotizacion') {
          // Si es Cotización (informal/sin documento fiscal de venta):
          // Ganancia = Total cobrado - Gasto Interno
          effectiveIncome = totalSale; 
      } else {
          // Si es Boleta o Factura:
          // Ganancia = (Total cobrado - IVA F29) - Gasto Interno
          // Matemáticamente: Total Neto - Gasto Interno
          effectiveIncome = totalSale / (1 + TAX_RATE);
      }

      return effectiveIncome - totalCost;
  };

  const formatCurrency = (amount: number) => {
      if (!showFinancials) return '$ •••••';
      return `$${Math.round(amount).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Listado de Órdenes (OT)</h2>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar por cliente, patente, mecánico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT / Fecha</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo / Patente</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Diagnóstico / Mecánico</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                      Monto Total
                      <button onClick={() => setShowFinancials(!showFinancials)} className="text-gray-400 hover:text-blue-600">
                          {showFinancials ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                  </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Ganancia Real
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-500 italic">
                  No se encontraron órdenes de trabajo que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ot) => {
                const total = calculateTotal(ot);
                const profit = calculateRealProfit(ot);
                
                return (
                  <tr key={ot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600 flex items-center gap-1">
                          #{ot.id}
                          {ot.otType === 'warranty' && (
                              <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded border border-orange-200" title="Garantía">G</span>
                          )}
                      </div>
                      <div className="text-xs text-gray-500">{ot.date}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ot.client.name}</div>
                      <div className="text-xs text-gray-500">{ot.client.phone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ot.vehicle.brand} {ot.vehicle.model}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 uppercase">
                        {ot.vehicle.plate}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {ot.otType === 'warranty' && ot.parentOtId && (
                           <div className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1">
                               <ShieldAlert className="w-3 h-3" /> Ref: OT #{ot.parentOtId}
                           </div>
                      )}
                      <div className="text-sm text-gray-500 line-clamp-2" title={ot.description}>
                        {ot.description || "Sin descripción"}
                      </div>
                      {ot.mechanic && (
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                              Mec: {ot.mechanic}
                          </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                         {formatCurrency(total)}
                      </div>
                      <div className="text-xs text-gray-400">
                          {ot.documentType === 'cotizacion' ? 'Cotiz.' : ot.documentType === 'factura' ? 'Factura' : 'Boleta'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap bg-emerald-50/30">
                      <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                         {formatCurrency(profit)}
                         {showFinancials && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-gray-400">
                          {ot.documentType === 'cotizacion' ? '(S/Descuento F29)' : '(Menos IVA y Gastos)'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[ot.status]}`}>
                        {STATUS_LABELS[ot.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => onView(ot.id)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Ver detalles / Imprimir PDF"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => onView(ot.id)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Ver detalles"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => onEdit(ot.id)}
                            className="text-gray-400 hover:text-green-600 p-1"
                            title="Editar"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => onDelete(ot.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Eliminar"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};