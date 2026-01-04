import React from 'react';
import { Wrench, PlusCircle, List, LayoutDashboard, Wallet, PackageSearch, CalendarDays, Settings, Trophy, Calculator } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  setView: (view: ViewState) => void;
  currentView: ViewState;
}

export const Layout: React.FC<LayoutProps> = ({ children, setView, currentView }) => {
  const navItemClass = (viewName: ViewState) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
      currentView === viewName ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const buttonClass = (viewName: ViewState) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
      currentView === viewName ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-blue-700 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setView('dashboard')}
            >
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg font-bold tracking-tight leading-none">Garcia Motors</h1>
                <p className="text-[10px] text-slate-400">Gestión Taller</p>
              </div>
            </div>
            
            <nav className="flex space-x-1 overflow-x-auto items-center no-scrollbar max-w-[70vw] sm:max-w-none">
              <button onClick={() => setView('dashboard')} className={navItemClass('dashboard')}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Panel</span>
              </button>
              
              <button onClick={() => setView('agenda')} className={navItemClass('agenda')}>
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Agenda</span>
              </button>

              <button onClick={() => setView('list')} className={navItemClass('list')}>
                <List className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Listado</span>
              </button>

              <button onClick={() => setView('raffle')} className={navItemClass('raffle')}>
                <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="hidden lg:inline text-yellow-100">Sorteo</span>
              </button>

              <button onClick={() => setView('expenses')} className={navItemClass('expenses')}>
                <Wallet className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Gastos</span>
              </button>

              <button onClick={() => setView('parts')} className={navItemClass('parts')}>
                <PackageSearch className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Stock</span>
              </button>

              <button onClick={() => setView('calculator')} className={navItemClass('calculator')}>
                <Calculator className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Calc</span>
              </button>

              <button onClick={() => setView('create')} className={buttonClass('create')}>
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Nueva</span>
              </button>

              <button onClick={() => setView('settings')} className={navItemClass('settings')} title="Configuración">
                <Settings className="w-4 h-4 shrink-0" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-gray-50 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto no-print pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[10px] sm:text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Garcia Motors Pro. Acceso desde la Nube.
          </p>
        </div>
      </footer>
    </div>
  );
};