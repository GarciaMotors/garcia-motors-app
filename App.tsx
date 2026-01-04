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
import { Calculator } from './components/Calculator'; // Import Calculator
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

  // Default Settings
  const [settings, setSettings] = useState<WorkshopSettings>(defaultSettings);

  // Load data from local storage
  useEffect(() => {
    const savedOrders = localStorage.getItem('taller_orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error("Error parsing saved orders", e);
      }
    }
    
    const savedExpenses = localStorage.getItem('taller_expenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (e) {
        console.error("Error parsing saved expenses", e);
      }
    }

    const savedAppointments = localStorage.getItem('taller_appointments');
    if (savedAppointments) {
      try {
        setAppointments(JSON.parse(savedAppointments));
      } catch (e) {
        console.error("Error parsing saved appointments", e);
      }
    }

    const savedWinners = localStorage.getItem('taller_winners');
    if (savedWinners) {
        try {
            setRaffleWinners(JSON.parse(savedWinners));
        } catch (e) {
            console.error("Error parsing saved winners", e);
        }
    }

    const savedSettings = localStorage.getItem('taller_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // MERGE with defaults to prevent missing fields issues
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error parsing saved settings", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('taller_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('taller_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('taller_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('taller_winners', JSON.stringify(raffleWinners));
  }, [raffleWinners]);

  useEffect(() => {
    localStorage.setItem('taller_settings', JSON.stringify(settings));
  }, [settings]);

  // Warn user before closing the tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Manual Backup Helper
  const downloadBackup = (currentOrders: WorkOrder[], currentExpenses: Expense[]) => {
      const backupData = {
          date: new Date().toISOString(),
          orders: currentOrders,
          expenses: currentExpenses,
          appointments: appointments,
          settings: settings,
          winners: raffleWinners
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadAnchorNode.setAttribute("download", `taller_respaldo_${timestamp}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const askForBackup = (newOrders: WorkOrder[], newExpenses: Expense[]) => {
      // Small timeout to allow UI to update first
      setTimeout(() => {
          if (window.confirm("Cambios guardados correctamente.\n\n¿Desea descargar una copia de seguridad (Backup) ahora?")) {
              downloadBackup(newOrders, newExpenses);
          }
      }, 100);
  };

  // OT Handlers
  const handleCreateOt = (newOt: WorkOrder) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Logic to set deliveredAt
    if (newOt.status === 'delivered' && !newOt.deliveredAt) {
        newOt.deliveredAt = today;
    } else if (newOt.status !== 'delivered') {
        newOt.deliveredAt = undefined; // Reset if moved back from delivered
    }

    let updatedOrders: WorkOrder[];
    const exists = orders.find(o => o.id === newOt.id);
    
    if (exists) {
        updatedOrders = orders.map(o => o.id === newOt.id ? newOt : o);
    } else {
        updatedOrders = [newOt, ...orders];
    }
    
    setOrders(updatedOrders);
    
    // Ask for backup manually instead of auto
    askForBackup(updatedOrders, expenses);

    setView('list');
    setSelectedOrderId(null);
  };

  const handleDeleteOt = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta OT?')) {
        const updatedOrders = orders.filter(o => o.id !== id);
        setOrders(updatedOrders);
        askForBackup(updatedOrders, expenses);
    }
  };

  const handleEditOt = (id: string) => {
    setSelectedOrderId(id);
    setView('create');
  };

  const handleViewOt = (id: string) => {
    setSelectedOrderId(id);
    setView('details');
  };

  // Reimbursment Handler for OT Items
  const handleToggleOtItemReimbursement = (otId: string, itemId: string) => {
      const today = new Date().toISOString().split('T')[0];
      setOrders(orders.map(o => {
          if (o.id !== otId) return o;
          return {
              ...o,
              items: o.items.map(i => {
                  if (i.id !== itemId) return i;
                  const newStatus = !i.isReimbursed;
                  return { 
                      ...i, 
                      isReimbursed: newStatus,
                      reimbursementDate: newStatus ? today : i.reimbursementDate 
                  };
              })
          };
      }));
  };

  // Maintenance Alert Dismissal
  const handleDismissMaintenance = (otId: string) => {
      if(window.confirm("¿Confirmas que ya contactaste al cliente para su mantención?\nEsto ocultará la alerta.")) {
          setOrders(orders.map(o => {
              if (o.id !== otId) return o;
              return { ...o, maintenanceAlertDismissed: true };
          }));
      }
  };

  // Expense Handlers
  const handleAddExpense = (newExpense: Expense) => {
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    askForBackup(orders, updatedExpenses);
  };

  const handleEditExpense = (updatedExpense: Expense) => {
      const updatedExpenses = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
      setExpenses(updatedExpenses);
      askForBackup(orders, updatedExpenses);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('¿Eliminar este gasto?')) {
        const updatedExpenses = expenses.filter(e => e.id !== id);
        setExpenses(updatedExpenses);
        askForBackup(orders, updatedExpenses);
    }
  };

  // Expense Paid Toggle
  const handleToggleExpensePaid = (id: string) => {
      const today = new Date().toISOString().split('T')[0];
      setExpenses(expenses.map(e => {
        if (e.id === id) {
            const newStatus = !e.isPaid;
            return {
                ...e,
                isPaid: newStatus,
                paymentDate: newStatus ? today : e.paymentDate
            };
        }
        return e;
      }));
  };

  // Appointment Handlers
  const handleAddAppointment = (apt: Appointment) => {
      setAppointments(prev => [...prev, apt]);
  };

  const handleUpdateAppointment = (updatedApt: Appointment) => {
      setAppointments(prev => prev.map(a => a.id === updatedApt.id ? updatedApt : a));
  };

  const handleDeleteAppointment = (id: string) => {
      if(window.confirm("¿Eliminar esta cita?")) {
          setAppointments(prev => prev.filter(a => a.id !== id));
      }
  };

  // Raffle Handlers
  const handleRegisterWinner = (winner: RaffleWinner) => {
      setRaffleWinners(prev => [winner, ...prev]);
  };

  const handleUpdateWinnerStatus = (id: string, isRedeemed: boolean) => {
      setRaffleWinners(prev => prev.map(w => w.id === id ? {
          ...w, 
          isRedeemed,
          redemptionDate: isRedeemed ? new Date().toISOString().split('T')[0] : undefined
      } : w));
  };

  const handleDeleteWinner = (id: string) => {
      if(window.confirm("¿Borrar este ganador del historial?")) {
        setRaffleWinners(prev => prev.filter(w => w.id !== id));
      }
  };


  // Backup & Restore Handlers
  const handleRestoreData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              if (data.orders && Array.isArray(data.orders)) setOrders(data.orders);
              if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
              if (data.appointments && Array.isArray(data.appointments)) setAppointments(data.appointments);
              if (data.winners && Array.isArray(data.winners)) setRaffleWinners(data.winners);
              if (data.settings) setSettings(data.settings);
              alert('Base de datos restaurada con éxito.');
              window.location.reload();
          } catch (error) {
              alert('Error al leer el archivo de respaldo.');
              console.error(error);
          }
      };
      reader.readAsText(file);
  };

  const getSelectedOrder = () => orders.find(o => o.id === selectedOrderId);

  // Router Logic
  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
            <Dashboard 
                orders={orders} 
                expenses={expenses}
                appointments={appointments}
                settings={settings}
                onViewOt={handleViewOt} 
                onToggleOtReimbursement={handleToggleOtItemReimbursement}
                onToggleExpensePaid={handleToggleExpensePaid}
                onDismissMaintenance={handleDismissMaintenance}
                onRestore={handleRestoreData}
            />
        );
      case 'expenses':
        return (
            <ExpenseList 
                expenses={expenses} 
                orders={orders}
                onAdd={handleAddExpense} 
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense} 
            />
        );
      case 'parts':
        return (
            <PartsList orders={orders} />
        );
      case 'agenda':
        return (
            <Agenda 
                appointments={appointments}
                onAdd={handleAddAppointment}
                onUpdate={handleUpdateAppointment}
                onDelete={handleDeleteAppointment}
            />
        );
      case 'raffle':
        return (
            <Raffle 
                orders={orders} 
                winnersHistory={raffleWinners}
                onRegisterWinner={handleRegisterWinner}
                onUpdateWinnerStatus={handleUpdateWinnerStatus}
                onDeleteWinner={handleDeleteWinner}
            />
        );
      case 'calculator': // New Case
        return (
            <Calculator />
        );
      case 'settings':
        return (
            <Settings 
                settings={settings}
                onSave={setSettings}
            />
        );
      case 'create':
        return (
          <OtForm 
            initialData={getSelectedOrder()} 
            existingOrders={orders}
            existingExpenses={expenses}
            onSave={handleCreateOt} 
            onCancel={() => {
                setView('list');
                setSelectedOrderId(null);
            }} 
          />
        );
      case 'details':
        const ot = getSelectedOrder();
        if (!ot) return <div>Error: OT no encontrada</div>;
        return (
          <OtDetail 
            ot={ot}
            settings={settings}
            onBack={() => {
                setView('list');
                setSelectedOrderId(null);
            }} 
          />
        );
      case 'list':
      default:
        return (
          <OtList 
            orders={orders} 
            onView={handleViewOt}
            onEdit={handleEditOt}
            onDelete={handleDeleteOt}
          />
        );
    }
  };

  return (
    <Layout setView={setView} currentView={view}>
      {renderContent()}
    </Layout>
  );
}

export default App;
