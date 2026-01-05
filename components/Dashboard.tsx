
import React, { useState, useMemo, useRef } from 'react';
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight, ShieldCheck, Download, Upload, CalendarDays, Wrench, Package, Clock, User, CheckCircle, TrendingUp, DollarSign, LayoutGrid, ListTodo, CarFront, Phone, PhoneCall, History, Wallet, CalendarClock, ChevronRight as ChevronIcon, FileText } from 'lucide-react';
import { WorkOrder, Expense, Appointment, WorkshopSettings, ExpenseCategory } from '../types';
import { TAX_RATE, STATUS_COLORS, STATUS_LABELS } from '../constants';

interface DashboardProps {
  orders: WorkOrder[];
  expenses: Expense[];
  appointments?: Appointment[];
  settings: WorkshopSettings;
  onViewOt?: (id: string) => void;
  onBackup?: () => void;
  onRestore?: (file: File) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    orders, expenses, appointments = [], settings,
    onViewOt, onBackup, onRestore
}) => {
  const [showFinancials, setShowFinancials] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [phoneFilter, setPhoneFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrevMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() - 1); return d; });
  const handleNextMonth = () => setSelectedDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + 1); return d; });

  const selectedMonthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const monthLabel = selectedDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    const monthlyOrders = orders.filter(o => o.date && o.date.startsWith(selectedMonthStr));
    const taxOrders = monthlyOrders.filter(o => o.documentType !== 'cotizacion');
    const manualItems = expenses.filter(e => e.date && e.date.startsWith(selectedMonthStr));
    const otPartsCosts = monthlyOrders.flatMap(ot => 
        ot.items.filter(i => i.type === 'part' && (i.costPrice || 0) > 0)
        .map(i => (i.costPrice || 0) * i.quantity)
    );
    const totalGastado = manualItems.reduce((s, e) => s + (e.amount || 0), 0) + otPartsCosts.reduce((s, a) => s + a, 0);

    let ventasBrutasTax = 0;
    taxOrders.forEach(ot => {
        ventasBrutasTax += ot.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
    });
    const ventasNetasTax = ventasBrutasTax / (1 + TAX_RATE);
    const ivaDebito = ventasBrutasTax - ventasNetasTax;

    const manualFacturas = manualItems.filter(e => e.documentType === 'factura');
    const otFacturas = monthlyOrders.flatMap(ot => 
        ot.items.filter(i => i.type === 'part' && i.purchaseDocType === 'factura')
        .map(i => (i.costPrice || 0) * i.quantity)
    );
    const totalComprasFactura = manualFacturas.reduce((s, e) => s + (e.amount || 0), 0) + otFacturas.reduce((s, a) => s + a, 0);
    const comprasNetasTax = totalComprasFactura / (1 + TAX_RATE);
    const ivaCredito = totalComprasFactura - comprasNetasTax;

    const ppm = ventasNetasTax * 0.01;
    const f29Total = Math.max(0, ivaDebito - ivaCredito) + ppm;
    const ventasTotalesMes = monthlyOrders.reduce((s,o) => s + o.items.reduce((si,i) => si + (i.unitPrice * i.quantity), 0), 0);

    return {
        ventasBrutas: ventasTotalesMes,
        gastos: totalGastado,
        f29: f29Total
    };
  }, [orders, expenses, selectedMonthStr]);

  const allMixedExpenses = useMemo(() => {
    const manual = expenses
      .filter(e => e.date && e.date.startsWith(selectedMonthStr))
      .map(e => ({ date: e.date, description: e.description, amount: e.amount, type: 'MANUAL' }));

    const parts = orders
      .filter(o => o.date && o.date.startsWith(selectedMonthStr))
      .flatMap(ot => 
        ot.items.filter(i => i.type === 'part' && (i.costPrice || 0) > 0)
        .map(i => ({
            date: ot.date,
            description: `REP: ${i.description} (OT #${ot.id})`,
            amount: (i.costPrice || 0) * i.quantity,
            type: 'REPUESTO'
        }))
      );

    return [...manual, ...parts].sort((a,b) => b.date.localeCompare(a.date));
  }, [expenses, orders, selectedMonthStr]);

  const phoneBook = useMemo(() => {
    const contactsMap = new Map();
    orders.forEach(o => {
      if (o.client.phone) contactsMap.set(o.client.phone, { name: o.client.name, phone: o.client.phone });
    });
    return Array.from(contactsMap.values())
      .filter(c => c.name.toLowerCase().includes(phoneFilter.toLowerCase()) || c.phone.includes(phoneFilter))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orders, phoneFilter]);

  const workshopFlow = useMemo(() => {
    return orders.filter(ot => {
        if (ot.status !== 'delivered') return true;
        return ot.deliveredAt === todayStr;
    }).sort((a, b) => b.id.localeCompare(a.id));
  }, [orders, todayStr]);

  const upcomingAppointments = useMemo(() => {
      return appointments
        .filter(a => a.status !== 'cancelled' && a.date >= todayStr)
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
        .slice(0, 15);
  }, [appointments, todayStr]);

  const formatCurrency = (val: number) => showFinancials ? `$${Math.round(val || 0).toLocaleString()}` : '$ •••••';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-slate-900 p-6 rounded-3xl border-l-8 border-blue-600 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 text-white">
          <div className="flex items-center gap-5">
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg"><ShieldCheck className="w-8 h-8" /></div>
              <div>
                  <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{settings.name}</h1>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">SISTEMA DE GESTIÓN MECÁNICA</p>
              </div>
          </div>
          <div className="flex gap-2">
              <button onClick={() => setShowFinancials(!showFinancials)} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">{showFinancials ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-blue-400" />}</button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-700"><Upload className="w-4 h-4" /> Restaurar</button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={e => e.target.files && onRestore?.(e.target.files[0])} />
              <button onClick={onBackup} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-500"><Download className="w-4 h-4" /> Respaldo</button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-sm font-black uppercase text-slate-800 italic">{monthLabel}</span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <div className="mt-2 border-t pt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Utilidad Estimada {monthLabel}</p>
                <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats.ventasBrutas - stats.gastos - stats.f29)}</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border-b-4 border-blue-400 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase">Ventas Brutas</p>
            <h3 className="text-xl font-black text-slate-800">{formatCurrency(stats.ventasBrutas)}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border-b-4 border-red-500 shadow-sm">
            <p className="text-[10px] font-black text-red-400 uppercase">Gastos Totales</p>
            <h3 className="text-xl font-black text-red-600">{formatCurrency(stats.gastos)}</h3>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border-b-4 border-yellow-400 text-white shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-yellow-400 uppercase">Proyección F29</p>
                <FileText className="w-3 h-3 text-yellow-400" />
            </div>
            <h3 className="text-xl font-black">{formatCurrency(stats.f29)}</h3>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-4 bg-emerald-600 flex flex-col gap-2">
                  <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><PhoneCall className="w-4 h-4" /> Directorio</h3>
                  <input type="text" placeholder="Buscar cliente..." value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)} className="w-full bg-emerald-700/50 border-none rounded-lg py-1 px-3 text-xs text-white placeholder-emerald-200" />
              </div>
              <div className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-2">
                  {phoneBook.map((contact, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition-all">
                          <div><p className="font-black text-slate-800 uppercase text-[10px] leading-none">{contact.name}</p><p className="text-[9px] text-emerald-600 font-bold">{contact.phone}</p></div>
                          <a href={`https://wa.me/${contact.phone.replace(/\+/g, '')}`} target="_blank" className="p-2 bg-white rounded-full text-emerald-500 shadow-sm hover:scale-110 transition-transform"><Phone className="w-4 h-4" /></a>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-4 bg-red-600">
                  <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4" /> Movimientos Caja</h3>
              </div>
              <div className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-3">
                  {allMixedExpenses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-50">
                          <History className="w-12 h-12 mb-2" />
                          <p className="text-xs italic">Sin movimientos registrados</p>
                      </div>
                  ) : allMixedExpenses.map((exp, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="flex justify-between items-start">
                              <div className="flex-1">
                                  <p className="text-[8px] text-gray-400 font-bold">{exp.date} • <span className="text-blue-500">{exp.type}</span></p>
                                  <p className="font-black text-slate-800 uppercase text-[9px] leading-tight truncate w-32">{exp.description}</p>
                              </div>
                              <span className="text-[10px] font-black text-red-600">-${Math.round(exp.amount || 0).toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-4 bg-slate-900">
                  <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Wrench className="w-4 h-4 text-yellow-400" /> Flujo Taller</h3>
              </div>
              <div className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-3">
                  {workshopFlow.length === 0 ? (
                      <p className="text-center text-gray-400 py-10 text-xs italic">No hay trabajos activos</p>
                  ) : workshopFlow.map(ot => (
                      <div key={ot.id} onClick={() => onViewOt?.(ot.id)} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-300 transition-all cursor-pointer">
                          <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-2 items-center">
                                  <span className="text-[8px] font-black font-mono bg-white px-1.5 py-0.5 rounded border uppercase text-slate-700">{ot.vehicle.plate}</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border ${STATUS_COLORS[ot.status]}`}>
                                      {STATUS_LABELS[ot.status]}
                                  </span>
                              </div>
                              <p className="text-[8px] font-black text-slate-400 uppercase truncate max-w-[80px]">{ot.mechanic || 'Sin asignar'}</p>
                          </div>
                          <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-800 uppercase text-[10px] leading-none mb-1 truncate">{ot.client.name}</p>
                                  <p className="text-[9px] text-gray-500 italic truncate">{ot.description || 'Sin diagnóstico registrado'}</p>
                              </div>
                              <ChevronIcon className="w-3 h-3 text-slate-300 shrink-0 ml-2" />
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-4 bg-blue-600">
                  <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Agenda Próxima</h3>
              </div>
              <div className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-3">
                  {upcomingAppointments.length === 0 ? (
                      <p className="text-center text-gray-400 py-10 text-xs italic">Sin citas agendadas</p>
                  ) : upcomingAppointments.map(apt => (
                      <div key={apt.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="flex justify-between items-start mb-1">
                              <div>
                                  <p className="text-[8px] font-black uppercase text-blue-600">{apt.date} • {apt.time}</p>
                                  <p className="font-black text-slate-800 uppercase text-[9px] truncate w-32">{apt.clientName}</p>
                              </div>
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-white border rounded text-slate-500 uppercase">{apt.plate}</span>
                          </div>
                          <p className="text-[8px] text-gray-500 italic truncate">{apt.issue}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
