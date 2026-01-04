
import React, { useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calculator, Clock, CheckCircle, Search, Phone, Car, Users, Wallet, XCircle, FileSpreadsheet, Download, Upload, Eye, EyeOff, CalendarClock, Bell, ShieldAlert, CalendarDays, MessageCircle, ChevronLeft, ChevronRight, Wrench, Send, Cloud, UploadCloud, DownloadCloud, Loader2, Apple } from 'lucide-react';
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
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'pending'>('pending');
  const [showFinancials, setShowFinancials] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrevMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() - 1); return d; });
  const handleNextMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + 1); return d; });

  const selectedMonthStr = selectedDate.toISOString().slice(0, 7);
  const monthLabel = selectedDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const isCurrentMonth = selectedMonthStr === new Date().toISOString().slice(0, 7);

  const sendWhatsApp = (phone: string, message: string) => {
      let cleanPhone = phone.replace(/\D/g, ''); 
      if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) cleanPhone = '56' + cleanPhone;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const monthlyOrders = useMemo(() => orders.filter(o => o.date.startsWith(selectedMonthStr)), [orders, selectedMonthStr]);
  const monthlyExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(selectedMonthStr)), [expenses, selectedMonthStr]);
  const monthlyAppointments = useMemo(() => appointments.filter(apt => apt.date.startsWith(selectedMonthStr)).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()), [appointments, selectedMonthStr]);
  const monthlyMaintenances = useMemo(() => orders.filter(o => o.isMaintenance && o.nextMaintenanceDate?.startsWith(selectedMonthStr) && !o.maintenanceAlertDismissed).sort((a,b) => new Date(a.nextMaintenanceDate!).getTime() - new Date(b.nextMaintenanceDate!).getTime()), [orders, selectedMonthStr]);
  const activeOrders = orders.filter(o => o.status !== 'delivered' || (o.status === 'delivered' && o.deliveredAt === today));
  const remindersForTomorrow = useMemo(() => {
      const tom = new Date(); tom.setDate(tom.getDate() + 1); const tomStr = tom.toISOString().split('T')[0];
      return appointments.filter(apt => apt.date === tomStr && apt.status !== 'cancelled');
  }, [appointments]);

  const totalSalesGross = monthlyOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0), 0);
  const totalSalesGrossTaxable = monthlyOrders.filter(o => o.documentType !== 'cotizacion').reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0), 0);
  const totalExpensesReal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0) + monthlyOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity * (i.costPrice || 0)), 0), 0);
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

  const allDebts = useMemo(() => {
      const general = expenses.map(e => ({ type: 'general', id: e.id, parentId: null, date: e.date, description: e.description, amount: e.amount, buyer: e.buyerName, isPaid: e.isPaid, label: e.category === 'insumos' ? 'Insumos Taller' : 'Gasto General' }));
      const internal = orders.flatMap(ot => ot.items.filter(i => (i.type === 'expense' || i.costPrice! > 0) && i.buyer).map(i => ({ type: 'ot_item', id: i.id, parentId: ot.id, date: ot.date, description: `OT #${ot.id}: ${i.description}`, amount: (i.costPrice || 0) * i.quantity, buyer: i.buyer, isPaid: i.isReimbursed || false, label: `OT #${ot.id}` })));
      return [...general, ...internal].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, orders]);

  const filteredDebts = allDebts.filter(d => expenseFilter === 'all' || !d.isPaid);
  const totalDebtAmount = allDebts.filter(d => !d.isPaid).reduce((sum, d) => sum + d.amount, 0);

  const formatCurrency = (amount: number) => showFinancials ? `$${Math.round(amount).toLocaleString()}` : '$ ••••••';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* SECCIÓN NUBE GARCIA MOTORS */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                  <Cloud className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="font-bold text-lg leading-none">Nube Garcia Motors</h3>
                  <p className="text-xs text-blue-100 mt-1">
                      {settings.syncCode 
                        ? `Sincronizado con: ${settings.syncCode}` 
                        : "Sincroniza tus datos entre el PC y el Celular"}
                  </p>
                  {settings.lastSync && (
                      <p className="text-[10px] text-blue-200">Última sincronización: {settings.lastSync}</p>
                  )}
              </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <button 
                  onClick={onPullCloud}
                  disabled={isSyncing || !settings.syncCode}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
              >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                  Bajar Datos
              </button>
              <button 
                  onClick={onPushCloud}
                  disabled={isSyncing || !settings.syncCode}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50"
              >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  Subir a la Nube
              </button>
          </div>
      </div>

      {/* AVISO INSTALACIÓN IPHONE */}
      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-blue-800 text-xs font-medium">
              <Apple className="w-4 h-4" />
              ¿Quieres esta app en tu pantalla de inicio?
          </div>
          <p className="text-[10px] text-blue-600">
            {"Safari > Compartir > Agregar a inicio"}
          </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Panel Principal</h2>
            <button onClick={() => setShowFinancials(!showFinancials)} className="text-gray-400 hover:text-blue-600">
                {showFinancials ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
        </div>
        <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700">
                <Upload className="w-3 h-3" /> Restaurar JSON
            </button>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onRestore && onRestore(e.target.files[0])} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between mb-6 shadow-md">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-700 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
          <div className="flex flex-col items-center">
              <span className="text-sm font-light text-slate-400 uppercase tracking-widest">Resumen Mensual</span>
              <span className="text-xl font-bold capitalize">{monthLabel}</span>
          </div>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-700 rounded-full"><ChevronRight className="w-6 h-6" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Ventas (Bruto)</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalSalesGross)}</h3>
            <p className="text-xs text-emerald-600 mt-2">Ingresos del mes</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Gastos Reales</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalExpensesReal)}</h3>
            <p className="text-xs text-red-500 mt-2">Compras e Insumos</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Ganancia Real (Neto)</p>
            <h3 className={`text-2xl font-bold ${realProfit >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>{formatCurrency(realProfit)}</h3>
            <p className="text-xs text-gray-400 mt-2">Utilidad tras gastos e IVA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" /> Activos Hoy</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{activeOrders.length}</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {activeOrders.map(ot => (
                    <div key={ot.id} className="p-4 flex justify-between items-start hover:bg-gray-50 cursor-pointer border-l-4 border-l-blue-500" onClick={() => onViewOt && onViewOt(ot.id)}>
                        <div>
                            <div className="font-bold text-blue-600">#{ot.id} <span className="text-gray-900 font-medium">{ot.client.name}</span></div>
                            <div className="text-xs text-gray-500">{ot.vehicle.brand} {ot.vehicle.model} ({ot.vehicle.plate})</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[ot.status]}`}>{STATUS_LABELS[ot.status]}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Agenda Telefónica</h3>
             <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Buscar cliente..." className="w-full pl-9 pr-4 py-2 border rounded-md text-sm" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
             </div>
             <div className="overflow-y-auto max-h-[250px] divide-y divide-gray-100">
                 {uniqueClients.map((c, idx) => (
                     <div key={idx} className="py-3 flex justify-between items-center">
                         <div>
                             <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                             <p className="text-xs text-gray-500">{c.vehicle} ({c.plate})</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => sendWhatsApp(c.phone, `Hola ${c.name}`)} className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-100">WA</button>
                            <a href={`tel:${c.phone}`} className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100">Llamar</a>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};
