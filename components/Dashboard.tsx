import React, { useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calculator, Clock, CheckCircle, Search, Phone, Car, Users, Wallet, XCircle, FileSpreadsheet, Download, Upload, Eye, EyeOff, CalendarClock, Bell, ShieldAlert, CalendarDays, MessageCircle, ChevronLeft, ChevronRight, Wrench, Send } from 'lucide-react';
import { WorkOrder, Expense, Appointment, WorkshopSettings } from '../types';
import { TAX_RATE, STATUS_COLORS, STATUS_LABELS } from '../constants';

interface DashboardProps {
  orders: WorkOrder[];
  expenses: Expense[];
  appointments?: Appointment[];
  settings: WorkshopSettings; // Agregamos settings aquí
  onViewOt?: (id: string) => void;
  onToggleOtReimbursement?: (otId: string, itemId: string) => void;
  onToggleExpensePaid?: (id: string) => void;
  onDismissMaintenance?: (otId: string) => void;
  onRestore?: (file: File) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    orders, 
    expenses,
    appointments = [],
    settings,
    onViewOt,
    onToggleOtReimbursement,
    onToggleExpensePaid,
    onDismissMaintenance,
    onRestore
}) => {
  
  const today = new Date().toISOString().split('T')[0];
  const [clientSearch, setClientSearch] = useState('');
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'pending'>('pending');
  const [showFinancials, setShowFinancials] = useState(true);
  
  // DATE FILTER STATE (Default to current month)
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATE HELPERS ---
  const handlePrevMonth = () => {
      setSelectedDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(prev.getMonth() - 1);
          return newDate;
      });
  };

  const handleNextMonth = () => {
      setSelectedDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(prev.getMonth() + 1);
          return newDate;
      });
  };

  const selectedMonthStr = selectedDate.toISOString().slice(0, 7); // YYYY-MM
  const monthLabel = selectedDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const isCurrentMonth = selectedMonthStr === new Date().toISOString().slice(0, 7);

  // --- WHATSAPP HELPER ---
  const sendWhatsApp = (phone: string, message: string) => {
      // 1. Limpiar el teléfono (dejar solo números)
      let cleanPhone = phone.replace(/\D/g, ''); 
      
      // 2. Intentar normalizar a formato internacional (Chile por defecto)
      // Si tiene 9 dígitos y empieza con 9, asumimos que falta el 56
      if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
          cleanPhone = '56' + cleanPhone;
      }
      // Si tiene 8 dígitos (fijo o antiguo), probablemente no sirva para WA, pero lo dejamos
      
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  // --- FILTERED DATA SETS ---

  // 1. Orders for the selected month (based on creation date)
  const monthlyOrders = useMemo(() => {
      return orders.filter(o => o.date.startsWith(selectedMonthStr));
  }, [orders, selectedMonthStr]);

  // 2. Expenses for the selected month
  const monthlyExpenses = useMemo(() => {
      return expenses.filter(e => e.date.startsWith(selectedMonthStr));
  }, [expenses, selectedMonthStr]);

  // 3. Appointments for the selected month
  const monthlyAppointments = useMemo(() => {
      return appointments.filter(apt => apt.date.startsWith(selectedMonthStr))
        .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [appointments, selectedMonthStr]);

  // 4. Maintenances Due in the selected month
  const monthlyMaintenances = useMemo(() => {
      return orders.filter(o => {
          if (!o.isMaintenance || !o.nextMaintenanceDate || o.maintenanceAlertDismissed) return false;
          return o.nextMaintenanceDate.startsWith(selectedMonthStr);
      }).sort((a,b) => new Date(a.nextMaintenanceDate!).getTime() - new Date(b.nextMaintenanceDate!).getTime());
  }, [orders, selectedMonthStr]);

  
  // Logic for Active Jobs Module (Always global/current status, independent of month filter)
  const activeOrders = orders.filter(o => 
    o.status !== 'delivered' || (o.status === 'delivered' && o.deliveredAt === today)
  );

  // Logic for Reminder Alerts (Tomorrow's Appointments - Always global)
  const remindersForTomorrow = useMemo(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      return appointments.filter(apt => 
          apt.date === tomorrowStr && 
          apt.status !== 'cancelled'
      );
  }, [appointments]);

  const generateReminderMessage = (apt: Appointment) => {
      const msg = `Hola ${apt.clientName}! Le escribimos de ${settings.name} para recordar su cita de mañana a las ${apt.time} por: ${apt.issue}. ¿Nos confirma su asistencia?`;
      // Buscar teléfono en órdenes pasadas si no está en la cita (optimización futura)
      // Por ahora asumimos que el usuario buscará el teléfono o implementaremos campo telefono en cita luego.
      // Como Appointment no tiene telefono garantizado en la interfaz actual (solo clientName y plate),
      // intentamos buscar el telefono en la base de clientes.
      const clientPhone = orders.find(o => o.client.name === apt.clientName)?.client.phone || '';
      
      if (clientPhone) {
          sendWhatsApp(clientPhone, msg);
      } else {
          // Fallback copy if no phone found
          navigator.clipboard.writeText(msg);
          alert("No se encontró teléfono asociado a este nombre. Mensaje copiado al portapapeles.");
      }
  };

  const generateMaintenanceMessage = (ot: WorkOrder) => {
      const msg = `Hola ${ot.client.name}, le escribimos de ${settings.name}. Según nuestros registros, a su vehículo ${ot.vehicle.brand} ${ot.vehicle.model} (${ot.vehicle.plate}) le corresponde su mantención programada. ¿Desea agendar una hora? Saludos!`;
      sendWhatsApp(ot.client.phone, msg);
  };


  // --- FINANCIAL CALCULATIONS (BASED ON SELECTED MONTH) ---

  // 1. Income (Ventas)
  const totalSalesGross = monthlyOrders.reduce((sum, order) => {
    const parts = order.items.filter(i => i.type === 'part').reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const labor = order.items.filter(i => i.type === 'labor').reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    return sum + parts + labor;
  }, 0);

  // Taxable Income (IVA Débito) - Only Boleta/Factura
  const validTaxOrders = monthlyOrders.filter(o => o.documentType !== 'cotizacion');
  const totalSalesGrossTaxable = validTaxOrders.reduce((sum, order) => {
    const parts = order.items.filter(i => i.type === 'part').reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const labor = order.items.filter(i => i.type === 'labor').reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    return sum + parts + labor;
  }, 0);
  const totalSalesNetTaxable = totalSalesGrossTaxable / (1 + TAX_RATE);
  const totalSalesIVATaxable = totalSalesGrossTaxable - totalSalesNetTaxable;


  // 2. Costs (Internal) - Based on Monthly Orders
  // Esto es lo que realmente gastamos (Bruto)
  const totalPartsCostInternalGross = monthlyOrders.reduce((sum, order) => {
     return sum + order.items.reduce((s, i) => s + (i.quantity * (i.costPrice || 0)), 0);
  }, 0);

  // 3. General Expenses - Based on Monthly Expenses (Manual)
  // Gasto manual total (Bruto)
  const totalGeneralExpensesGross = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // **** TOTAL REAL EXPENSES (Gasto de Bolsillo) ****
  const totalExpensesReal = totalGeneralExpensesGross + totalPartsCostInternalGross;


  // 4. IVA Credit (IVA Gastado) - Solo si hay boleta/factura en la compra
  const generalExpensesIVA = monthlyExpenses.reduce((sum, e) => {
    if (e.documentType === 'factura' || e.documentType === 'boleta') {
      const net = e.amount / (1 + TAX_RATE);
      const iva = e.amount - net;
      return sum + iva;
    }
    return sum;
  }, 0);

  const internalPartsIVA = monthlyOrders.reduce((sum, order) => {
    const partsIva = order.items.reduce((pSum, item) => {
        // Requerimiento: Si es gasto interno con Factura/Boleta, suma a crédito F29
        if ((item.type === 'part' || item.type === 'expense') && (item.purchaseDocType === 'factura' || item.purchaseDocType === 'boleta')) {
            const cost = (item.costPrice || 0) * item.quantity;
            const net = cost / (1 + TAX_RATE);
            return pSum + (cost - net);
        }
        return pSum;
    }, 0);
    return sum + partsIva;
  }, 0);

  const totalVATCredit = generalExpensesIVA + internalPartsIVA;

  // 5. CALCULO GANANCIA REAL (Adjusted Logic)
  // Ganancia Real = (Ingreso Efectivo) - (Gasto Real)
  // Ingreso Efectivo:
  //   - Cotización: Entra todo el bruto (no se declara IVA).
  //   - Boleta/Factura: Entra solo el Neto (el IVA se va al F29).
  // Gasto Real:
  //   - Siempre restamos el costo total bruto (lo que pagamos al proveedor).
  
  const realProfit = monthlyOrders.reduce((sum, order) => {
      const totalSale = order.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
      const totalCost = order.items.reduce((s, i) => s + (i.quantity * (i.costPrice || 0)), 0);

      let effectiveIncome = 0;
      if (order.documentType === 'cotizacion') {
          effectiveIncome = totalSale;
      } else {
          effectiveIncome = totalSale / (1 + TAX_RATE);
      }
      
      // Profit de la OT = Ingreso Efectivo - Costo Interno
      return sum + (effectiveIncome - totalCost);
  }, 0) - totalGeneralExpensesGross; // Restamos también los gastos generales completos


  const ivaBalance = totalSalesIVATaxable - totalVATCredit;

  // --- GLOBAL AGENDA SEARCH LOGIC (Not dependent on month) ---
  const uniqueClients = useMemo(() => {
      const map = new Map();
      orders.forEach(o => {
          if (!map.has(o.vehicle.plate)) {
              map.set(o.vehicle.plate, {
                  name: o.client.name,
                  phone: o.client.phone,
                  vehicle: `${o.vehicle.brand} ${o.vehicle.model}`,
                  plate: o.vehicle.plate
              });
          }
      });
      return Array.from(map.values()).filter(c => 
         c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
         c.plate.toLowerCase().includes(clientSearch.toLowerCase())
      );
  }, [orders, clientSearch]);

  // --- REIMBURSEMENT (DEUDA INTERNA) LOGIC (All time / Pending filter) ---
  const allDebts = useMemo(() => {
      // 1. General Expenses
      const general = expenses.map(e => ({
          type: 'general',
          id: e.id,
          parentId: null,
          date: e.date,
          description: e.description,
          amount: e.amount,
          buyer: e.buyerName,
          provider: e.provider,
          isPaid: e.isPaid,
          paymentDate: e.paymentDate,
          label: e.category === 'insumos' ? 'Insumos Taller' : 'Gasto General'
      }));

      // 2. OT Internal Items
      const internal = orders.flatMap(ot => 
          ot.items
             .filter(i => (i.type === 'expense' || i.costPrice! > 0) && i.buyer)
             .map(i => ({
                 type: 'ot_item',
                 id: i.id,
                 parentId: ot.id,
                 date: ot.date,
                 description: `OT #${ot.id}: ${i.description}`,
                 amount: (i.costPrice || 0) * i.quantity,
                 buyer: i.buyer,
                 provider: i.provider,
                 isPaid: i.isReimbursed || false,
                 paymentDate: i.reimbursementDate,
                 label: `OT #${ot.id}`
             }))
      );

      return [...general, ...internal].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, orders]);

  const filteredDebts = allDebts.filter(d => expenseFilter === 'all' || !d.isPaid);
  const totalDebtAmount = allDebts.filter(d => !d.isPaid).reduce((sum, d) => sum + d.amount, 0);

  // --- MASTER EXPORT ---
  const handleMasterExport = () => {
      if (typeof (window as any).XLSX === 'undefined') {
          alert("La librería de Excel no se ha cargado correctamente. Intente recargar la página.");
          return;
      }

      const XLSX = (window as any).XLSX;
      
      const fmt = (num: number) => `$ ${Math.round(num).toLocaleString('es-CL')}`;

      // 1. Prepare Orders Data
      const ordersData = orders.map(ot => {
          const total = ot.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          const totalCostGross = ot.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);
          
          let totalNetSale;
          if (ot.documentType === 'cotizacion') {
              totalNetSale = total;
          } else {
              totalNetSale = total / (1 + TAX_RATE);
          }
          const profit = totalNetSale - totalCostGross;

          return {
              "ID OT": ot.id,
              "Tipo": ot.otType === 'warranty' ? 'GARANTÍA' : 'Normal',
              "Ref OT": ot.parentOtId || '',
              "Fecha": ot.date,
              "Cliente": ot.client.name,
              "Teléfono": ot.client.phone,
              "Vehículo": `${ot.vehicle.brand} ${ot.vehicle.model}`,
              "Patente": ot.vehicle.plate,
              "Mecánico": ot.mechanic,
              "Estado": STATUS_LABELS[ot.status],
              "Tipo Doc": ot.documentType,
              "Total Venta (Bruto)": fmt(total),
              "Ganancia Real Aprox": fmt(profit)
          };
      });

      // 2. Prepare Detailed OT Items Data (Repuestos & Gastos OT)
      const otItemsData = orders.flatMap(ot => 
          ot.items.map(item => ({
              "OT Origen": ot.id,
              "Fecha": ot.date,
              "Tipo Item": item.type === 'part' ? 'Repuesto' : item.type === 'labor' ? 'Mano Obra' : 'Gasto Interno',
              "Descripción": item.description,
              "Cantidad": item.quantity,
              "Costo Unit.": fmt(item.costPrice || 0),
              "Costo Total": fmt((item.costPrice || 0) * item.quantity),
              "Venta Unit.": fmt(item.unitPrice),
              "Venta Total": fmt(item.unitPrice * item.quantity),
              "Proveedor": item.provider || '',
              "Comprador": item.buyer || '',
              "Doc Compra": item.purchaseDocType || ''
          }))
      );

      // 3. Prepare Consolidated Expenses Data (Manual + OT Internal)
      // We use 'allDebts' calculated previously as it already merges both sources nicely
      const expensesData = allDebts.map(e => ({
          "Fecha": e.date,
          "Origen": e.label,
          "Categoría": e.type === 'general' ? 'Gasto General' : 'Costo OT',
          "Descripción": e.description,
          "Proveedor": e.provider || '',
          "Comprador": e.buyer,
          "Monto": fmt(e.amount),
          "Estado Pago": e.isPaid ? 'Pagado' : 'Pendiente',
          "Fecha Pago": e.paymentDate || ''
      }));

      // 4. Create Workbook
      const wb = XLSX.utils.book_new();

      // 5. Add Sheets
      const wsOrders = XLSX.utils.json_to_sheet(ordersData);
      const wsItems = XLSX.utils.json_to_sheet(otItemsData);
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);

      XLSX.utils.book_append_sheet(wb, wsOrders, "Ordenes de Trabajo");
      XLSX.utils.book_append_sheet(wb, wsItems, "Detalle Items (Repuestos)");
      XLSX.utils.book_append_sheet(wb, wsExpenses, "Gastos Consolidados");

      // 6. Download
      XLSX.writeFile(wb, "Reporte_Taller_Completo.xlsx");
  };

  const getBackupData = () => ({
      date: new Date().toISOString(),
      orders,
      expenses,
      appointments, // Included in backup
      settings      // Included in backup
  });

  const handleBackup = () => {
    const backupData = getBackupData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadAnchorNode.setAttribute("download", `taller_master_respaldo_${timestamp}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Helper to format currency considering visibility
  const formatCurrency = (amount: number) => {
      if (!showFinancials) return '$ ••••••';
      return `$${Math.round(amount).toLocaleString()}`;
  };

  // Helper for Status Border Color
  const getStatusBorder = (status: string) => {
    switch(status) {
        case 'pending': return 'border-l-4 border-l-yellow-400';
        case 'in-progress': return 'border-l-4 border-l-blue-600';
        case 'completed': return 'border-l-4 border-l-green-500';
        case 'delivered': return 'border-l-4 border-l-gray-400';
        default: return 'border-l-4 border-l-gray-200';
    }
  };

  const Card = ({ title, amount, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(amount)}</h3>
          {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Control de {settings.name || 'Taller'}</h2>
            <button 
                onClick={() => setShowFinancials(!showFinancials)} 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title={showFinancials ? "Ocultar valores" : "Mostrar valores"}
            >
                {showFinancials ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
        </div>
        <div className="flex gap-2">
            <button onClick={handleMasterExport} className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-bold">
                <FileSpreadsheet className="w-3 h-3" /> Exportar Excel
            </button>
            <button onClick={handleBackup} className="flex items-center gap-1 text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700">
                <Download className="w-3 h-3" /> Copia Seguridad
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700">
                <Upload className="w-3 h-3" /> Restaurar
            </button>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onRestore && onRestore(e.target.files[0])} className="hidden" accept=".json" />
        </div>
      </div>

      {/* MONTH SELECTOR BAR */}
      <div className="bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between mb-6 shadow-md">
          <button 
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-700 rounded-full transition-colors"
          >
              <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center">
              <span className="text-sm font-light text-slate-400 uppercase tracking-widest">Resumen Mensual</span>
              <span className="text-xl font-bold capitalize">{monthLabel}</span>
          </div>

          <button 
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-700 rounded-full transition-colors"
          >
              <ChevronRight className="w-6 h-6" />
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Active Jobs Module (Always Current) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Activos Hoy
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    {activeOrders.length}
                </span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {activeOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic">Sin trabajos activos hoy.</div>
                ) : (
                    activeOrders.map(ot => (
                        <div 
                            key={ot.id} 
                            className={`p-4 flex justify-between items-start hover:bg-gray-50 transition cursor-pointer border-b border-gray-100 last:border-0 ${getStatusBorder(ot.status)}`}
                            onClick={() => onViewOt && onViewOt(ot.id)}
                        >
                            <div className="overflow-hidden flex-1 pr-2">
                                <div className="font-bold text-blue-600 flex items-center gap-2">#{ot.id} <span className="text-gray-900 font-medium truncate">{ot.client.name}</span></div>
                                <div className="text-xs text-gray-500">{ot.vehicle.brand} {ot.vehicle.model} <span className="uppercase font-mono text-[10px] bg-gray-100 px-1 rounded ml-1">{ot.vehicle.plate}</span></div>
                                <div className="text-xs text-gray-400 mt-1 truncate italic">
                                    {ot.description || "Sin descripción"}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-center w-full ${STATUS_COLORS[ot.status]}`}>
                                    {STATUS_LABELS[ot.status]}
                                </span>
                                {ot.mechanic ? (
                                    <div className="text-[10px] text-gray-600 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                        <Wrench className="w-3 h-3 text-slate-400" />
                                        <span className="truncate max-w-[80px]">{ot.mechanic}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-gray-400 italic">Sin Mecánico</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Agenda Module (Monthly Filtered) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50 flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                    Agenda
                </h3>
                {/* Count displayed includes only active (not cancelled) appointments for better UX */}
                <span className="text-xs bg-indigo-200 text-indigo-900 px-2 py-1 rounded-full font-medium">
                    {monthlyAppointments.filter(a => a.status !== 'cancelled').length}
                </span>
             </div>
             
             {/* ALERTA DE RECORDATORIOS PARA MAÑANA (Always Visible if active) */}
             {remindersForTomorrow.length > 0 && isCurrentMonth && (
                <div className="bg-yellow-50 border-b border-yellow-100 p-3">
                    <p className="text-xs font-bold text-yellow-800 flex items-center gap-1 mb-2">
                        <Bell className="w-3 h-3" /> Recordatorios para Mañana ({remindersForTomorrow.length})
                    </p>
                    <div className="space-y-2">
                        {remindersForTomorrow.map(apt => (
                            <div key={apt.id} className="flex justify-between items-center bg-white p-2 rounded border border-yellow-200">
                                <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{apt.clientName}</span>
                                <button 
                                    onClick={() => generateReminderMessage(apt)}
                                    className="flex items-center gap-1 text-[10px] bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <Send className="w-3 h-3" /> WhatsApp
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                 {monthlyAppointments.filter(a => a.status !== 'cancelled').length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic">No hay citas activas para {monthLabel}.</div>
                 ) : (
                    monthlyAppointments
                        .filter(apt => apt.status !== 'cancelled') // Filter out cancelled appointments
                        .map(apt => (
                        <div key={apt.id} className="p-4 hover:bg-indigo-50/50 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-1.5 rounded">
                                            {/* FIX: Force local time T00:00:00 for display to avoid timezone shift */}
                                            {new Date(apt.date + 'T00:00:00').getDate()}
                                        </span>
                                        <span className="font-bold text-gray-700 text-sm">{apt.clientName}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 pl-7">
                                        {apt.issue}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs font-mono text-gray-500">{apt.time}</span>
                                    {apt.status === 'confirmed' && (
                                        <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                                            <CheckCircle className="w-3 h-3" /> Confirmado
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                 )}
             </div>
        </div>

        {/* Maintenance Alerts Module (Monthly Filtered) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-orange-50 flex justify-between items-center">
                <h3 className="font-bold text-orange-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-600" />
                    Mantenciones
                </h3>
                <span className="text-xs bg-orange-200 text-orange-900 px-2 py-1 rounded-full font-medium">
                    {monthlyMaintenances.length}
                </span>
             </div>
             <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                 {monthlyMaintenances.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic">Sin mantenciones para {monthLabel}.</div>
                 ) : (
                    monthlyMaintenances.map(ot => {
                        const nextDate = new Date(ot.nextMaintenanceDate!);
                        const isOverdue = nextDate < new Date();
                        return (
                            <div key={ot.id} className="p-4 hover:bg-gray-50 transition flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-700 text-sm">{ot.client.name}</div>
                                        <div className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                                            {isOverdue ? 'Venció: ' : 'Toca: '} {ot.nextMaintenanceDate}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onDismissMaintenance && onDismissMaintenance(ot.id)}
                                        className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-500"
                                        title="Ocultar alerta"
                                    >
                                        OK
                                    </button>
                                </div>
                                <button 
                                    onClick={() => generateMaintenanceMessage(ot)}
                                    className="w-full flex items-center justify-center gap-2 text-[11px] bg-green-600 text-white py-1.5 rounded hover:bg-green-700 transition-colors shadow-sm font-medium"
                                >
                                    <Send className="w-3 h-3" /> Enviar WhatsApp
                                </button>
                            </div>
                        );
                    })
                 )}
             </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
            title="Ventas Totales (Bruto)" 
            amount={totalSalesGross} 
            icon={TrendingUp} 
            color="bg-emerald-500" 
            subtext={`${monthLabel} - ${monthlyOrders.length} OTs`}
        />
        <Card 
            title="Gastos Totales (Bruto)" 
            amount={totalExpensesReal} 
            icon={TrendingDown} 
            color="bg-red-500" 
            subtext={`${monthLabel} - Gral + Insumos + OT`}
        />
        <Card 
            title="Ganancia Real (Neto)" 
            amount={realProfit} 
            icon={DollarSign} 
            color={realProfit >= 0 ? "bg-blue-600" : "bg-orange-500"} 
            subtext={`Neto Real (Ventas ${validTaxOrders.length > 0 ? '- IVA' : ''} - Gastos)`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* F29 MODULE (Monthly) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Cálculo de IVA (F29) - {monthLabel}
            </h3>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">IVA Débito (Ventas)</p>
                        <p className="text-xs text-gray-400 font-light">Solo Boleta/Factura</p>
                        <p className="text-lg font-bold text-slate-700">+ {formatCurrency(totalSalesIVATaxable)}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">IVA Crédito (Compras)</p>
                        <p className="text-xs text-gray-400 font-light">Facturas/Boletas (Gral + Insumos + OT)</p>
                        <p className="text-lg font-bold text-slate-700">- {formatCurrency(totalVATCredit)}</p>
                    </div>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
            </div>

            <div className={`mt-6 p-6 rounded-xl text-center border-2 ${ivaBalance > 0 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                <p className="text-sm font-semibold uppercase tracking-wider mb-2">
                    {ivaBalance > 0 ? "IVA A Pagar" : "Remanente a Favor"}
                </p>
                <p className="text-3xl font-black">
                    {showFinancials ? `$${Math.abs(Math.round(ivaBalance)).toLocaleString()}` : '$ ••••••'}
                </p>
            </div>
            
          </div>

          {/* AGENDA TELEFONICA */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Agenda Telefónica
             </h3>
             <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar cliente o patente..." 
                    className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                />
             </div>
             <div className="overflow-y-auto max-h-[300px] divide-y divide-gray-100">
                 {uniqueClients.length === 0 ? (
                     <p className="text-center text-gray-400 text-sm py-4">No se encontraron clientes.</p>
                 ) : (
                     uniqueClients.map((c, idx) => (
                         <div key={idx} className="py-3 flex justify-between items-center">
                             <div>
                                 <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                                 <p className="text-xs text-gray-500 flex items-center gap-1">
                                     <Car className="w-3 h-3" /> {c.vehicle} 
                                     <span className="bg-gray-100 border px-1 rounded uppercase ml-1">{c.plate}</span>
                                 </p>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => sendWhatsApp(c.phone, `Hola ${c.name}, le escribimos del taller.`)}
                                    className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-100 transition-colors"
                                >
                                    <Send className="w-3 h-3" /> WA
                                </button>
                                <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100">
                                    <Phone className="w-3 h-3" /> Llamar
                                </a>
                             </div>
                         </div>
                     ))
                 )}
             </div>
          </div>
      </div>

      {/* INTERNAL EXPENSES / REIMBURSEMENT TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  Control de Gastos y Reembolsos (Global)
              </h3>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setExpenseFilter('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${expenseFilter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Todos
                  </button>
                  <button 
                    onClick={() => setExpenseFilter('pending')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${expenseFilter === 'pending' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Pendientes
                  </button>
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Reg. / Origen</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprador</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado / F.Pago</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {filteredDebts.length === 0 ? (
                          <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">No hay registros para mostrar.</td></tr>
                      ) : (
                          filteredDebts.map((item, idx) => (
                              <tr key={`${item.type}-${item.id}-${idx}`} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-xs text-gray-500">{item.date}</div>
                                      <div className={`text-xs font-bold inline-block px-1 rounded ${item.label === 'Insumos Taller' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                                          {item.label}
                                      </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-800">{item.description}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600 font-medium">{item.buyer}</td>
                                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                      {formatCurrency(item.amount)}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                      <button 
                                        onClick={() => {
                                            if(item.type === 'general' && onToggleExpensePaid) onToggleExpensePaid(item.id);
                                            if(item.type === 'ot_item' && onToggleOtReimbursement) onToggleOtReimbursement(item.parentId!, item.id);
                                        }}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors mb-1 ${item.isPaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                      >
                                          {item.isPaid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                          {item.isPaid ? 'Pagado' : 'Pendiente'}
                                      </button>
                                      {item.isPaid && item.paymentDate && (
                                          <div className="text-[10px] text-gray-500">
                                              {item.paymentDate}
                                          </div>
                                      )}
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <div className="text-right">
                  <span className="text-sm text-gray-500 mr-2">Total Pendiente:</span>
                  <span className="text-xl font-bold text-red-600">
                      {formatCurrency(totalDebtAmount)}
                  </span>
              </div>
          </div>
      </div>
    </div>
  );
};