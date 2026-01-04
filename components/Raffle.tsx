import React, { useState, useMemo } from 'react';
import { Trophy, Gift, Target, RotateCcw, PartyPopper, Calendar, Car, DollarSign, Filter, Search, PlusCircle, Wrench, Lock, Unlock, CheckCircle, Clock, Trash2, Type } from 'lucide-react';
import { WorkOrder, RaffleWinner } from '../types';

interface RaffleProps {
  orders: WorkOrder[];
  winnersHistory: RaffleWinner[];
  onRegisterWinner: (winner: RaffleWinner) => void;
  onUpdateWinnerStatus: (id: string, isRedeemed: boolean) => void;
  onDeleteWinner: (id: string) => void;
}

export const Raffle: React.FC<RaffleProps> = ({ orders, winnersHistory, onRegisterWinner, onUpdateWinnerStatus, onDeleteWinner }) => {
  // Filters State
  const [minSpent, setMinSpent] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [plateEnding, setPlateEnding] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  
  // Custom Global Filter
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // Advanced Filter Toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterMechanic, setFilterMechanic] = useState('');
  const [minVisits, setMinVisits] = useState<string>('');

  // Hidden/Magic Filter
  const [showMagicInput, setShowMagicInput] = useState(false);
  const [magicQuery, setMagicQuery] = useState('');

  // Prize Configuration
  const [prizeName, setPrizeName] = useState<string>('Descuento en próximo servicio');
  const [prizeDetail, setPrizeDetail] = useState<string>('');

  // Animation State
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<WorkOrder | null>(null);
  const [displayIndex, setDisplayIndex] = useState(0);

  // Filter Logic
  const eligibleParticipants = useMemo(() => {
    // Determine repeated visits if needed
    const visitCounts = new Map<string, number>();
    if (minVisits) {
        orders.forEach(ot => {
            const key = ot.vehicle.plate;
            visitCounts.set(key, (visitCounts.get(key) || 0) + 1);
        });
    }

    return orders.filter(ot => {
      // 0. MAGIC FILTER (Overrides everything if active and matches)
      if (magicQuery) {
          const q = magicQuery.toLowerCase();
          const matchesMagic = 
            ot.client.name.toLowerCase().includes(q) || 
            ot.vehicle.plate.toLowerCase().includes(q);
          
          if (matchesMagic) return true;
          return false;
      }

      // 1. Filter by Date
      if (dateStart && ot.date < dateStart) return false;
      if (dateEnd && ot.date > dateEnd) return false;

      // 2. Filter by Minimum Spent (Total Gross)
      if (minSpent) {
        const total = ot.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        if (total < parseInt(minSpent)) return false;
      }

      // 3. Filter by Plate Ending
      if (plateEnding) {
         if (!ot.vehicle.plate.endsWith(plateEnding.toUpperCase())) return false;
      }

      // 4. Filter by Service Description / Items
      if (serviceType) {
        const term = serviceType.toLowerCase();
        const inDescription = ot.description?.toLowerCase().includes(term);
        const inItems = ot.items.some(i => i.description.toLowerCase().includes(term));
        if (!inDescription && !inItems) return false;
      }

      // 5. Custom Global Text Filter (Searches everywhere)
      if (customQuery) {
          const term = customQuery.toLowerCase();
          const matchesClient = ot.client.name.toLowerCase().includes(term);
          const matchesVehicle = ot.vehicle.brand.toLowerCase().includes(term) || 
                                 ot.vehicle.model.toLowerCase().includes(term);
          const matchesNotes = ot.notes?.toLowerCase().includes(term);
          const matchesDesc = ot.description?.toLowerCase().includes(term);
          const matchesItems = ot.items.some(i => i.description.toLowerCase().includes(term));
          
          if (!matchesClient && !matchesVehicle && !matchesNotes && !matchesDesc && !matchesItems) {
              return false;
          }
      }

      // 6. Advanced: Mechanic
      if (filterMechanic && ot.mechanic) {
          if (!ot.mechanic.toLowerCase().includes(filterMechanic.toLowerCase())) return false;
      }

      // 7. Advanced: Min Visits
      if (minVisits) {
          const count = visitCounts.get(ot.vehicle.plate) || 0;
          if (count < parseInt(minVisits)) return false;
      }

      return true;
    });
  }, [orders, minSpent, dateStart, dateEnd, plateEnding, serviceType, filterMechanic, minVisits, magicQuery, customQuery]);

  // Spin Logic
  const handleSpin = () => {
    if (eligibleParticipants.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);

    // Simple roulette effect
    let intervalId: any;
    let counter = 0;
    const maxIterations = 30; // How many name flips before stop

    intervalId = setInterval(() => {
        // Just pick a random index for display effect
        const rand = Math.floor(Math.random() * eligibleParticipants.length);
        setDisplayIndex(rand);
        counter++;

        if (counter > maxIterations) {
            clearInterval(intervalId);
            const finalWinnerIndex = Math.floor(Math.random() * eligibleParticipants.length);
            const selectedWinner = eligibleParticipants[finalWinnerIndex];
            setWinner(selectedWinner);
            setIsSpinning(false);
            
            // Register in History
            onRegisterWinner({
                id: Date.now().toString(),
                dateWon: new Date().toISOString().split('T')[0],
                clientName: selectedWinner.client.name,
                clientPhone: selectedWinner.client.phone,
                vehicleInfo: `${selectedWinner.vehicle.brand} ${selectedWinner.vehicle.model} (${selectedWinner.vehicle.plate})`,
                prizeTitle: prizeName,
                prizeDetail: prizeDetail,
                isRedeemed: false
            });
        }
    }, 100);
  };

  const handleReset = () => {
      setWinner(null);
      setIsSpinning(false);
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Sorteos y Concursos</h2>
                <p className="text-sm text-gray-500">Premia a tus clientes fieles</p>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* Left Column: Configuration */}
        <div className="space-y-6">
            
            {/* 1. Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" /> 1. Filtrar Participantes
                    </h3>
                    {/* HIDDEN MAGIC TRIGGER */}
                    <button 
                        onClick={() => setShowMagicInput(!showMagicInput)} 
                        className="text-gray-300 hover:text-gray-400"
                        title="Selección Directa"
                    >
                        {showMagicInput ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    </button>
                </div>

                <div className="space-y-4">
                    {/* MAGIC INPUT */}
                    {showMagicInput && (
                        <div className="bg-purple-50 p-2 rounded border border-purple-200 animate-fade-in">
                            <label className="text-xs font-bold text-purple-700 mb-1 block">Selección Directa (Ganador Específico)</label>
                            <input 
                                type="text" 
                                placeholder="Escribe Nombre exacto o Patente..." 
                                value={magicQuery} 
                                onChange={e => setMagicQuery(e.target.value)} 
                                className="w-full text-sm border border-purple-300 rounded p-2 focus:ring-purple-500" 
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-semibold text-gray-500">Desde</label>
                            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full text-sm border rounded p-2" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500">Hasta</label>
                            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full text-sm border rounded p-2" />
                        </div>
                    </div>
                    
                    {/* CUSTOM GLOBAL FILTER BUTTON & INPUT */}
                    {!showCustomInput && (
                        <button 
                            onClick={() => setShowCustomInput(true)}
                            className="w-full text-xs flex items-center justify-center gap-1 border border-dashed border-gray-300 text-gray-500 py-2 rounded hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition"
                        >
                            <Type className="w-3 h-3" /> + Filtro de Texto Global
                        </button>
                    )}

                    {showCustomInput && (
                        <div className="animate-fade-in relative">
                            <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                <Type className="w-3 h-3" /> Texto Personalizado (Busca en todo)
                            </label>
                            <div className="flex gap-1">
                                <input 
                                    type="text" 
                                    placeholder="Marca, Notas, Detalle..." 
                                    value={customQuery} 
                                    onChange={e => setCustomQuery(e.target.value)} 
                                    className="w-full text-sm border rounded p-2 bg-blue-50/50 focus:bg-white" 
                                />
                                <button 
                                    onClick={() => { setShowCustomInput(false); setCustomQuery(''); }}
                                    className="text-gray-400 hover:text-red-500 px-1"
                                    title="Quitar filtro"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Gasto Mínimo</label>
                        <input type="number" placeholder="Ej: 100000" value={minSpent} onChange={e => setMinSpent(e.target.value)} className="w-full text-sm border rounded p-2" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Car className="w-3 h-3" /> Terminación Patente</label>
                        <input type="text" placeholder="Ej: 9" maxLength={1} value={plateEnding} onChange={e => setPlateEnding(e.target.value)} className="w-full text-sm border rounded p-2 uppercase" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Search className="w-3 h-3" /> Tipo Trabajo / Item</label>
                        <input type="text" placeholder="Ej: Aceite, Frenos..." value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full text-sm border rounded p-2" />
                    </div>

                    {/* Advanced Filters Toggle */}
                    {showAdvanced && (
                        <div className="pt-2 border-t space-y-3 animate-fade-in">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Wrench className="w-3 h-3" /> Mecánico</label>
                                <input type="text" placeholder="Nombre mecánico..." value={filterMechanic} onChange={e => setFilterMechanic(e.target.value)} className="w-full text-sm border rounded p-2" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Mínimo Visitas</label>
                                <input type="number" placeholder="Ej: 3" value={minVisits} onChange={e => setMinVisits(e.target.value)} className="w-full text-sm border rounded p-2" />
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded flex justify-center items-center gap-1"
                    >
                         {showAdvanced ? 'Menos Filtros' : 'Más Filtros'} <PlusCircle className="w-3 h-3" />
                    </button>
                </div>
                
                <div className="mt-4 bg-slate-800 text-white p-3 rounded text-center text-sm font-bold flex flex-col">
                    <span>{eligibleParticipants.length}</span>
                    <span className="text-xs font-normal text-slate-400">Clientes Participantes</span>
                </div>
            </div>

            {/* 2. Prize Config */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <Gift className="w-5 h-5 text-pink-600" /> 2. Configurar Premio
                </h3>
                <div className="space-y-3">
                     <div>
                        <label className="text-xs font-semibold text-gray-500">Título del Premio</label>
                        <input type="text" value={prizeName} onChange={e => setPrizeName(e.target.value)} className="w-full text-sm border rounded p-2 font-medium" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500">Detalle Descuento/Regalo</label>
                        <textarea 
                            rows={3}
                            placeholder="Ej: 50% de descuento en mano de obra para el próximo servicio." 
                            value={prizeDetail} 
                            onChange={e => setPrizeDetail(e.target.value)} 
                            className="w-full text-sm border rounded p-2" 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: The Stage */}
        <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px]">
                
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                     <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500 rounded-full blur-3xl"></div>
                     <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-500 rounded-full blur-3xl"></div>
                </div>

                {!winner && !isSpinning && (
                    <div className="z-10 animate-fade-in">
                        <Target className="w-24 h-24 text-slate-700 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-2">¿Quién será el ganador?</h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Hay <span className="text-yellow-400 font-bold">{eligibleParticipants.length}</span> clientes participantes según tus filtros.
                        </p>
                        
                        <button 
                            onClick={handleSpin}
                            disabled={eligibleParticipants.length === 0}
                            className={`px-8 py-4 rounded-full text-xl font-bold shadow-lg transform transition hover:scale-105 active:scale-95 ${
                                eligibleParticipants.length === 0 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-yellow-500/20'
                            }`}
                        >
                            {eligibleParticipants.length === 0 ? 'Sin Participantes' : '¡Girar Ruleta!'}
                        </button>
                    </div>
                )}

                {isSpinning && (
                    <div className="z-10">
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4 transition-all duration-100">
                             {eligibleParticipants[displayIndex]?.client.name}
                        </div>
                        <p className="text-slate-500">Buscando ganador...</p>
                    </div>
                )}

                {winner && (
                    <div className="z-10 animate-scale-in bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl max-w-lg w-full">
                        <div className="absolute -top-6 -right-6 text-yellow-400 animate-bounce">
                            <PartyPopper className="w-12 h-12" />
                        </div>
                        
                        <div className="text-yellow-400 font-bold tracking-widest uppercase text-sm mb-2">¡Felicidades!</div>
                        
                        <h2 className="text-4xl font-black text-white mb-1">
                            {winner.client.name}
                        </h2>
                        <p className="text-slate-300 text-lg mb-6">{winner.client.phone}</p>

                        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left border border-slate-700">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Vehículo:</span>
                                <span className="text-white font-medium">{winner.vehicle.brand} {winner.vehicle.model}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Patente:</span>
                                <span className="text-white font-medium uppercase">{winner.vehicle.plate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">OT Ganadora:</span>
                                <span className="text-blue-400 font-bold">#{winner.id}</span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-pink-400 font-bold text-sm uppercase mb-1">Premio Ganado</p>
                            <p className="text-white text-xl font-bold">{prizeName}</p>
                            {prizeDetail && <p className="text-slate-300 text-sm mt-1">{prizeDetail}</p>}
                        </div>

                        <button 
                            onClick={handleReset}
                            className="mt-8 text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 mx-auto"
                        >
                            <RotateCcw className="w-4 h-4" /> Nuevo Sorteo
                        </button>
                    </div>
                )}

            </div>
        </div>
      </div>

      {/* --- HISTORY SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" /> Historial de Ganadores
              </h3>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ganador</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premio</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {winnersHistory.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No hay historial de ganadores aún.</td></tr>
                      ) : (
                          winnersHistory.map(w => (
                              <tr key={w.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.dateWon}</td>
                                  <td className="px-6 py-4">
                                      <div className="text-sm font-bold text-gray-900">{w.clientName}</div>
                                      <div className="text-xs text-gray-500">{w.vehicleInfo}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-800">{w.prizeTitle}</div>
                                      <div className="text-xs text-gray-500 italic">{w.prizeDetail}</div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      {w.isRedeemed ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              <CheckCircle className="w-3 h-3" /> Canjeado
                                          </span>
                                      ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              Pendiente
                                          </span>
                                      )}
                                      {w.redemptionDate && <div className="text-[10px] text-gray-400 mt-1">{w.redemptionDate}</div>}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      {!w.isRedeemed && (
                                          <button 
                                            onClick={() => onUpdateWinnerStatus(w.id, true)}
                                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded border border-blue-200 mr-2 transition-colors font-bold"
                                          >
                                              Marcar Realizado
                                          </button>
                                      )}
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onDeleteWinner(w.id);
                                        }}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                        title="Borrar del historial"
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