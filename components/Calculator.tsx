import React, { useState } from 'react';
import { Calculator as CalculatorIcon, Percent, DollarSign, RefreshCw, ArrowRight } from 'lucide-react';
import { TAX_RATE } from '../constants';

export const Calculator = () => {
  // --- STATE FOR STANDARD CALCULATOR ---
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [lastWasResult, setLastWasResult] = useState(false);

  // --- STATE FOR IVA CALCULATOR ---
  const [ivaInput, setIvaInput] = useState('');
  const [ivaResult, setIvaResult] = useState<{net: number, tax: number, gross: number} | null>(null);

  // --- STATE FOR MARGIN CALCULATOR ---
  const [costPrice, setCostPrice] = useState('');
  const [marginPercent, setMarginPercent] = useState('30');
  const [marginResult, setMarginResult] = useState<{price: number, profit: number} | null>(null);

  // --- STANDARD CALCULATOR LOGIC ---
  const handleDigit = (digit: string) => {
    if (lastWasResult) {
      setDisplay(digit);
      setEquation(digit);
      setLastWasResult(false);
    } else {
      if (display === '0') {
        setDisplay(digit);
        setEquation(digit);
      } else {
        setDisplay(display + digit);
        setEquation(equation + digit);
      }
    }
  };

  const handleOperator = (op: string) => {
    setLastWasResult(false);
    if (['+', '-', '*', '/'].includes(equation.slice(-1))) {
       setEquation(equation.slice(0, -1) + op);
    } else {
       setEquation(equation + op);
    }
    setDisplay('');
  };

  const handleEqual = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(equation.replace('x', '*')); // Simple eval for this use case is acceptable in client-side calc
      setDisplay(String(result));
      setEquation(String(result));
      setLastWasResult(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setLastWasResult(false);
  };

  // --- IVA LOGIC ---
  const calculateIvaFromNet = () => {
      const net = parseFloat(ivaInput);
      if (isNaN(net)) return;
      const tax = net * TAX_RATE;
      const gross = net * (1 + TAX_RATE);
      setIvaResult({ net, tax, gross });
  };

  const calculateIvaFromGross = () => {
      const gross = parseFloat(ivaInput);
      if (isNaN(gross)) return;
      const net = gross / (1 + TAX_RATE);
      const tax = gross - net;
      setIvaResult({ net, tax, gross });
  };

  // --- MARGIN LOGIC ---
  const calculateMargin = () => {
      const cost = parseFloat(costPrice);
      const margin = parseFloat(marginPercent);
      if (isNaN(cost) || isNaN(margin)) return;

      // Formula: Price = Cost + (Cost * Margin / 100)
      const profit = cost * (margin / 100);
      const price = cost + profit;
      setMarginResult({ price, profit });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex items-center gap-3 mb-4">
            <CalculatorIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Herramientas de Cálculo</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. CALCULADORA ESTANDAR */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CalculatorIcon className="w-5 h-5 text-gray-500" /> Calculadora Rápida
                </h3>
                
                <div className="bg-slate-900 p-4 rounded-lg mb-4 text-right">
                    <div className="text-slate-400 text-xs h-4">{!lastWasResult ? equation : ''}</div>
                    <div className="text-white text-3xl font-mono font-bold tracking-wider truncate">{display}</div>
                </div>

                <div className="grid grid-cols-4 gap-2 flex-1">
                    {['7','8','9','/'].map(k => (
                        <button key={k} onClick={() => ['/'].includes(k) ? handleOperator(k) : handleDigit(k)} 
                        className={`p-4 rounded font-bold text-xl transition-colors ${['/'].includes(k) ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}>
                            {k}
                        </button>
                    ))}
                    {['4','5','6','*'].map(k => (
                        <button key={k} onClick={() => ['*'].includes(k) ? handleOperator(k) : handleDigit(k)} 
                        className={`p-4 rounded font-bold text-xl transition-colors ${['*'].includes(k) ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}>
                            {k === '*' ? 'x' : k}
                        </button>
                    ))}
                    {['1','2','3','-'].map(k => (
                        <button key={k} onClick={() => ['-'].includes(k) ? handleOperator(k) : handleDigit(k)} 
                        className={`p-4 rounded font-bold text-xl transition-colors ${['-'].includes(k) ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}>
                            {k}
                        </button>
                    ))}
                    <button onClick={handleClear} className="p-4 rounded font-bold text-xl bg-red-100 text-red-700 hover:bg-red-200">C</button>
                    <button onClick={() => handleDigit('0')} className="p-4 rounded font-bold text-xl bg-gray-100 text-slate-700 hover:bg-gray-200">0</button>
                    <button onClick={handleEqual} className="p-4 rounded font-bold text-xl bg-blue-600 text-white hover:bg-blue-700">=</button>
                    <button onClick={() => handleOperator('+')} className="p-4 rounded font-bold text-xl bg-orange-100 text-orange-700 hover:bg-orange-200">+</button>
                </div>
            </div>

            {/* 2. HERRAMIENTAS DE TALLER */}
            <div className="space-y-6">
                
                {/* CALCULADORA IVA */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Percent className="w-5 h-5 text-purple-600" /> Calculadora de IVA (19%)
                    </h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="number" 
                            placeholder="Ingrese Monto..." 
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                            value={ivaInput}
                            onChange={e => setIvaInput(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button onClick={calculateIvaFromNet} className="bg-purple-100 text-purple-700 font-bold py-2 rounded hover:bg-purple-200 text-sm">
                            Tengo Neto <br/> (+ Agregar IVA)
                        </button>
                        <button onClick={calculateIvaFromGross} className="bg-blue-100 text-blue-700 font-bold py-2 rounded hover:bg-blue-200 text-sm">
                            Tengo Bruto <br/> (- Quitar IVA)
                        </button>
                    </div>
                    
                    {ivaResult && (
                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">Valor Neto:</span>
                                <span className="font-mono font-bold">${Math.round(ivaResult.net).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">IVA (19%):</span>
                                <span className="font-mono font-bold text-red-500">${Math.round(ivaResult.tax).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-300 my-2"></div>
                            <div className="flex justify-between text-lg">
                                <span className="font-bold text-slate-700">Total Bruto:</span>
                                <span className="font-mono font-bold text-blue-600">${Math.round(ivaResult.gross).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* CALCULADORA DE MARGEN */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" /> Calcular Precio Venta (Repuestos)
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs text-gray-500 font-bold">Costo Repuesto</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="$ 5000"
                                value={costPrice}
                                onChange={e => setCostPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold">% Margen Deseado</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="30"
                                value={marginPercent}
                                onChange={e => setMarginPercent(e.target.value)}
                            />
                        </div>
                    </div>
                    <button onClick={calculateMargin} className="w-full bg-emerald-600 text-white font-bold py-2 rounded hover:bg-emerald-700 mb-4 flex justify-center items-center gap-2">
                        Calcular Precio <ArrowRight className="w-4 h-4" />
                    </button>

                    {marginResult && (
                        <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-emerald-800">Ganancia Estimada:</span>
                                <span className="font-bold text-emerald-700">+ ${Math.round(marginResult.profit).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl mt-2">
                                <span className="font-bold text-slate-800">Vender a:</span>
                                <span className="font-black text-emerald-700">${Math.round(marginResult.price).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};
