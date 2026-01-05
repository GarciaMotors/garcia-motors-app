
import React, { useState, useMemo } from 'react';
import { Trophy, RotateCcw, PartyPopper, Filter, Trash2, Clock, CheckCircle, ArrowLeft, Lock, LockOpen, Users, UserCheck, CheckSquare, Square } from 'lucide-react';
import { WorkOrder, RaffleWinner } from '../types';

interface RaffleProps {
  orders: WorkOrder[];
  winnersHistory: RaffleWinner[];
  onRegisterWinner: (winner: RaffleWinner) => void;
  onUpdateWinnerStatus: (id: string, isRedeemed: boolean) => void;
  onDeleteWinner: (id: string) => void;
  onBack?: () => void;
}

export const Raffle: React.FC<RaffleProps> = ({ orders, winnersHistory, onRegisterWinner, onUpdateWinnerStatus, onDeleteWinner, onBack }) => {
  const [minSpent, setMinSpent] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [prizeName, setPrizeName] = useState<string>('Descuento en próximo servicio');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<WorkOrder | null>(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [showSecretList, setShowSecretList] = useState(false);
  
  // Estado para selección múltiple
  const [selectedWinners, setSelectedWinners] = useState<Set<string>>(new Set());

  const eligibleParticipants = useMemo(() => {
    return orders.filter(ot => {
      if (dateStart && ot.date < dateStart) return false;
      if (dateEnd && ot.date > dateEnd) return false;
      const total = ot.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      if (minSpent && total < parseInt(minSpent)) return false;
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        const inDescription = ot.description.toLowerCase().includes(lowerKeyword);
        const inItems = ot.items.some(i => i.description.toLowerCase().includes(lowerKeyword));
        if (!inDescription && !inItems) return false;
      }
      return true;
    });
  }, [orders, minSpent, dateStart, dateEnd, keyword]);

  const handleSelectWinner = (win: WorkOrder) => {
    setWinner(win);
    onRegisterWinner({
        id: Date.now().toString(),
        dateWon: new Date().toISOString().split('T')[0],
        clientName: win.client.name,
        clientPhone: win.client.phone,
        vehicleInfo: `${win.vehicle.brand} ${win.vehicle.model} (${win.vehicle.plate})`,
        prizeTitle: prizeName,
        prizeDetail: '',
        isRedeemed: false
    });
  };

  const handleSpin = () => {
    if (eligibleParticipants.length === 0) return;
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
        setDisplayIndex(Math.floor(Math.random() * eligibleParticipants.length));
        counter++;
        if (counter > 30) {
            clearInterval(interval);
            const win = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
            handleSelectWinner(win);
            setIsSpinning(false);
        }
    }, 100);
  };

  // Lógica de selección múltiple
  const toggleSelectWinner = (id: string) => {
    const next = new Set(selectedWinners);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedWinners(next);
  };

  const toggleSelectAll = () => {
    if (selectedWinners.size === winnersHistory.length && winnersHistory.length > 0) {
      setSelectedWinners(new Set());
    } else {
      setSelectedWinners(new Set(winnersHistory.map(w => w.id)));
    }
  };

  const deleteSelected = () => {
    if (selectedWinners.size === 0) return;
    if (window.confirm(`¿Desea eliminar los ${selectedWinners.size} ganadores seleccionados?`)) {
      selectedWinners.forEach(id => {
          // Llamar directamente a la lógica de eliminación sin confirmación individual repetida
          onDeleteWinner(id);
      });
      setSelectedWinners(new Set());
    }
  };

  const handleSingleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Evitar que el clic en el botón active el toggleSelect de la fila
      onDeleteWinner(id);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Sorteo de Fidelización</h2>
          </div>
          {onBack && (
              <button onClick={onBack} className="text-slate-400 hover:text-slate-800 transition-all">
                  <ArrowLeft className="w-6 h-6" />
              </button>
          )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold flex items-center gap-2 text-slate-800"><Filter className="w-4 h-4 text-slate-400" /> Filtros del Concurso</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[9px] font-black uppercase text-gray-400">Desde</label><input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full text-xs border rounded p-2" /></div>
                  <div><label className="text-[9px] font-black uppercase text-gray-400">Hasta</label><input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full text-xs border rounded p-2" /></div>
              </div>

              <div><label className="text-[9px] font-black uppercase text-gray-400">Palabra Clave (Servicio)</label><input type="text" placeholder="Ej: Embrague, Frenos..." value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full text-xs border rounded p-2 bg-blue-50" /></div>
              <div><label className="text-[9px] font-black uppercase text-gray-400">Inversión Mínima OT</label><input type="number" value={minSpent} onChange={e => setMinSpent(e.target.value)} className="w-full text-xs border rounded p-2 font-bold" /></div>
              
              <div className="bg-slate-900 text-white p-6 rounded-2xl text-center shadow-xl border-b-4 border-yellow-400">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total Clientes Aptos</p>
                  <p className="text-5xl font-black italic tracking-tighter">{eligibleParticipants.length}</p>
              </div>

              <button onClick={handleSpin} disabled={isSpinning || eligibleParticipants.length === 0} className="w-full py-5 bg-yellow-400 text-slate-900 rounded-xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">SORTEAR AHORA</button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[500px] text-center relative overflow-hidden shadow-2xl border-4 border-slate-800">
              {isSpinning ? (
                  <div className="text-5xl font-black text-white animate-pulse uppercase tracking-tighter italic">{eligibleParticipants[displayIndex]?.client.name}</div>
              ) : winner ? (
                  <div className="animate-scale-in text-white z-10">
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20"><PartyPopper className="w-full h-full text-yellow-400" /></div>
                      <p className="text-yellow-400 font-black uppercase tracking-[0.5em] text-sm mb-4">¡FELICIDADES!</p>
                      <h2 className="text-6xl font-black uppercase italic mb-2 tracking-tighter text-white">{winner.client.name}</h2>
                      <p className="text-2xl font-bold text-slate-400 mb-8 uppercase tracking-widest">{winner.vehicle.brand} {winner.vehicle.model} ({winner.vehicle.plate})</p>
                      <div className="bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl"><p className="text-[10px] uppercase text-pink-400 font-black tracking-widest mb-1">Premio Ganado</p><p className="text-2xl font-black italic text-white">{prizeName}</p></div>
                      <button onClick={() => {setWinner(null); setIsSpinning(false);}} className="mt-10 text-xs font-black text-slate-500 hover:text-white flex items-center gap-2 mx-auto tracking-widest uppercase border border-slate-700 px-4 py-2 rounded-lg"><RotateCcw className="w-4 h-4" /> REINICIAR</button>
                  </div>
              ) : (
                  <div className="flex flex-col items-center gap-4">
                      <Users className="w-20 h-20 text-slate-700 opacity-20" />
                      <div className="text-slate-700 font-black text-4xl italic uppercase tracking-tighter">Esperando Candidatos</div>
                  </div>
              )}
          </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-black uppercase text-xs tracking-widest text-slate-500">Historial de Ganadores</span>
                {selectedWinners.size > 0 && (
                  <button 
                    onClick={deleteSelected}
                    className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md hover:bg-red-700 transition-colors animate-fade-in"
                  >
                    <Trash2 className="w-3 h-3" /> Borrar Seleccionados ({selectedWinners.size})
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowSecretList(!showSecretList)} 
                className="p-1.5 text-slate-200 hover:text-blue-400 transition-colors"
                title="Configuración Avanzada"
              >
                  {showSecretList ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
          </div>
          
          {showSecretList && (
              <div className="p-4 bg-blue-50 border-b animate-fade-in">
                  <p className="text-[10px] font-black text-blue-800 uppercase mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Lista de Selección Manual de Ganador
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {eligibleParticipants.map(p => (
                          <button 
                            key={p.id} 
                            onClick={() => handleSelectWinner(p)} 
                            className="text-left p-2 bg-white rounded border border-blue-100 hover:border-blue-500 transition-all overflow-hidden"
                          >
                            <div className="text-[10px] font-black uppercase truncate">{p.client.name}</div>
                            <div className="text-[9px] text-gray-400 font-mono">{p.vehicle.plate}</div>
                          </button>
                      ))}
                  </div>
              </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-gray-400">
                    <tr>
                      <th className="px-4 py-4 text-center w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                          {(selectedWinners.size === winnersHistory.length && winnersHistory.length > 0) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">Fecha</th>
                      <th className="px-6 py-4 text-left">Ganador</th>
                      <th className="px-6 py-4 text-left">Vehículo</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y text-xs font-bold">
                    {winnersHistory.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-300">No hay registros aún.</td></tr>
                    ) : (
                        winnersHistory.map(w => (
                            <tr 
                                key={w.id} 
                                className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedWinners.has(w.id) ? 'bg-blue-50' : ''}`} 
                                onClick={() => toggleSelectWinner(w.id)}
                            >
                                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => toggleSelectWinner(w.id)} className={`${selectedWinners.has(w.id) ? 'text-blue-600' : 'text-slate-300'}`}>
                                    {selectedWinners.has(w.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{w.dateWon}</td>
                                <td className="px-6 py-4 uppercase font-black text-slate-900">{w.clientName}</td>
                                <td className="px-6 py-4 text-slate-500">{w.vehicleInfo}</td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => onUpdateWinnerStatus(w.id, !w.isRedeemed)} 
                                      className={`px-3 py-1 rounded-full text-[10px] uppercase font-black shadow-sm ${w.isRedeemed ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}
                                    >
                                      {w.isRedeemed ? 'Entregado' : 'Pendiente'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={(e) => handleSingleDelete(e, w.id)} 
                                      className="text-red-400 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                                      title="Eliminar ganador"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
