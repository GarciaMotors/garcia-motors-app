
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { OtList } from './components/OtList';
import { OtForm } from './components/OtForm';
import { OtDetail } from './components/OtDetail';
import { ExpenseList } from './components/ExpenseList';
import { PartsList } from './components/PartsList';
import { Dashboard } from './components/Dashboard';
import { Agenda } from './components/Agenda';
import { Settings } from './components/Settings';
import { Raffle } from './components/Raffle';
import { Calculator } from './components/Calculator';
import { WorkOrder, ViewState, Expense, Appointment, WorkshopSettings, RaffleWinner } from './types';

const CLOUD_API_BASE = 'https://api.npoint.io';

function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [raffleWinners, setRaffleWinners] = useState<RaffleWinner[]>([]); 
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const defaultSettings: WorkshopSettings = {
    name: 'GARCIA Motors',
    subtitle: 'Servicio Automotriz',
    address: 'Nonato Coo 4250, Puente Alto',
    phone: '+56 9 5473 7414',
    email: 'contactogarciamotors@gmail.com',
    syncCode: '',
    lastSync: ''
  };

  const [settings, setSettings] = useState<WorkshopSettings>(defaultSettings);

  useEffect(() => {
    const savedOrders = localStorage.getItem('taller_orders');
    if (savedOrders) try { setOrders(JSON.parse(savedOrders)); } catch (e) {}
    const savedExpenses = localStorage.getItem('taller_expenses');
    if (savedExpenses) try { setExpenses(JSON.parse(savedExpenses)); } catch (e) {}
    const savedAppointments = localStorage.getItem('taller_appointments');
    if (savedAppointments) try { setAppointments(JSON.parse(savedAppointments)); } catch (e) {}
    const savedWinners = localStorage.getItem('taller_winners');
    if (savedWinners) try { setRaffleWinners(JSON.parse(savedWinners)); } catch (e) {}
    const savedSettings = localStorage.getItem('taller_settings');
    if (savedSettings) try { setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) })); } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('taller_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('taller_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('taller_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('taller_winners', JSON.stringify(raffleWinners)); }, [raffleWinners]);
  useEffect(() => { localStorage.setItem('taller_settings', JSON.stringify(settings)); }, [settings]);

  const pushToCloud = async () => {
    const code = settings.syncCode?.trim();
    if (!code) {
      alert("⚠️ Error: No hay código de nube. Genéralo en Configuración.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const payload = {
        orders,
        expenses,
        appointments,
        raffleWinners,
        settings: { ...settings, lastSync: new Date().toLocaleString() }
      };

      const response = await fetch(`${CLOUD_API_BASE}/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, lastSync: new Date().toLocaleString() }));
        alert("✅ Subido a la nube correctamente.");
      } else {
        alert("❌ Error al subir. Revisa el código.");
      }
    } catch (error) {
      alert("❌ Error de conexión.");
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async () => {
    const code = settings.syncCode?.trim();
    if (!code) { alert("⚠️ Ingresa el código en Configuración."); return; }
    if (!window.confirm("⚠️ ¿Bajar datos? Se reemplazará lo que tienes ahora.")) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`${CLOUD_API_BASE}/${code}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          if (data.orders) setOrders(data.orders);
          if (data.expenses) setExpenses(data.expenses);
          if (data.appointments) setAppointments(data.appointments);
          if (data.raffleWinners) setRaffleWinners(data.raffleWinners);
          if (data.settings) setSettings({ ...data.settings, syncCode: code });
          alert("✅ ¡Sincronizado! Datos descargados.");
        }
      } else {
        alert("❌ No hay datos para ese código. ¿Ya le diste a 'Subir' en el otro equipo?");
      }
    } catch (error) {
      alert("❌ Error al conectar.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Generación local rápida para evitar el "INP Issue" de bloqueo de UI
  const generateNewCloudCode = async () => {
    setIsSyncing(true);
    try {
      // Intentamos crear el contenedor en NPoint
      const response = await fetch(CLOUD_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialized: true, date: new Date().toISOString() })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.id) {
          setSettings(prev => ({ ...prev, syncCode: result.id }));
          alert(`✅ CÓDIGO GENERADO: ${result.id}\n\n1. Dale a "Guardar Todo" abajo.\n2. Ve al Panel y dale a "Subir".`);
        }
      } else {
        throw new Error("Server error");
      }
    } catch (error) {
      // Fallback: Generar un ID aleatorio local si el servidor falla al crear
      const fallbackId = 'gm-' + Math.random().toString(36).substring(2, 9);
      setSettings(prev => ({ ...prev, syncCode: fallbackId }));
      alert(`⚠️ Servidor ocupado. Se generó un código local: ${fallbackId}\nGuarda y prueba subir en unos momentos.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateOt = (newOt: WorkOrder) => {
    const today = new Date().toISOString().split('T')[0];
    if (newOt.status === 'delivered' && !newOt.deliveredAt) newOt.deliveredAt = today;
    let updatedOrders: WorkOrder[];
    const exists = orders.find(o => o.id === newOt.id);
    if (exists) updatedOrders = orders.map(o => o.id === newOt.id ? newOt : o);
    else updatedOrders = [newOt, ...orders];
    setOrders(updatedOrders);
    setView('list');
    setSelectedOrderId(null);
  };
  const handleDeleteOt = (id: string) => { if (window.confirm('¿Eliminar permanentemente?')) setOrders(orders.filter(o => o.id !== id)); };
  const handleEditOt = (id: string) => { setSelectedOrderId(id); setView('create'); };
  const handleViewOt = (id: string) => { setSelectedOrderId(id); setView('details'); };
  const handleToggleOtItemReimbursement = (otId: string, itemId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setOrders(orders.map(o => o.id !== otId ? o : {
      ...o, items: o.items.map(i => i.id !== itemId ? i : { 
        ...i, isReimbursed: !i.isReimbursed, reimbursementDate: !i.isReimbursed ? today : i.reimbursementDate 
      })
    }));
  };
  const handleDismissMaintenance = (otId: string) => { if(window.confirm("¿Confirmar contacto?")) setOrders(orders.map(o => o.id === otId ? { ...o, maintenanceAlertDismissed: true } : o)); };
  const handleAddExpense = (newExp: Expense) => setExpenses([...expenses, newExp]);
  const handleEditExpense = (updExp: Expense) => setExpenses(expenses.map(e => e.id === updExp.id ? updExp : e));
  const handleDeleteExpense = (id: string) => window.confirm('¿Eliminar?') && setExpenses(expenses.filter(e => e.id !== id));
  const handleToggleExpensePaid = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setExpenses(expenses.map(e => e.id !== id ? e : { ...e, isPaid: !e.isPaid, paymentDate: !e.isPaid ? today : e.paymentDate }));
  };
  const handleAddAppointment = (apt: Appointment) => setAppointments(prev => [...prev, apt]);
  const handleUpdateAppointment = (updApt: Appointment) => setAppointments(prev => prev.map(a => a.id === updApt.id ? updApt : a));
  const handleDeleteAppointment = (id: string) => window.confirm("¿Eliminar?") && setAppointments(prev => prev.filter(a => a.id !== id));
  const handleRegisterWinner = (winner: RaffleWinner) => setRaffleWinners(prev => [winner, ...prev]);
  const handleUpdateWinnerStatus = (id: string, isRedeemed: boolean) => {
    setRaffleWinners(prev => prev.map(w => w.id === id ? { ...w, isRedeemed, redemptionDate: isRedeemed ? new Date().toISOString().split('T')[0] : undefined } : w));
  };
  const handleDeleteWinner = (id: string) => window.confirm("¿Borrar?") && setRaffleWinners(prev => prev.filter(w => w.id !== id));
  const handleRestoreData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.orders) setOrders(data.orders);
        if (data.expenses) setExpenses(data.expenses);
        if (data.appointments) setAppointments(data.appointments);
        if (data.winners) setRaffleWinners(data.winners);
        if (data.settings) setSettings(data.settings);
        alert('✅ Restauración completa.');
      } catch (e) { alert('❌ Error en el archivo JSON.'); }
    };
    reader.readAsText(file);
  };
  const getSelectedOrder = () => orders.find(o => o.id === selectedOrderId);

  return (
    <Layout setView={setView} currentView={view}>
      {view === 'dashboard' && (
        <Dashboard 
            orders={orders} expenses={expenses} appointments={appointments} settings={settings}
            onViewOt={handleViewOt} onToggleOtReimbursement={handleToggleOtItemReimbursement}
            onToggleExpensePaid={handleToggleExpensePaid} onDismissMaintenance={handleDismissMaintenance}
            onRestore={handleRestoreData}
            onPushCloud={pushToCloud} onPullCloud={pullFromCloud} isSyncing={isSyncing}
        />
      )}
      {view === 'expenses' && <ExpenseList expenses={expenses} orders={orders} onAdd={handleAddExpense} onEdit={handleEditExpense} onDelete={handleDeleteExpense} />}
      {view === 'parts' && <PartsList orders={orders} />}
      {view === 'agenda' && <Agenda appointments={appointments} onAdd={handleAddAppointment} onUpdate={handleUpdateAppointment} onDelete={handleDeleteAppointment} />}
      {view === 'raffle' && <Raffle orders={orders} winnersHistory={raffleWinners} onRegisterWinner={handleRegisterWinner} onUpdateWinnerStatus={handleUpdateWinnerStatus} onDeleteWinner={handleDeleteWinner} />}
      {view === 'calculator' && <Calculator />}
      {view === 'settings' && <Settings settings={settings} onSave={setSettings} onGenerateCode={generateNewCloudCode} isSyncing={isSyncing} />}
      {view === 'create' && <OtForm initialData={getSelectedOrder()} existingOrders={orders} existingExpenses={expenses} onSave={handleCreateOt} onCancel={() => { setView('list'); setSelectedOrderId(null); }} />}
      {view === 'details' && getSelectedOrder() && <OtDetail ot={getSelectedOrder()!} settings={settings} onBack={() => { setView('list'); setSelectedOrderId(null); }} />}
      {view === 'list' && <OtList orders={orders} onView={handleViewOt} onEdit={handleEditOt} onDelete={handleDeleteOt} />}
    </Layout>
  );
}

export default App;
