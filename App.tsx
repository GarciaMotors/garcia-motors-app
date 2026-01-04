
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

// Proveedor de nube alternativo muy estable
const CLOUD_API = 'https://api.restful-api.dev/objects';

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
    if (!settings.syncCode) {
      alert("Genera un código en Configuración primero.");
      return;
    }
    setIsSyncing(true);
    try {
      const payload = {
        name: `GM_DATA_${settings.syncCode}`,
        data: {
          orders,
          expenses,
          appointments,
          raffleWinners,
          settings: { ...settings, lastSync: new Date().toLocaleString() }
        }
      };
      const response = await fetch(`${CLOUD_API}/${settings.syncCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setSettings(prev => ({ ...prev, lastSync: new Date().toLocaleString() }));
        alert("¡Datos subidos a la nube exitosamente!");
      } else {
        throw new Error();
      }
    } catch (error) {
      alert("Error al subir datos. Intente nuevamente.");
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async () => {
    if (!settings.syncCode) {
      alert("Ingrese su código de sincronización.");
      return;
    }
    if (!window.confirm("¿Descargar datos? Se borrará lo actual en este equipo.")) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${CLOUD_API}/${settings.syncCode}`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        if (data) {
          if (data.orders) setOrders(data.orders);
          if (data.expenses) setExpenses(data.expenses);
          if (data.appointments) setAppointments(data.appointments);
          if (data.raffleWinners) setRaffleWinners(data.raffleWinners);
          if (data.settings) setSettings(data.settings);
          alert("¡Datos descargados con éxito!");
        }
      } else {
        alert("Código no válido.");
      }
    } catch (error) {
      alert("Error al conectar con la nube.");
    } finally {
      setIsSyncing(false);
    }
  };

  const generateNewCloudCode = async () => {
    setIsSyncing(true);
    try {
      const payload = {
        name: "GM_SYNC_INITIAL",
        data: { orders: [], expenses: [], appointments: [], raffleWinners: [], settings }
      };
      const response = await fetch(CLOUD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        const newCode = result.id;
        if (newCode) {
          setSettings(prev => ({ ...prev, syncCode: newCode }));
          alert(`¡Código Nuevo: ${newCode}`);
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      alert("Error de conexión. Intente de nuevo.");
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

  const handleDeleteOt = (id: string) => {
    if (window.confirm('¿Eliminar esta OT?')) setOrders(orders.filter(o => o.id !== id));
  };

  const handleEditOt = (id: string) => {
    setSelectedOrderId(id);
    setView('create');
  };

  const handleViewOt = (id: string) => {
    setSelectedOrderId(id);
    setView('details');
  };

  const handleToggleOtItemReimbursement = (otId: string, itemId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setOrders(orders.map(o => o.id !== otId ? o : {
      ...o,
      items: o.items.map(i => i.id !== itemId ? i : { 
        ...i, isReimbursed: !i.isReimbursed, reimbursementDate: !i.isReimbursed ? today : i.reimbursementDate 
      })
    }));
  };

  const handleDismissMaintenance = (otId: string) => {
    if(window.confirm("¿Confirmas contacto?")) {
      setOrders(orders.map(o => o.id === otId ? { ...o, maintenanceAlertDismissed: true } : o));
    }
  };

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
        alert('Base de datos restaurada.');
      } catch (e) { alert('Error al leer el archivo.'); }
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
