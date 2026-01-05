
import React, { useState, useEffect, useCallback } from 'react';
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
import { F29Module } from './components/F29Module';
import { WorkOrder, ViewState, Expense, Appointment, WorkshopSettings, RaffleWinner } from './types';

function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [raffleWinners, setRaffleWinners] = useState<RaffleWinner[]>([]); 
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const defaultSettings: WorkshopSettings = {
    name: 'GARCIA Motors',
    subtitle: 'Servicio Automotriz',
    address: 'Nonato Coo 4250, Puente Alto',
    phone: '+56 9 5473 7414',
    email: 'contactogarciamotors@gmail.com'
  };

  const [settings, setSettings] = useState<WorkshopSettings>(defaultSettings);

  // CARGA INICIAL
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

  // PERSISTENCIA AUTOMÁTICA
  useEffect(() => { localStorage.setItem('taller_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('taller_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('taller_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('taller_winners', JSON.stringify(raffleWinners)); }, [raffleWinners]);
  useEffect(() => { localStorage.setItem('taller_settings', JSON.stringify(settings)); }, [settings]);

  const handleBackupData = () => {
    const data = { orders, expenses, appointments, raffleWinners, settings, backupDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GarciaMotors_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.orders) setOrders(data.orders);
        if (data.expenses) setExpenses(data.expenses);
        if (data.appointments) setAppointments(data.appointments);
        if (data.raffleWinners) setRaffleWinners(data.raffleWinners);
        if (data.settings) setSettings(data.settings);
        alert('✅ Datos restaurados con éxito.');
      } catch (e) { alert('❌ El archivo no es válido.'); }
    };
    reader.readAsText(file);
  };

  const handleSetView = (newView: ViewState) => {
    if (newView === 'create') setSelectedOrderId(null);
    setView(newView);
  };

  const handleCreateOt = (newOt: WorkOrder) => {
    const today = new Date().toISOString().split('T')[0];
    if (newOt.status === 'delivered' && !newOt.deliveredAt) newOt.deliveredAt = today;
    setOrders(prev => {
        const exists = prev.find(o => o.id === newOt.id);
        if (exists) return prev.map(o => o.id === newOt.id ? newOt : o);
        return [newOt, ...prev];
    });
    setView('list');
    setSelectedOrderId(null);
  };

  const handleViewOt = (id: string) => { setSelectedOrderId(id); setView('details'); };
  const handleEditOt = (id: string) => { setSelectedOrderId(id); setView('create'); };
  
  const handleDeleteOt = useCallback((id: string) => { 
    if (window.confirm('¿Está seguro de eliminar esta OT permanentemente?')) {
        setOrders(prev => prev.filter(o => o.id !== id)); 
    }
  }, []);

  const handleDeleteWinner = useCallback((id: string) => {
    if (window.confirm('¿Desea eliminar este ganador del historial?')) {
      setRaffleWinners(prev => prev.filter(w => w.id !== id));
    }
  }, []);

  const handleToggleExpensePaid = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setExpenses(prev => prev.map(e => e.id !== id ? e : { ...e, isPaid: !e.isPaid, paymentDate: !e.isPaid ? today : e.paymentDate }));
  };

  return (
    <Layout setView={handleSetView} currentView={view}>
      {view === 'dashboard' && (
        <Dashboard 
            orders={orders} expenses={expenses} appointments={appointments} settings={settings}
            onViewOt={handleViewOt} onBackup={handleBackupData} onRestore={handleRestoreData}
        />
      )}
      {view === 'expenses' && <ExpenseList expenses={expenses} orders={orders} onAdd={(e) => setExpenses(prev => [...prev, e])} onEdit={(upd) => setExpenses(prev => prev.map(e => e.id === upd.id ? upd : e))} onDelete={(id) => setExpenses(prev => prev.filter(e => e.id !== id))} onTogglePaid={handleToggleExpensePaid} />}
      {view === 'parts' && <PartsList orders={orders} />}
      {view === 'agenda' && <Agenda appointments={appointments} onAdd={(a) => setAppointments(prev => [...prev, a])} onUpdate={(upd) => setAppointments(prev => prev.map(a => a.id === upd.id ? upd : a))} onDelete={(id) => setAppointments(prev => prev.filter(a => a.id !== id))} />}
      {view === 'raffle' && <Raffle orders={orders} winnersHistory={raffleWinners} onRegisterWinner={(w) => setRaffleWinners(prev => [w, ...prev])} onUpdateWinnerStatus={(id, st) => setRaffleWinners(prev => prev.map(w => w.id === id ? { ...w, isRedeemed: st } : w))} onDeleteWinner={handleDeleteWinner} onBack={() => setView('dashboard')} />}
      {view === 'calculator' && <Calculator />}
      {view === 'f29' && <F29Module orders={orders} expenses={expenses} />}
      {view === 'settings' && <Settings settings={settings} onSave={setSettings} />}
      {view === 'create' && <OtForm initialData={orders.find(o => o.id === selectedOrderId)} existingOrders={orders} onSave={handleCreateOt} onCancel={() => setView('list')} />}
      {view === 'details' && orders.find(o => o.id === selectedOrderId) && <OtDetail ot={orders.find(o => o.id === selectedOrderId)!} settings={settings} onBack={() => setView('list')} />}
      {view === 'list' && <OtList orders={orders} onView={handleViewOt} onEdit={handleEditOt} onDelete={handleDeleteOt} />}
    </Layout>
  );
}

export default App;
