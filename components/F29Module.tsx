
import React, { useState, useMemo } from 'react';
import { FileText, ChevronLeft, ChevronRight, Calculator, TrendingUp, TrendingDown, DollarSign, Download, PieChart } from 'lucide-react';
import { WorkOrder, Expense } from '../types';
import { TAX_RATE } from '../constants';

interface F29ModuleProps {
  orders: WorkOrder[];
  expenses: Expense[];
}

export const F29Module: React.FC<F29ModuleProps> = ({ orders, expenses }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrevMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() - 1); return d; });
  const handleNextMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + 1); return d; });

  const selectedMonthStr = selectedDate.toISOString().slice(0, 7);
  const monthLabel = selectedDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    // 1. IVA Débito (Ventas: Boletas y Facturas del Taller)
    const monthlyOrders = orders.filter(o => o.date.startsWith(selectedMonthStr) && o.documentType !== 'cotizacion');
    
    let totalVentasBrutas = 0;
    monthlyOrders.forEach(ot => {
        totalVentasBrutas += ot.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
    });

    const ventasNetas = totalVentasBrutas / (1 + TAX_RATE);
    const ivaDebito = totalVentasBrutas - ventasNetas;

    // 2. IVA Crédito (Compras con Factura)
    // Filtramos gastos manuales y repuestos de OTs que tengan Documento 'factura'
    const manualFacturas = expenses.filter(e => e.date.startsWith(selectedMonthStr) && e.documentType === 'factura');
    const partsFacturas = orders.flatMap(ot => 
        ot.items.filter(i => ot.date.startsWith(selectedMonthStr) && i.type === 'part' && i.purchaseDocType === 'factura')
        .map(i => (i.costPrice || 0) * i.quantity)
    );

    const totalComprasFacturaBrutas = manualFacturas.reduce((s, e) => s + e.amount, 0) + partsFacturas.reduce((s, a) => s + a, 0);
    const comprasNetas = totalComprasFacturaBrutas / (1 + TAX_RATE);
    const ivaCredito = totalComprasFacturaBrutas - comprasNetas;

    // 3. Resultados
    const ppmRate = 0.01; // 1% aproximado
    const ppmAmount = ventasNetas * ppmRate;
    const ivaAPagar = Math.max(0, ivaDebito - ivaCredito);
    const remanente = Math.max(0, ivaCredito - ivaDebito);

    return {
        totalVentasBrutas,
        ventasNetas,
        ivaDebito,
        totalComprasFacturaBrutas,
        comprasNetas,
        ivaCredito,
        ppmAmount,
        ivaAPagar,
        remanente,
        totalAF29: ivaAPagar + ppmAmount
    };
  }, [orders, expenses, selectedMonthStr]);

  const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString()}`;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-3 rounded-2xl shadow-lg"><FileText className="w-8 h-8 text-white" /></div>
              <div>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">Resumen Formulario F29</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cálculo Mensual de Impuestos (IVA/PPM)</p>
              </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm font-black uppercase text-slate-800 px-4 min-w-[150px] text-center">{monthLabel}</span>
              <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                  <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2 tracking-widest border-b pb-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> IVA Débito (Ventas)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Ventas Brutas (Boletas + Facturas)</p>
                          <p className="text-3xl font-black text-slate-800">{formatCurrency(stats.totalVentasBrutas)}</p>
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-dashed pb-2">
                              <span className="text-xs font-bold text-gray-500">Monto Neto:</span>
                              <span className="font-bold text-slate-700">{formatCurrency(stats.ventasNetas)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-emerald-600">IVA Débito (19%):</span>
                              <span className="text-xl font-black text-emerald-600">{formatCurrency(stats.ivaDebito)}</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                  <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2 tracking-widest border-b pb-2"><TrendingDown className="w-4 h-4 text-red-500" /> IVA Crédito (Compras con Factura)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Compras Facturadas (Insumos/Gastos)</p>
                          <p className="text-3xl font-black text-slate-800">{formatCurrency(stats.totalComprasFacturaBrutas)}</p>
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-dashed pb-2">
                              <span className="text-xs font-bold text-gray-500">Monto Neto:</span>
                              <span className="font-bold text-slate-700">{formatCurrency(stats.comprasNetas)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-red-600">IVA Crédito (19%):</span>
                              <span className="text-xl font-black text-red-600">{formatCurrency(stats.ivaCredito)}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border-t-8 border-blue-600 flex flex-col justify-between h-full min-h-[400px]">
                  <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8 border-b border-white/10 pb-4">Proyección Pago F29</h3>
                      
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase">Diferencia IVA:</span>
                              <span className="font-bold text-white">{formatCurrency(stats.ivaDebito - stats.ivaCredito)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase">PPM Mensual (1%):</span>
                              <span className="font-bold text-yellow-400">{formatCurrency(stats.ppmAmount)}</span>
                          </div>
                          {stats.remanente > 0 && (
                            <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
                                <p className="text-[9px] font-black uppercase text-emerald-400 mb-1">Remanente para próximo mes</p>
                                <p className="text-xl font-black text-emerald-500">{formatCurrency(stats.remanente)}</p>
                            </div>
                          )}
                      </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-white/10">
                      <p className="text-[10px] font-black uppercase text-blue-400 mb-2">Total Estimado a Pagar</p>
                      <div className="flex justify-between items-end">
                          <p className="text-5xl font-black italic tracking-tighter">{formatCurrency(stats.totalAF29)}</p>
                          <DollarSign className="w-8 h-8 text-blue-500 mb-2" />
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Calculator className="w-5 h-5" /></div>
          <div>
              <h4 className="font-black text-blue-800 text-xs uppercase tracking-widest mb-1">Nota sobre este cálculo</h4>
              <p className="text-[11px] text-blue-600 leading-relaxed font-medium">Este resumen considera solo las ventas efectuadas (Boleta/Factura) y las compras de insumos registradas con documento 'Factura'. El monto del PPM se calcula como el 1% de las ventas netas. Use estos datos como referencia previa a su declaración mensual en el portal del SII.</p>
          </div>
      </div>
    </div>
  );
};
