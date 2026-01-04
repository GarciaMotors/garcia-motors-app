import React, { useState, useMemo } from 'react';
import { Trash2, Plus, CheckCircle, XCircle, User, Package, DollarSign, Edit, Save, RotateCcw, LayoutList, FileSpreadsheet, Store, MessageSquare, Wrench } from 'lucide-react';
import { Expense, ExpenseDocType, ExpenseCategory, WorkOrder } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  orders: WorkOrder[];
  onAdd: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

// Utility for auto-capitalization (Title Case)
const capitalize = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase());

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, orders, onAdd, onEdit, onDelete }) => {
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

  // 1. Merge Manual Expenses with OT Internal Expenses
  const allMixedExpenses = useMemo(() => {
      // Manual Expenses
      const manualItems = expenses.map(e => ({
          ...e,
          sourceType: 'manual' as const,
          sourceId: e.id,
          displayId: e.id
      }));

      // OT Internal Expenses (Items typed as 'expense' or items with costPrice > 0)
      const otItems = orders.flatMap(ot => 
          ot.items
            .filter(item => item.type === 'expense' && (item.costPrice || 0) > 0)
            .map(item => ({
                id: item.id, // Item ID
                date: ot.date,
                description: item.description,
                amount: (item.costPrice || 0) * item.quantity,
                documentType: item.purchaseDocType || 'boleta',
                category: 'insumos' as ExpenseCategory, // Assume OT expenses are productive
                buyerName: item.buyer || 'N/A',
                provider: item.provider || '',
                notes: `Gasto de OT #${ot.id}`,
                isPaid: item.isReimbursed || false,
                paymentDate: item.reimbursementDate,
                sourceType: 'ot' as const,
                sourceId: ot.id, // OT ID
                displayId: `OT-${ot.id}`
            }))
      );

      return [...manualItems, ...otItems].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, orders]);


  // 2. Filter mixed list
  const filteredExpenses = allMixedExpenses.filter(e => {
      const matchesSearch = searchTerm === '' || 
          e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.provider && e.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
          e.displayId.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
  });

  // Extract unique previous buyers for autocomplete
  const previousBuyers = useMemo(() => {
    const buyers = new Set(expenses.map(e => e.buyerName).filter(Boolean));
    return Array.from(buyers);
  }, [expenses]);

  // Extract unique previous providers for autocomplete
  const previousProviders = useMemo(() => {
    const providers = new Set(expenses.map(e => e.provider).filter(Boolean) as string[]);
    return Array.from(providers);
  }, [expenses]);

  const generateNextId = () => {
    const maxId = expenses.reduce((max, e) => {
        // Look for IDs starting with 'G'
        if (typeof e.id === 'string' && e.id.startsWith('G')) {
            const numPart = parseInt(e.id.substring(1));
            return !isNaN(numPart) && numPart > max ? numPart : max;
        }
        return max;
    }, 5089); // Start checking from 5089 so next is 5090
    return `G${maxId + 1}`;
  };

  const handleInputChange = (field: keyof typeof newExpense) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let value = e.target.value;
      // Apply capitalization to text fields
      if (['description', 'buyerName', 'provider', 'notes'].includes(field as string)) {
          value = capitalize(value);
      }
      setNewExpense(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.buyerName) return;

    if (editingId) {
        // Update existing (Only Manual Expenses can be edited here ideally, or block OT edits)
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
        // Create new with G prefix
        const nextId = generateNextId();
        onAdd({
            id: nextId,
            date: new Date().toISOString().split('T')[0],
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
    }

    // Reset Form
    setNewExpense(prev => ({ 
        ...prev,
        description: '', 
        amount: '', 
        type: 'boleta',
        buyerName: '',
        provider: '',
        notes: '',
        isPaid: false,
        paymentDate: new Date().toISOString().split('T')[0],
        category: 'general'
    }));
  };

  const handleEditClick = (expense: any) => {
      // Prevent editing OT items here (they should be edited in OT)
      if (expense.sourceType === 'ot') {
          alert("Los gastos de Ordenes de Trabajo deben editarse en la sección de OTs.");
          return;
      }

      setEditingId(expense.id);
      setNewExpense({
          description: expense.description,
          amount: expense.amount.toString(),
          type: expense.documentType,
          buyerName: expense.buyerName,
          provider: expense.provider || '',
          notes: expense.notes || '',
          isPaid: expense.isPaid,
          paymentDate: expense.paymentDate || new Date().toISOString().split('T')[0],
          category: expense.category || 'general'
      });
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNewExpense(prev => ({ 
        ...prev,
        description: '', 
        amount: '', 
        type: 'boleta',
        buyerName: '',
        provider: '',
        notes: '', 
        isPaid: false,
        paymentDate: new Date().toISOString().split('T')[0],
        category: 'general'
    }));
  };

  const totalTabExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTabDebt = filteredExpenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Form Area */}
      <div className={`p-6 rounded-xl shadow-sm border border-gray-100 ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700`}>
          {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {editingId ? 'Editar Registro' : 'Registrar Gasto o Insumo'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          
          <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={newExpense.category}
                onChange={handleInputChange('category')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-gray-50 font-medium"
              >
                  <option value="general">Gasto General</option>
                  <option value="insumos">Insumos Taller</option>
              </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              required
              value={newExpense.description}
              onChange={handleInputChange('description')}
              placeholder="Ej: Pago Luz, Aceite..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total (Bruto)</label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                required
                min="1"
                value={newExpense.amount}
                onChange={handleInputChange('amount')}
                className="w-full rounded-md border-gray-300 pl-7 p-2 border focus:border-blue-500 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
            <select
              value={newExpense.type}
              onChange={handleInputChange('type')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
              <option value="cotizacion">Cotización</option>
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Comprador (Quien pagó)</label>
             <input
                type="text"
                list="buyers-list"
                required
                value={newExpense.buyerName}
                onChange={handleInputChange('buyerName')}
                placeholder="Ej: Juan, Mecánico..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
             />
             <datalist id="buyers-list">
                 {previousBuyers.map(buyer => (
                     <option key={buyer} value={buyer} />
                 ))}
             </datalist>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (Donde compró)</label>
             <input
                type="text"
                list="providers-list"
                value={newExpense.provider}
                onChange={handleInputChange('provider')}
                placeholder="Ej: Autoplanet..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
             />
             <datalist id="providers-list">
                 {previousProviders.map(prov => (
                     <option key={prov} value={prov} />
                 ))}
             </datalist>
          </div>
          
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios / Notas</label>
             <textarea
                rows={2}
                value={newExpense.notes}
                onChange={handleInputChange('notes')}
                placeholder="Detalles adicionales..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
             />
          </div>

          <div className="md:col-span-2 flex flex-col justify-end h-full pb-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center">
                    <input
                        id="paid-checkbox"
                        type="checkbox"
                        checked={newExpense.isPaid}
                        onChange={(e) => setNewExpense({...newExpense, isPaid: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="paid-checkbox" className="ml-2 block text-sm text-gray-900">
                        ¿Ya está pagado?
                    </label>
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Pago</label>
                 <input
                    type="date"
                    required
                    value={newExpense.paymentDate}
                    onChange={handleInputChange('paymentDate')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                 />
              </div>
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 mt-2">
            {editingId && (
                <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Cancelar
                </button>
            )}
            <button
              type="submit"
              className={`text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  editingId 
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Guardar Cambios' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-gray-800">
                    Historial de Gastos e Insumos
                </h2>
                <input 
                    type="text" 
                    placeholder="Buscar descripción, proveedor..."
                    className="text-xs border border-gray-300 rounded px-2 py-1 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-right">
                <div className="text-sm text-gray-600">Total: <span className="font-bold text-slate-900">${totalTabExpenses.toLocaleString()}</span></div>
                {totalTabDebt > 0 && (
                     <div className="text-sm text-red-600 font-bold mt-1">Deuda: ${totalTabDebt.toLocaleString()}</div>
                )}
            </div>
        </div>
        
        {/* Table View */}
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor / Comprador</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                No hay registros que coincidan con la búsqueda.
                            </td>
                        </tr>
                    ) : (
                        filteredExpenses.slice().reverse().map((expense) => (
                            <tr key={`${expense.sourceType}-${expense.id}`} className={`transition-colors ${editingId === expense.id ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-bold text-gray-700">{expense.displayId}</div>
                                        {expense.sourceType === 'ot' && (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                                <Wrench className="w-3 h-3" /> OT
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-900">{expense.date}</div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${expense.category === 'insumos' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                        {expense.category || 'general'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                                    <div className="text-xs text-gray-500 uppercase">{expense.documentType}</div>
                                    {expense.notes && (
                                        <div className="text-xs text-gray-500 mt-1 italic flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> {expense.notes}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {expense.provider && (
                                        <div className="flex items-center gap-1 text-sm text-slate-800 font-semibold mb-1">
                                            <Store className="w-3 h-3 text-blue-500" /> {expense.provider}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <User className="w-3 h-3 text-gray-400" /> {expense.buyerName}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-slate-700">
                                        ${expense.amount.toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {expense.isPaid ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3" /> Pagado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                            <XCircle className="w-3 h-3" /> Pendiente
                                        </span>
                                    )}
                                    {expense.isPaid && expense.paymentDate && (
                                        <div className="text-[10px] text-gray-500 mt-1">{expense.paymentDate}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        {expense.sourceType !== 'ot' && (
                                            <>
                                            <button
                                                onClick={() => handleEditClick(expense)}
                                                className="text-yellow-600 hover:text-yellow-900"
                                                title="Editar"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(expense.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            </>
                                        )}
                                    </div>
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