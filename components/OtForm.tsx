import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Save, User, Car, Wrench, Calculator, FileText, TrendingUp, Search, CalendarClock, ShieldAlert, ArrowRight, RotateCcw, PackageCheck, Store, X, Tag, Percent, DollarSign, Eye, AlertTriangle, ScanLine, Link as LinkIcon } from 'lucide-react';
import { WorkOrder, WorkItem, ItemType, DocumentType, Expense, OtType, Vehicle, DamagePoint } from '../types';
import { TAX_RATE, STATUS_LABELS } from '../constants';

interface OtFormProps {
  initialData?: WorkOrder | null;
  existingOrders?: WorkOrder[];
  existingExpenses?: Expense[];
  onSave: (ot: WorkOrder) => void;
  onCancel: () => void;
}

// Utility to capitalize words (Title Case)
const capitalize = (str: string) => {
    return str.replace(/\b\w/g, l => l.toUpperCase());
};

// Utility for currency parsing/formatting
const formatNumber = (num: number | undefined) => {
    if (!num) return '';
    return num.toLocaleString('es-CL');
};

const parseNumber = (str: string) => {
    // Remove dots and non-numeric chars except minus if needed (though usually prices are positive)
    const clean = str.replace(/\./g, '').replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
};

// --- CAR SVG COMPONENT FOR CROQUIS (PROFESSIONAL BLUEPRINT STYLE) ---
const CarCroquis = ({ points, onAddPoint, onRemovePoint, readOnly = false }: { 
    points: DamagePoint[], 
    onAddPoint?: (x: number, y: number) => void,
    onRemovePoint?: (id: string) => void,
    readOnly?: boolean
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (readOnly || !onAddPoint || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onAddPoint(x, y);
    };

    return (
        // IMPORTANT: Aspect ratio fixed to match viewBox 0 0 300 500 (3:5) to prevent point drift
        <div className="relative w-full max-w-[300px] aspect-[3/5] mx-auto select-none bg-white rounded-lg shadow-sm border border-slate-200">
            <svg 
                ref={svgRef}
                viewBox="0 0 300 500" 
                preserveAspectRatio="xMidYMid meet"
                className={`w-full h-full ${!readOnly ? 'cursor-crosshair' : ''}`}
                onClick={handleClick}
            >
                <defs>
                    {/* Gradiente sutil para darle volumen */}
                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor:'#f8fafc', stopOpacity:1}} />
                        <stop offset="50%" style={{stopColor:'#e2e8f0', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#f8fafc', stopOpacity:1}} />
                    </linearGradient>
                    <filter id="dropShadow" height="130%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/> 
                        <feOffset dx="1" dy="1" result="offsetblur"/>
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3"/>
                        </feComponentTransfer>
                        <feMerge> 
                          <feMergeNode/>
                          <feMergeNode in="SourceGraphic"/> 
                        </feMerge>
                    </filter>
                </defs>

                {/* --- TECHNICAL CAR BLUEPRINT --- */}
                <g stroke="#475569" strokeWidth="1.5" fill="url(#bodyGrad)" filter="url(#dropShadow)">
                    
                    {/* Ruedas (Esquemáticas) */}
                    <rect x="35" y="80" width="15" height="45" rx="4" fill="#334155" stroke="none" />
                    <rect x="250" y="80" width="15" height="45" rx="4" fill="#334155" stroke="none" />
                    <rect x="35" y="360" width="15" height="45" rx="4" fill="#334155" stroke="none" />
                    <rect x="250" y="360" width="15" height="45" rx="4" fill="#334155" stroke="none" />

                    {/* Chasis Principal (Curvas Suaves) */}
                    <path d="M70,40 
                             Q150,25 230,40 
                             C260,50 265,100 265,150 
                             L265,340 
                             C265,420 250,470 230,480 
                             Q150,490 70,480 
                             C50,470 35,420 35,340 
                             L35,150 
                             C35,100 40,50 70,40 Z" />

                    {/* Parabrisas Delantero */}
                    <path d="M75,130 
                             Q150,115 225,130 
                             L240,165 
                             Q150,155 60,165 
                             Z" fill="#cbd5e1" stroke="#334155" />

                    {/* Techo y Ventanas Laterales */}
                    <path d="M60,165 
                             L55,320 
                             L75,345 
                             Q150,355 225,345 
                             L245,320 
                             L240,165 
                             Z" fill="#f1f5f9" />

                    {/* Luneta Trasera */}
                    <path d="M75,345 
                             Q150,355 225,345 
                             L215,380 
                             Q150,390 85,380 
                             Z" fill="#cbd5e1" stroke="#334155" />

                    {/* Líneas de Capó */}
                    <path d="M70,40 Q70,100 75,130" fill="none" strokeWidth="1" strokeOpacity="0.5" />
                    <path d="M230,40 Q230,100 225,130" fill="none" strokeWidth="1" strokeOpacity="0.5" />
                    
                    {/* Líneas de Maletero */}
                    <path d="M85,380 Q85,420 70,480" fill="none" strokeWidth="1" strokeOpacity="0.5" />
                    <path d="M215,380 Q215,420 230,480" fill="none" strokeWidth="1" strokeOpacity="0.5" />

                    {/* Espejos Retrovisores */}
                    <path d="M35,155 Q20,150 20,165 Q20,180 35,175 Z" fill="#fff" />
                    <path d="M265,155 Q280,150 280,165 Q280,180 265,175 Z" fill="#fff" />

                    {/* Luces Delanteras */}
                    <path d="M40,55 Q55,65 65,45" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <path d="M260,55 Q245,65 235,45" fill="none" stroke="#f59e0b" strokeWidth="2" />

                    {/* Luces Traseras */}
                    <path d="M40,465 Q55,455 65,475" fill="none" stroke="#ef4444" strokeWidth="2" />
                    <path d="M260,465 Q245,455 235,475" fill="none" stroke="#ef4444" strokeWidth="2" />
                </g>
                
                {/* Etiquetas Guía */}
                <text x="150" y="25" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#94a3b8" letterSpacing="1" fontFamily="monospace">FRENTE</text>
                <text x="150" y="495" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#94a3b8" letterSpacing="1" fontFamily="monospace">ATRÁS</text>
            </svg>

            {/* Puntos de Daño */}
            {points.map(p => (
                <div 
                    key={p.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        if(!readOnly && onRemovePoint) onRemovePoint(p.id);
                    }}
                    className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border border-white shadow-md flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-125 z-10
                        ${readOnly ? 'cursor-default' : ''}
                        ${p.type === 'scratch' ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'}
                    `}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    title={!readOnly ? "Click para borrar" : "Daño registrado"}
                >
                    X
                </div>
            ))}
            
            {!readOnly && points.length === 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-60">
                    <span className="text-[10px] font-bold text-slate-500 bg-white/90 px-2 py-1 rounded border shadow-sm uppercase tracking-wide">
                        Click para marcar daño
                    </span>
                </div>
            )}
        </div>
    );
};


export const OtForm: React.FC<OtFormProps> = ({ initialData, existingOrders = [], existingExpenses = [], onSave, onCancel }) => {
  
  // -- WARRANTY SEARCH STATE --
  const [warrantySearchQuery, setWarrantySearchQuery] = useState('');
  const [foundWarrantyOts, setFoundWarrantyOts] = useState<WorkOrder[]>([]);
  const [isSearchingWarranty, setIsSearchingWarranty] = useState(false);

  // -- CLIENT VEHICLE SELECTION STATE --
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [candidateVehicles, setCandidateVehicles] = useState<{vehicle: Vehicle, clientPhone: string, lastDate: string}[]>([]);


  const [formData, setFormData] = useState<WorkOrder>({
    id: '',
    otType: 'normal',
    parentOtId: '',
    warrantyReason: '',
    date: new Date().toISOString().split('T')[0],
    status: 'in-progress', 
    documentType: 'cotizacion', 
    mechanic: '',
    description: '',
    client: { name: '', phone: '' },
    vehicle: { brand: '', model: '', plate: '', year: '', mileage: '', vin: '' },
    items: [],
    notes: '',
    clientProvidesParts: false,
    isMaintenance: false,
    maintenanceIntervalMonths: 6,
    nextMaintenanceDate: '',
    maintenanceAlertDismissed: false,
    technicalRecommendations: '',
    visualInspectionComments: '',
    damagePoints: [],
    hasScanner: false,
    scannerLink: ''
  });

  // Calculate Next ID on Mount if creating new
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
        // Generate ID starting from 5090
        const maxId = existingOrders.reduce((max, order) => {
            const num = parseInt(order.id);
            return !isNaN(num) && num > max ? num : max;
        }, 5089);
        setFormData(prev => ({ ...prev, id: (maxId + 1).toString() }));
    }
  }, [initialData, existingOrders]);

  // Recalculate next maintenance date when date or interval changes
  useEffect(() => {
      if (formData.isMaintenance && formData.date && formData.maintenanceIntervalMonths) {
          const date = new Date(formData.date);
          date.setMonth(date.getMonth() + parseInt(formData.maintenanceIntervalMonths.toString()));
          setFormData(prev => ({ ...prev, nextMaintenanceDate: date.toISOString().split('T')[0] }));
      }
  }, [formData.isMaintenance, formData.date, formData.maintenanceIntervalMonths]);

  // Extract unique mechanics for autocomplete
  const mechanicsList = useMemo(() => {
    const mechs = new Set(existingOrders.map(o => o.mechanic).filter(Boolean));
    return Array.from(mechs);
  }, [existingOrders]);

  // Extract unique clients/plates for autocomplete lists
  const clientNamesList = useMemo(() => {
      const names = new Set(existingOrders.map(o => o.client.name).filter(Boolean));
      return Array.from(names);
  }, [existingOrders]);

  const platesList = useMemo(() => {
      const plates = new Set(existingOrders.map(o => o.vehicle.plate).filter(Boolean));
      return Array.from(plates);
  }, [existingOrders]);

  // Unified list of buyers (from Expenses module and previous OTs)
  const buyersList = useMemo(() => {
      const buyers = new Set([
          ...existingExpenses.map(e => e.buyerName),
          ...existingOrders.flatMap(o => o.items.map(i => i.buyer))
      ].filter(Boolean) as string[]);
      return Array.from(buyers);
  }, [existingExpenses, existingOrders]);

  // Unified list of providers
  const providersList = useMemo(() => {
      const providers = new Set([
          ...existingExpenses.map(e => e.provider),
          ...existingOrders.flatMap(o => o.items.map(i => i.provider))
      ].filter(Boolean) as string[]);
      return Array.from(providers);
  }, [existingExpenses, existingOrders]);


  // Helper for Capitalized Inputs (Title Case)
  const handleCapitalizedChange = (
      setter: (val: string) => void
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(capitalize(e.target.value));
  };


  // --- INTELLIGENT CLIENT SEARCH ---
  const handleClientNameBlur = () => {
      if (!formData.client.name || formData.otType === 'warranty') return;
      
      const term = formData.client.name.trim().toLowerCase();
      
      // Find all orders for this client name
      const matches = existingOrders.filter(o => o.client.name.trim().toLowerCase() === term);
      
      if (matches.length === 0) return;

      // Group by unique Plate to identify vehicles
      const vehicleMap = new Map<string, {vehicle: Vehicle, clientPhone: string, lastDate: string}>();

      matches.forEach(order => {
          if (order.vehicle && order.vehicle.plate) {
              const key = order.vehicle.plate;
              // We want the most recent info
              if (!vehicleMap.has(key) || new Date(order.date) > new Date(vehicleMap.get(key)!.lastDate)) {
                  vehicleMap.set(key, {
                      vehicle: order.vehicle,
                      clientPhone: order.client.phone,
                      lastDate: order.date
                  });
              }
          }
      });

      const vehicles = Array.from(vehicleMap.values());

      if (vehicles.length === 1) {
          // Only one vehicle found, auto-fill
          const found = vehicles[0];
          setFormData(prev => ({
              ...prev,
              client: { ...prev.client, phone: found.clientPhone },
              vehicle: { ...found.vehicle, mileage: '' }, // Clear mileage for new entry
              mechanic: prev.mechanic // Keep current or suggest logic if needed
          }));
      } else if (vehicles.length > 1) {
          // Multiple vehicles found, show selection modal
          setCandidateVehicles(vehicles);
          setShowVehicleSelector(true);
      }
  };

  const selectVehicleCandidate = (candidate: {vehicle: Vehicle, clientPhone: string}) => {
      setFormData(prev => ({
          ...prev,
          client: { ...prev.client, phone: candidate.clientPhone },
          vehicle: { ...candidate.vehicle, mileage: '' }
      }));
      setShowVehicleSelector(false);
  };

  // Search by Plate (Explicit)
  const handlePlateBlur = () => {
      if (!formData.vehicle.plate || formData.otType === 'warranty') return;
      
      // Find latest order with this plate
      const match = existingOrders
          .filter(o => o.vehicle.plate.trim().toUpperCase() === formData.vehicle.plate.trim().toUpperCase())
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (match) {
           setFormData(prev => ({
              ...prev,
              client: { ...match.client },
              vehicle: { ...match.vehicle, mileage: '', vin: match.vehicle.vin || '' },
              mechanic: prev.mechanic || match.mechanic
           }));
      }
  };


  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = capitalize(e.target.value);
    setFormData(prev => ({ ...prev, client: { ...prev.client, [e.target.name]: val } }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.name === 'plate' || e.target.name === 'vin' ? e.target.value.toUpperCase() : capitalize(e.target.value);
    setFormData(prev => ({ ...prev, vehicle: { ...prev.vehicle, [e.target.name]: val } }));
  };

  const addItem = (type: ItemType) => {
    const newItem: WorkItem = {
      id: Date.now().toString() + Math.random().toString(),
      description: '',
      type,
      quantity: 1,
      unitPrice: 0,
      costPrice: 0,
      discount: 0,
      discountType: 'amount',
      discountReason: '',
      purchaseDocType: 'factura',
      buyer: '',
      provider: ''
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (id: string, field: keyof WorkItem, value: string | number) => {
    // Auto capitalize description, buyer, provider
    if (typeof value === 'string' && (field === 'description' || field === 'buyer' || field === 'provider' || field === 'discountReason')) {
        value = capitalize(value);
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const toggleDiscountType = (id: string) => {
      setFormData(prev => ({
          ...prev,
          items: prev.items.map(item => {
              if (item.id !== id) return item;
              // Toggle between amount and percent
              const newType = item.discountType === 'percent' ? 'amount' : 'percent';
              return { ...item, discountType: newType };
          })
      }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // --- INSPECTION & CROQUIS HANDLERS ---
  const handleAddDamagePoint = (x: number, y: number) => {
      const newPoint: DamagePoint = {
          id: Date.now().toString(),
          x,
          y,
          type: 'dent'
      };
      setFormData(prev => ({
          ...prev,
          damagePoints: [...(prev.damagePoints || []), newPoint]
      }));
  };

  const handleRemoveDamagePoint = (id: string) => {
      setFormData(prev => ({
          ...prev,
          damagePoints: (prev.damagePoints || []).filter(p => p.id !== id)
      }));
  };


  // WARRANTY SEARCH LOGIC
  const handleWarrantySearch = () => {
      if (!warrantySearchQuery) return;
      const term = warrantySearchQuery.toLowerCase();
      const matches = existingOrders.filter(o => 
          o.client.name.toLowerCase().includes(term) || 
          o.vehicle.plate.toLowerCase().includes(term)
      ).sort((a,b) => parseInt(b.id) - parseInt(a.id)); // Newest first
      setFoundWarrantyOts(matches);
      setIsSearchingWarranty(true);
  };

  const selectParentOt = (parent: WorkOrder) => {
      setFormData(prev => ({
          ...prev,
          otType: 'warranty',
          parentOtId: parent.id,
          client: { ...parent.client },
          vehicle: { ...parent.vehicle },
          // Don't copy mechanic directly to 'mechanic' field, but maybe store original for display
          description: `GARANTÍA OT #${parent.id}: `, 
          documentType: 'cotizacion' // Warranties usually internal or zero cost
      }));
      setIsSearchingWarranty(false);
  };

  const cancelWarrantySelection = () => {
      setFormData(prev => ({
          ...prev,
          otType: 'normal',
          parentOtId: '',
          warrantyReason: ''
      }));
  };


  // Calculations
  const calculateItemTotal = (item: WorkItem) => {
      const subtotal = item.quantity * item.unitPrice;
      let discountAmount = 0;
      
      if (item.discountType === 'percent') {
          // Si es porcentaje (ej: 10, es 10%)
          discountAmount = subtotal * ((item.discount || 0) / 100);
      } else {
          // Si es monto fijo
          discountAmount = item.discount || 0;
      }
      return Math.max(0, subtotal - discountAmount);
  };

  // Sum Totals
  const partsTotalGross = formData.items
    .filter(i => i.type === 'part')
    .reduce((sum, i) => sum + calculateItemTotal(i), 0);

  const laborTotalGross = formData.items
    .filter(i => i.type === 'labor')
    .reduce((sum, i) => sum + calculateItemTotal(i), 0);

  const totalGross = partsTotalGross + laborTotalGross; 
  
  const totalNet = totalGross / (1 + TAX_RATE);
  const totalIVA = totalGross - totalNet;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Get original mechanic if warranty
  const originalMechanic = formData.parentOtId 
     ? existingOrders.find(o => o.id === formData.parentOtId)?.mechanic 
     : '';

  return (
    <div className="animate-fade-in pb-20 relative">
      
      {/* VEHICLE SELECTION MODAL */}
      {showVehicleSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg animate-fade-in">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <Car className="w-5 h-5 text-blue-600" />
                          Seleccionar Vehículo
                      </h3>
                      <button onClick={() => setShowVehicleSelector(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                      El cliente <strong>{formData.client.name}</strong> tiene varios vehículos registrados. ¿Cuál desea utilizar?
                  </p>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                      {candidateVehicles.map((c, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => selectVehicleCandidate(c)}
                            className="flex items-center justify-between border border-gray-200 p-3 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition"
                          >
                              <div>
                                  <div className="font-bold text-gray-800">{c.vehicle.brand} {c.vehicle.model}</div>
                                  <div className="text-sm text-gray-500">{c.vehicle.year} • {c.clientPhone}</div>
                              </div>
                              <div className="bg-gray-100 border border-gray-300 px-2 py-1 rounded text-sm font-mono font-bold uppercase">
                                  {c.vehicle.plate}
                              </div>
                          </div>
                      ))}
                  </div>
                  <button 
                    onClick={() => setShowVehicleSelector(false)}
                    className="mt-6 w-full py-2 bg-gray-100 text-gray-600 font-medium rounded hover:bg-gray-200"
                  >
                      Usar otro / Ingresar nuevo
                  </button>
              </div>
          </div>
      )}


      {/* Type Selector at Top (Only if new) */}
      {!initialData && !formData.parentOtId && (
          <div className="mb-6 flex gap-4 justify-center">
              <button 
                  type="button"
                  onClick={() => setFormData({...formData, otType: 'normal'})}
                  className={`px-6 py-3 rounded-lg border-2 font-bold flex items-center gap-2 ${formData.otType === 'normal' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500'}`}
              >
                  <Wrench className="w-5 h-5" /> Trabajo Normal
              </button>
              <button 
                  type="button"
                  onClick={() => setFormData({...formData, otType: 'warranty'})}
                  className={`px-6 py-3 rounded-lg border-2 font-bold flex items-center gap-2 ${formData.otType === 'warranty' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-500'}`}
              >
                  <ShieldAlert className="w-5 h-5" /> Ingreso por Garantía
              </button>
          </div>
      )}

      {/* WARRANTY SEARCH UI */}
      {formData.otType === 'warranty' && !formData.parentOtId && (
           <div className="bg-white p-8 rounded-xl shadow-md border border-orange-200 text-center max-w-2xl mx-auto">
               <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ShieldAlert className="w-8 h-8 text-orange-600" />
               </div>
               <h2 className="text-xl font-bold text-gray-800 mb-2">Seleccionar Trabajo Original</h2>
               <p className="text-gray-500 mb-6">Busque el cliente o patente para encontrar la OT original que tiene garantía.</p>
               
               <div className="flex gap-2 mb-6">
                   <input 
                       type="text" 
                       placeholder="Buscar por Nombre Cliente o Patente..." 
                       className="flex-1 border border-gray-300 rounded-md px-4 py-2"
                       value={warrantySearchQuery}
                       onChange={e => setWarrantySearchQuery(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleWarrantySearch()}
                   />
                   <button 
                       onClick={handleWarrantySearch}
                       className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700"
                   >
                       Buscar
                   </button>
               </div>

               {isSearchingWarranty && (
                   <div className="text-left space-y-3 max-h-60 overflow-y-auto">
                       {foundWarrantyOts.length === 0 ? (
                           <p className="text-center text-gray-400">No se encontraron órdenes.</p>
                       ) : (
                           foundWarrantyOts.map(ot => (
                               <div key={ot.id} className="border border-gray-200 p-4 rounded-lg hover:bg-orange-50 cursor-pointer transition flex justify-between items-center group" onClick={() => selectParentOt(ot)}>
                                   <div>
                                       <div className="font-bold text-gray-800 flex items-center gap-2">
                                           OT #{ot.id} <span className="text-xs font-normal text-gray-500">{ot.date}</span>
                                       </div>
                                       <div className="text-sm text-gray-600">
                                           {ot.client.name} - {ot.vehicle.brand} {ot.vehicle.model} ({ot.vehicle.plate})
                                       </div>
                                   </div>
                                   <div className="text-orange-600 opacity-0 group-hover:opacity-100 font-bold text-sm flex items-center gap-1">
                                       Seleccionar <ArrowRight className="w-4 h-4" />
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               )}
               
               <button onClick={cancelWarrantySelection} className="mt-6 text-sm text-gray-500 underline hover:text-gray-800">
                   Cancelar y volver a Trabajo Normal
               </button>
           </div>
      )}

      {/* MAIN FORM */}
      {(formData.otType === 'normal' || (formData.otType === 'warranty' && formData.parentOtId)) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header Info (OT ID, Date, etc) */}
            <div className={`p-6 rounded-xl shadow-sm border ${formData.otType === 'warranty' ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-gray-100'}`}>
                
                {formData.otType === 'warranty' && (
                    <div className="mb-4 bg-orange-100 text-orange-800 p-3 rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold">
                            <ShieldAlert className="w-5 h-5" />
                            Aplicando Garantía a OT #{formData.parentOtId}
                        </div>
                        <button type="button" onClick={cancelWarrantySelection} className="text-xs underline hover:text-orange-900">Cambiar</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número OT</label>
                        <input
                        type="text"
                        readOnly
                        value={formData.id}
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                        <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        >
                        <option value="pending">Pendiente</option>
                        <option value="in-progress">En Progreso</option>
                        <option value="completed">Terminado</option>
                        <option value="delivered">Entregado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
                        <select
                        value={formData.documentType}
                        onChange={e => setFormData({...formData, documentType: e.target.value as DocumentType})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-blue-50 text-blue-900 font-medium"
                        >
                        <option value="cotizacion">Solo Cotización</option>
                        <option value="boleta">Boleta</option>
                        <option value="factura">Factura</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN DATOS CLIENTE Y VEHICULO (RESTAURADA) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Datos Cliente */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" /> 
                        Datos del Cliente
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input
                                type="text"
                                name="name"
                                required
                                list="client-names"
                                value={formData.client.name}
                                onChange={handleClientChange}
                                onBlur={handleClientNameBlur}
                                placeholder="Buscar o escribir nombre..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                            <datalist id="client-names">
                                {clientNamesList.map((name, i) => <option key={i} value={name} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.client.phone}
                                onChange={handleClientChange}
                                placeholder="+56 9 1234 5678"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>
                </div>

                {/* Datos Vehículo */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Car className="w-5 h-5 text-blue-600" /> 
                        Datos del Vehículo
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* 1. Patente */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Patente</label>
                            <input
                                type="text"
                                name="plate"
                                required
                                list="plates-list"
                                value={formData.vehicle.plate}
                                onChange={handleVehicleChange}
                                onBlur={handlePlateBlur}
                                placeholder="ABCD12"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border uppercase font-mono font-bold"
                            />
                            <datalist id="plates-list">
                                {platesList.map((p, i) => <option key={i} value={p} />)}
                            </datalist>
                        </div>
                        
                        {/* 2. Marca */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Marca</label>
                            <input
                                type="text"
                                name="brand"
                                required
                                value={formData.vehicle.brand}
                                onChange={handleVehicleChange}
                                placeholder="Toyota"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>
                        
                        {/* 3. Modelo */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Modelo</label>
                            <input
                                type="text"
                                name="model"
                                required
                                value={formData.vehicle.model}
                                onChange={handleVehicleChange}
                                placeholder="Yaris"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                         {/* 4. Año */}
                         <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Año</label>
                            <input
                                type="number"
                                name="year"
                                value={formData.vehicle.year}
                                onChange={handleVehicleChange}
                                placeholder="2020"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        {/* 5. Kilometraje */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Kilometraje</label>
                            <input
                                type="number"
                                name="mileage"
                                value={formData.vehicle.mileage}
                                onChange={handleVehicleChange}
                                placeholder="Ej: 150000"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        {/* 6. VIN (Opcional) */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">VIN (Opcional)</label>
                            <input
                                type="text"
                                name="vin"
                                value={formData.vehicle.vin || ''}
                                onChange={handleVehicleChange}
                                placeholder="Chasis..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border uppercase"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mechanic, Description & Scanner Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Mechanic Selection */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {formData.otType === 'warranty' ? 'Mecánico Garantía' : 'Mecánico Asignado'}
                        </label>
                        <input 
                            list="mechanics-list"
                            value={formData.mechanic}
                            onChange={handleCapitalizedChange((val) => setFormData({...formData, mechanic: val}))}
                            placeholder="Escriba o seleccione un mecánico..."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <datalist id="mechanics-list">
                            {mechanicsList.map((mech, idx) => (
                                <option key={idx} value={mech} />
                            ))}
                        </datalist>
                    </div>

                    {/* Original Mechanic Display (Warranty Only) */}
                    {formData.otType === 'warranty' && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500">Mecánico Original (OT #{formData.parentOtId})</label>
                            <div className="mt-1 block w-full rounded-md bg-gray-100 border border-gray-200 text-gray-700 sm:text-sm p-2">
                                {originalMechanic || 'No registrado'}
                            </div>
                        </div>
                    )}
                    
                    {/* Warranty Reason */}
                    {formData.otType === 'warranty' && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-orange-700">Motivo de la Garantía</label>
                            <input
                                type="text"
                                required
                                value={formData.warrantyReason || ''}
                                onChange={handleCapitalizedChange((val) => setFormData({...formData, warrantyReason: val}))}
                                placeholder="¿Qué falló? ¿Por qué volvió el cliente?"
                                className="mt-1 block w-full rounded-md border-orange-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                            />
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Trabajo / Síntomas</label>
                        <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={handleCapitalizedChange((val) => setFormData({...formData, description: val}))}
                        placeholder="Describa el trabajo a realizar..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>

                    {/* Scanner Option */}
                    <div className="md:col-span-2 border-t pt-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="hasScanner"
                                    checked={formData.hasScanner || false}
                                    onChange={(e) => setFormData({...formData, hasScanner: e.target.checked})}
                                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="hasScanner" className="font-semibold text-gray-800 flex items-center gap-2 cursor-pointer">
                                    <ScanLine className="w-5 h-5 text-blue-500" />
                                    ¿Realizó Scanner?
                                </label>
                            </div>
                            
                            {formData.hasScanner && (
                                <div className="flex-1 w-full animate-fade-in flex gap-2 items-center">
                                    <LinkIcon className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="url"
                                        placeholder="Pegar link de descarga del reporte scanner..."
                                        value={formData.scannerLink || ''}
                                        onChange={(e) => setFormData({...formData, scannerLink: e.target.value})}
                                        className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-blue-50"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Items (MOVED UP: Before Inspection) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-600" /> 
                        Detalle de Costos {formData.otType === 'warranty' && <span className="text-orange-600 text-sm">(Garantía)</span>}
                    </h2>
                    
                    {/* Client Provides Parts Toggle */}
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                        <input 
                            type="checkbox" 
                            id="clientProvidesParts"
                            checked={formData.clientProvidesParts || false}
                            onChange={(e) => setFormData(prev => ({...prev, clientProvidesParts: e.target.checked}))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="clientProvidesParts" className="text-sm font-medium text-gray-700 flex items-center gap-1 cursor-pointer">
                            <PackageCheck className="w-4 h-4 text-gray-500" />
                            Cliente trae repuestos
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            type="button" 
                            onClick={() => addItem('part')} 
                            disabled={formData.clientProvidesParts}
                            className={`text-sm px-3 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                                formData.clientProvidesParts 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                        >
                            + Repuesto
                        </button>
                        <button type="button" onClick={() => addItem('labor')} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md border border-indigo-200 hover:bg-indigo-100">
                            + Mano Obra
                        </button>
                        <button type="button" onClick={() => addItem('expense')} className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded-md border border-red-200 hover:bg-red-100">
                            + Gasto OT
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Tipo</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Cant.</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-40 bg-orange-50">Gasto Interno (Monto/Quién)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Precio (Cliente)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Descuento</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Total (Cliente)</th>
                                <th className="px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {formData.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-400 italic">
                                        No hay items agregados. Presione los botones superiores para agregar costos.
                                    </td>
                                </tr>
                            )}
                            {formData.items.map((item) => (
                                <tr key={item.id} className={item.type === 'expense' ? 'bg-red-50/50' : ''}>
                                    <td className="px-3 py-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                            ${item.type === 'part' ? 'bg-emerald-100 text-emerald-800' : 
                                            item.type === 'labor' ? 'bg-indigo-100 text-indigo-800' : 
                                            'bg-red-100 text-red-800'}`}>
                                            {item.type === 'part' ? 'Repuesto' : item.type === 'labor' ? 'Mano Obra' : 'Gasto Interno'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            placeholder={item.type === 'expense' ? "Ej: Combustible, Torno..." : "Descripción"}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1 border"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1 border"
                                        />
                                    </td>
                                    {/* Columna Gasto Interno (SOLO PARA TIPO EXPENSE) */}
                                    <td className="px-3 py-2 bg-orange-50">
                                        {item.type === 'expense' ? (
                                            <div className="flex flex-col gap-1">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={formatNumber(item.costPrice)}
                                                        onChange={(e) => updateItem(item.id, 'costPrice', parseNumber(e.target.value))}
                                                        placeholder="$ Costo"
                                                        className="block w-full border-orange-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm p-1 border"
                                                    />
                                                </div>
                                                <div className="flex gap-1">
                                                    <input
                                                        list="buyers-list"
                                                        value={item.buyer || ''}
                                                        onChange={(e) => updateItem(item.id, 'buyer', e.target.value)}
                                                        placeholder="Comprador..."
                                                        className="block w-1/2 border-orange-200 text-orange-800 text-xs rounded-md shadow-sm p-1 border bg-orange-50"
                                                    />
                                                    <datalist id="buyers-list">
                                                        {buyersList.map((b, i) => <option key={i} value={b} />)}
                                                    </datalist>
                                                    
                                                    {/* ADDED: Provider input for Expenses in OT */}
                                                    <input
                                                        list="providers-list"
                                                        value={item.provider || ''}
                                                        onChange={(e) => updateItem(item.id, 'provider', e.target.value)}
                                                        placeholder="Proveedor..."
                                                        className="block w-1/2 border-orange-200 text-orange-800 text-xs rounded-md shadow-sm p-1 border bg-orange-50"
                                                    />
                                                     <datalist id="providers-list">
                                                        {providersList.map((p, i) => <option key={i} value={p} />)}
                                                    </datalist>
                                                </div>
                                                <select
                                                    value={item.purchaseDocType || 'factura'}
                                                    onChange={(e) => updateItem(item.id, 'purchaseDocType', e.target.value)}
                                                    className="block w-full border-orange-200 text-orange-800 text-xs rounded-md shadow-sm p-1 border bg-orange-50 mt-1"
                                                >
                                                    <option value="factura">Factura</option>
                                                    <option value="boleta">Boleta</option>
                                                    <option value="cotizacion">Cotización</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic text-center block py-2 select-none">No aplica</span>
                                        )}
                                    </td>
                                    {/* Columna Precio Venta Final */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={formatNumber(item.unitPrice)}
                                            onChange={(e) => updateItem(item.id, 'unitPrice', parseNumber(e.target.value))}
                                            placeholder="0"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1 border"
                                        />
                                        {formData.otType === 'warranty' && (
                                            <span className="text-[10px] text-gray-500 block text-center">Generalmente $0 en Garantía</span>
                                        )}
                                    </td>
                                    {/* New Discount Column with Toggle */}
                                    <td className="px-3 py-2">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    type="button"
                                                    onClick={() => toggleDiscountType(item.id)}
                                                    className={`p-1.5 rounded border text-xs font-bold w-8 h-8 flex items-center justify-center transition-colors ${
                                                        item.discountType === 'percent' 
                                                        ? 'bg-purple-100 text-purple-700 border-purple-300' 
                                                        : 'bg-green-100 text-green-700 border-green-300'
                                                    }`}
                                                    title={item.discountType === 'percent' ? "Cambiar a Monto ($)" : "Cambiar a Porcentaje (%)"}
                                                >
                                                    {item.discountType === 'percent' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                                                </button>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={formatNumber(item.discount)}
                                                        onChange={(e) => updateItem(item.id, 'discount', parseNumber(e.target.value))}
                                                        placeholder={item.discountType === 'percent' ? "%" : "$"}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs p-1 border text-right pr-2"
                                                    />
                                                </div>
                                            </div>
                                            {(item.discount || 0) > 0 && (
                                                <input
                                                    type="text"
                                                    value={item.discountReason || ''}
                                                    onChange={(e) => updateItem(item.id, 'discountReason', e.target.value)}
                                                    placeholder="Motivo (Opcional)"
                                                    className="block w-full border-gray-200 bg-gray-50 rounded-md text-[10px] p-1 border"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-700 font-medium">
                                        ${calculateItemTotal(item).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mt-6 flex justify-end gap-6">
                    <div className="w-full sm:w-1/2 lg:w-1/3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="mb-4 pb-2 border-b border-gray-300 flex justify-between items-center">
                        <span className="text-xs uppercase font-bold text-gray-500">Tipo Documento:</span>
                        <span className="text-sm font-bold bg-white px-2 py-1 rounded border shadow-sm">
                            {formData.documentType === 'cotizacion' && 'Cotización (Ref.)'}
                            {formData.documentType === 'boleta' && 'Boleta'}
                            {formData.documentType === 'factura' && 'Factura'}
                        </span>
                        </div>
                        {/* Note: In the list, prices are GROSS. We show Gross totals here now. */}
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Total Repuestos (Bruto):</span>
                            <span className="font-medium">${partsTotalGross.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Total Mano de Obra (Bruto):</span>
                            <span className="font-medium">${laborTotalGross.toLocaleString()}</span>
                        </div>
                        
                        <div className="border-t border-gray-300 mt-2 pt-2 text-sm text-gray-500">
                            <div className="flex justify-between py-1">
                                <span>Neto:</span>
                                <span>${Math.round(totalNet).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>IVA (19%):</span>
                                <span>${Math.round(totalIVA).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex justify-between py-3 mt-2 bg-blue-600 text-white rounded px-3">
                            <span className="font-bold text-lg">Total a Pagar:</span>
                            <span className="font-bold text-lg">${totalGross.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* INSPECCIÓN VISUAL Y RECOMENDACIONES (New Position: After Items) */}
            <div className="p-6 rounded-xl shadow-sm border bg-white border-gray-100">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    Inspección Visual y Recomendaciones
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Textos */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                Comentarios Revisión Visual
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 rounded-full">Se imprimirá en PDF</span>
                            </label>
                            <textarea
                                rows={4}
                                value={formData.visualInspectionComments || ''}
                                onChange={handleCapitalizedChange((val) => setFormData({...formData, visualInspectionComments: val}))}
                                placeholder="Ej: Neumáticos desgastados, foco trasero trizado, pintura quemada..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                Recomendaciones Técnicas al Cliente
                                <span className="text-[10px] bg-green-50 text-green-700 px-2 rounded-full">Se imprimirá en PDF</span>
                            </label>
                            <textarea
                                rows={4}
                                value={formData.technicalRecommendations || ''}
                                onChange={handleCapitalizedChange((val) => setFormData({...formData, technicalRecommendations: val}))}
                                placeholder="Ej: Realizar cambio de pastillas de freno en 5.000km, Revisar nivel de aceite semanalmente..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border bg-green-50/20"
                            />
                        </div>
                    </div>

                    {/* Columna Derecha: Croquis */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                            Croquis de Daños (Haga clic para marcar)
                            <span className="text-xs font-normal text-gray-400">{formData.damagePoints?.length || 0} puntos marcados</span>
                        </label>
                        <CarCroquis 
                            points={formData.damagePoints || []} 
                            onAddPoint={handleAddDamagePoint} 
                            onRemovePoint={handleRemoveDamagePoint} 
                        />
                        <p className="text-xs text-center text-gray-400 mt-2">
                            Marque abolladuras, rayones o golpes existentes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Maintenance Section (Only for Normal OTs typically, but kept logic generic) */}
            <div className={`p-6 rounded-xl shadow-sm border transition-colors ${formData.isMaintenance ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <CalendarClock className={`w-5 h-5 ${formData.isMaintenance ? 'text-orange-600' : 'text-gray-400'}`} />
                    <h2 className={`text-lg font-semibold ${formData.isMaintenance ? 'text-orange-800' : 'text-gray-500'}`}>
                        Programación de Mantención
                    </h2>
                    <div className="ml-auto flex items-center">
                        <input 
                            type="checkbox" 
                            id="isMaintenance"
                            checked={formData.isMaintenance || false}
                            onChange={e => setFormData(prev => ({...prev, isMaintenance: e.target.checked}))}
                            className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isMaintenance" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                            ¿Es Trabajo de Mantención?
                        </label>
                    </div>
                </div>
                
                {formData.isMaintenance && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Avisar próxima mantención en:</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.maintenanceIntervalMonths}
                                    onChange={e => setFormData(prev => ({...prev, maintenanceIntervalMonths: parseInt(e.target.value)}))}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    Meses
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha Calculada Próxima Mantención</label>
                            <input
                                type="date"
                                readOnly
                                value={formData.nextMaintenanceDate || ''}
                                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-600 sm:text-sm font-bold"
                            />
                            <p className="text-xs text-orange-600 mt-1">
                                * Se generará una alerta en el panel 30 días antes de esta fecha.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 sticky bottom-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Guardar Orden
                </button>
            </div>
          </form>
      )}
    </div>
  );
};