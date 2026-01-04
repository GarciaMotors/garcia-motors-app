
import React, { useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calculator, Clock, CheckCircle, Search, Phone, Car, Users, Wallet, XCircle, FileSpreadsheet, Download, Upload, Eye, EyeOff, CalendarClock, Bell, ShieldAlert, CalendarDays, MessageCircle, ChevronLeft, ChevronRight, Wrench, Send, Cloud, UploadCloud, DownloadCloud, Loader2, Apple, Receipt } from 'lucide-react';
import { WorkOrder, Expense, Appointment, WorkshopSettings } from '../types';
import { TAX_RATE, STATUS_COLORS, STATUS_LABELS } from '../constants';

interface DashboardProps {
  orders: WorkOrder[];
  expenses: Expense[];
  appointments?: Appointment[];
  settings: WorkshopSettings;
  onViewOt?: (id: string) => void;
  onToggleOtReimbursement?: (otId: string, itemId: string) => void;
  onToggleExpensePaid?: (id: string) => void;
  onDismissMaintenance?: (otId: string) => void;
  onRestore?: (file: File) => void;
  onPushCloud?: () => void;
  onPullCloud?: () => void;
  isSyncing?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    orders, expenses, appointments = [], settings,
    onViewOt, onToggleOtReimbursement, onToggleExpensePaid, onDismissMaintenance, onRestore,
    onPushCloud, onPullCloud, isSyncing
}) => {
  
  const today = new Date().toISOString().split('T')[0];
  const [clientSearch, setClientSearch] = useState('');
  const [showFinancials, setShowFinancials] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrevMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() - 1); return d; });
  const handleNextMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + 1); return d; });

  const selectedMonthStr = selectedDate.toISOString().slice(0, 7);
  const monthLabel = selectedDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const sendWhatsApp = (phone: string, message: string) => {
      let cleanPhone = phone.replace(/\D/g, ''); 
      if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) cleanPhone = '56' + cleanPhone;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const monthlyOrders = useMemo(() => orders.filter(o => o.date.startsWith(selectedMonthStr)), [orders, selectedMonthStr]);
  const monthlyExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(selectedMonthStr)), [expenses, selectedMonthStr]);
  const activeOrders = orders.filter(o => o.status !== 'delivered' || (o.status === 'delivered' && o.deliveredAt === today));

  const totalSalesGross = monthlyOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0), 0);
  const totalExpensesReal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0) + monthlyOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity * (i.costPrice || 0)), 0), 0);
  
  // Cálculo de IVA F29 Estimado (Corrected)
  const ivaVentas = totalSalesGross - (totalSalesGross / (1 + TAX_RATE));
  const ivaCompras = totalExpensesReal - (totalExpensesReal / (1 + TAX_RATE));
  const ivaEstimado = Math.max(0, ivaVentas - ivaCompras);

  const realProfit = monthlyOrders.reduce((sum, o) => {
      const totalSale = o.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
      const totalCost = o.items.reduce((s, i) => s + (i.quantity * (i.costPrice || 0)), 0);
      const effectiveIncome = o.documentType === 'cotizacion' ? totalSale : totalSale / (1 + TAX_RATE);
      return sum + (effectiveIncome - totalCost);
  }, 0) - monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const uniqueClients = useMemo(() => {
      const map = new Map();
      orders.forEach(o => { if (!map.has(o.vehicle.plate)) map.set(o.vehicle.plate, { name: o.client.name, phone: o.client.phone, vehicle: `${o.vehicle.brand} ${o.vehicle.model}`, plate: o.vehicle.plate }); });
      return Array.from(map.values()).filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.plate.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [orders, clientSearch]);

  const formatCurrency = (amount: number) => showFinancials ? `$${Math.round(amount).toLocaleString()}` : '$ ••••••';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* SECCIÓN NUBE */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                  <Cloud className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="font-bold text-lg leading-none">Sincronización Cloud</h3>
                  <p className="text-xs text-blue-100 mt-1">
                      {settings.syncCode ? `Código Activo: ${settings.syncCode}` : "Sin vincular nube"}
                  </p>
              </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <button onClick={onPullCloud} disabled={isSyncing} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold transition">
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />} Bajar
              </button>
              <button onClick={onPushCloud} disabled={isSyncing} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition">
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Subir
              </button>
          </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
            <button onClick={() => setShowFinancials(!showFinancials)} className="text-gray-400">
                {showFinancials ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-slate-600 text-white px-3 py-1.5 rounded">Restaurar JSON</button>
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onRestore && onRestore(e.target.files[0])} className="hidden" accept=".json" />
      </div>

      <div className="bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between shadow-md">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-700 rounded-full"><ChevronLeft /></button>
          <span className="text-lg font-bold capitalize">{monthLabel}</span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-700 rounded-full"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ventas (Bruto)</p>
            <h3 className="text-xl font-bold text-slate-800">{formatCurrency(totalSalesGross)}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gastos Reales</p>
            <h3 className="text-xl font-bold text-orange-600">{formatCurrency(totalExpensesReal)}</h3>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">IVA Estimado (F29)</p>
            <h3 className="text-xl font-bold text-blue-700">{formatCurrency(ivaEstimado)}</h3>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ganancia Real</p>
            <h3 className={`text-xl font-bold ${realProfit >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>{formatCurrency(realProfit)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Clock className="w-5 h-5" /> Trabajos Activos</h3>
                <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">{activeOrders.length}</span>
            </div>
            <div className="divide-y max-h-[350px] overflow-y-auto">
                {activeOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No hay trabajos activos.</div>
                ) : (
                    activeOrders.map(ot => (
                        <div key={ot.id} className="p-4 flex justify-between items-start hover:bg-gray-50 cursor-pointer border-l-4 border-l-blue-500" onClick={() => onViewOt && onViewOt(ot.id)}>
                            <div>
                                <div className="font-bold text-blue-600">#{ot.id} <span className="text-gray-900 font-medium">{ot.client.name}</span></div>
                                <div className="text-xs text-gray-500">{ot.vehicle.brand} ({ot.vehicle.plate})</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[ot.status]}`}>{STATUS_LABELS[ot.status]}</span>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Receipt className="w-5 h-5 text-orange-500" /> Gastos Recientes</h3>
                <span className="text-xs bg-orange-100 px-2 py-1 rounded-full">{monthlyExpenses.length}</span>
            </div>
            <div className="divide-y max-h-[350px] overflow-y-auto">
                {monthlyExpenses.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Sin gastos registrados este mes.</div>
                ) : (
                    monthlyExpenses.slice(0, 10).map(exp => (
                        <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <div className="text-sm font-bold text-gray-800">{exp.description}</div>
                                <div className="text-[10px] text-gray-500">{exp.date} • {exp.buyerName}</div>
                            </div>
                            <div className="text-sm font-bold text-orange-600">
                                {formatCurrency(exp.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Contactos Rápidos</h3>
             <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Buscar por cliente o patente..." className="w-full pl-9 py-2 border rounded-md" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
             </div>
             <div className="overflow-y-auto max-h-[250px] divide-y">
                 {uniqueClients.map((c, idx) => (
                     <div key={idx} className="py-3 flex justify-between items-center">
                         <div>
                             <p className="font-semibold text-sm">{c.name}</p>
                             <p className="text-xs text-gray-500">{c.plate}</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => sendWhatsApp(c.phone, "Hola")} className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">WA</button>
                            <a href={`tel:${c.phone}`} className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold">Llamar</a>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    </div>
  );
};
