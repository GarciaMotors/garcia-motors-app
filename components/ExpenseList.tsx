
import React, { useState, useMemo } from 'react';
import { Trash2, Plus, CheckCircle, XCircle, User, Package, DollarSign, Edit, Save, RotateCcw, LayoutList, FileSpreadsheet, Store, MessageSquare, Wrench, Search, Clock } from 'lucide-react';
import { Expense, ExpenseDocType, ExpenseCategory, WorkOrder } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  orders: WorkOrder[];
  onAdd: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onTogglePaid?: (id: string) => void; // Prop añadida
}

const capitalize = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase());

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, orders, onAdd, onEdit, onDelete, onTogglePaid }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newExpense, setNewExpense] = useState<{
    description: string;
    amount: string;
    type: ExpenseDocType;
    buyerName: string;
    provider: string;
    notes: string;
    isPaid: boolean;
    paymentDate: string;
    category: ExpenseCategory;
  }>({
    description: '',
    amount: '',
    type: 'boleta',
    buyerName: '',
    provider: '',
    notes: '',
    isPaid: false, 
    paymentDate: new Date().toISOString().split('T')[0],
    category: 'general'
  });

  const allMixedExpenses = useMemo(() => {
      const manualItems = expenses.map(e => ({
          ...e,
          sourceType: 'manual' as const,
          sourceId: e.id,
          displayId: e.id
      }));

      const otItems = orders.flatMap(ot => 
          ot.items
            .filter(item => item.type === 'part' && (item.costPrice || 0) > 0)
            .map(item => ({
                id: item.id,
                date: ot.date,
                description: `REPUESTO: ${item.description} (OT #${ot.id})`,
                amount: (item.costPrice || 0) * item.quantity,
                documentType: item.purchaseDocType || 'boleta',
                category: 'insumos' as ExpenseCategory,
                buyerName: item.buyer || 'Taller',
                provider: item.provider || '',
                notes: `Gasto vinculado a OT #${ot.id}`,
                isPaid: item.isBuyerPaid || false,
                paymentDate: ot.date,
                sourceType: 'ot' as const,
                sourceId: ot.id,
                displayId: `OT-${ot.id}`
            }))
      );

      return [...manualItems, ...otItems].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, orders]);

  const filteredExpenses = allMixedExpenses.filter(e => {
      const term = searchTerm.toLowerCase();
      return e.description.toLowerCase().includes(term) ||
             e.buyerName.toLowerCase().includes(term) ||
             e.displayId.toLowerCase().includes(term);
  });

  const generateNextId = () => {
    const maxId = expenses.reduce((max, e) => {
        if (typeof e.id === 'string' && e.id.startsWith('G')) {
            const numPart = parseInt(e.id.substring(1));
            return !isNaN(numPart) && numPart > max ? numPart : max;
        }
        return max;
    }, 5000);
    return `G${maxId + 1}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    if (editingId) {
        onEdit({
            id: editingId,
            date: expenses.find(e => e.id === editingId)?.date || new Date().toISOString().split('T')[0], 
            description: newExpense.description,
            amount: parseInt(newExpense.amount),
            documentType: newExpense.type,
            category: newExpense.category,
            buyerName: newExpense.buyerName,
            provider: newExpense.provider,
            notes: newExpense.notes,
            isPaid: newExpense.isPaid,
            paymentDate: newExpense.paymentDate
        });
        setEditingId(null);
    } else {
        onAdd({
            id: generateNextId(),
            date: new Date().toISOString().split('T')[0],
            description: newExpense.description,
            amount: parseInt(newExpense.amount),
            documentType: newExpense.type,
            category: newExpense.category,
            buyerName: newExpense.buyerName,
            provider: newExpense.provider,
            notes: newExpense.notes,
            isPaid: newExpense.isPaid,
            paymentDate: newExpense.isPaid ? new Date().toISOString().split('T')[0] : undefined
        });
    }

    setNewExpense({
        description: '', amount: '', type: 'boleta', buyerName: '', provider: '', notes: '', isPaid: false, paymentDate: new Date().toISOString().split('T')[0], category: 'general'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className={`p-6 rounded-2xl shadow-sm border ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tighter italic">
            {editingId ? <Edit className="w-5 h-5 text-yellow-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
            {editingId ? 'Editar Gasto' : 'Registrar Nuevo Gasto / Insumo'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Descripción</label>
            <input type="text" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: capitalize(e.target.value)})} className="w-full rounded-xl border-gray-300 p-2 border shadow-sm" placeholder="Ej: Pago arriendo, Insumos limpieza..." />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Monto (Bruto)</label>
            <input type="number" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full rounded-xl border-gray-300 p-2 border font-bold" placeholder="$ 0" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Documento</label>
            <select value={newExpense.type} onChange={e => setNewExpense({...newExpense, type: e.target.value as any})} className="w-full rounded-xl border-gray-300 p-2 border font-bold"><option value="boleta">Boleta</option><option value="factura">Factura</option><option value="cotizacion">Cotización</option></select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Comprador</label>
            <input type="text" required value={newExpense.buyerName} onChange={e => setNewExpense({...newExpense, buyerName: capitalize(e.target.value)})} className="w-full rounded-xl border-gray-300 p-2 border shadow-sm" placeholder="Quien pagó..." />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Categoría</label>
            <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} className="w-full rounded-xl border-gray-300 p-2 border shadow-sm"><option value="general">Gasto Fijo/General</option><option value="insumos">Insumos Taller</option></select>
          </div>
          <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200 mb-0.5">
                  <input type="checkbox" checked={newExpense.isPaid} onChange={e => setNewExpense({...newExpense, isPaid: e.target.checked})} className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-700">Gasto ya pagado</span>
              </label>
          </div>
          <div className="md:col-span-4 flex justify-end gap-3 pt-2">
            {editingId && <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>}
            <button type="submit" className="bg-slate-900 text-white px-8 py-2 rounded-xl text-sm font-black uppercase tracking-tighter shadow-lg hover:bg-slate-800 transition transform active:scale-95">{editingId ? 'Guardar Cambios' : 'Registrar Gasto'}</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-slate-400" /> Movimientos de Caja (Gastos)
            </h2>
            <div className="relative">
                <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Filtrar descripción..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-1 border border-gray-200 rounded-xl text-xs bg-white" />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Fecha</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {filteredExpenses.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-xs font-black text-slate-700 italic">{exp.displayId}</div>
                                <div className="text-[10px] text-gray-400 font-bold">{exp.date}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-800 uppercase tracking-tight">{exp.description}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{exp.buyerName} • {exp.documentType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono font-black text-slate-900">${Math.round(exp.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button 
                                    onClick={() => onTogglePaid && onTogglePaid(exp.id)}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all shadow-sm
                                        ${exp.isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200 animate-pulse'}
                                    `}
                                >
                                    {exp.isPaid ? <CheckCircle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                    {exp.isPaid ? 'Pagado' : 'Pendiente'}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {exp.sourceType === 'manual' && (
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setEditingId(exp.id); setNewExpense({ description: exp.description, amount: exp.amount.toString(), type: exp.documentType, buyerName: exp.buyerName, provider: exp.provider || '', notes: exp.notes || '', isPaid: exp.isPaid, paymentDate: exp.paymentDate || exp.date, category: exp.category || 'general' }); }} className="text-slate-400 hover:text-blue-600 transition p-1"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => onDelete(exp.id)} className="text-slate-400 hover:text-red-600 transition p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                )}
                                {exp.sourceType === 'ot' && (
                                    <span className="text-[9px] text-gray-300 italic">Vínculo OT</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
