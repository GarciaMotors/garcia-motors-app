import React, { useRef } from 'react';
import { ArrowLeft, Car, User, FileDown, PackageCheck, Eye, ScanLine, ExternalLink } from 'lucide-react';
import { WorkOrder, WorkshopSettings, WorkItem, DamagePoint } from '../types';
import { TAX_RATE, STATUS_LABELS } from '../constants';

interface OtDetailProps {
  ot: WorkOrder;
  settings: WorkshopSettings;
  onBack: () => void;
}

// Helper para convertir el SVG string a una URL de imagen válida para <img>
// Esto "rasteriza" el vector y asegura que html2pdf lo vea como una imagen, no como código complejo.
const getCarImageSrc = () => {
    const svgString = `
<svg width="300" height="500" viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000000" stroke-width="2" fill="#f1f5f9">
    <!-- Ruedas -->
    <rect x="35" y="80" width="15" height="45" rx="4" fill="#333333" stroke="none" />
    <rect x="250" y="80" width="15" height="45" rx="4" fill="#333333" stroke="none" />
    <rect x="35" y="360" width="15" height="45" rx="4" fill="#333333" stroke="none" />
    <rect x="250" y="360" width="15" height="45" rx="4" fill="#333333" stroke="none" />

    <!-- Chasis -->
    <path d="M70,40 Q150,25 230,40 C260,50 265,100 265,150 L265,340 C265,420 250,470 230,480 Q150,490 70,480 C50,470 35,420 35,340 L35,150 C35,100 40,50 70,40 Z" fill="#e2e8f0" />

    <!-- Parabrisas -->
    <path d="M75,130 Q150,115 225,130 L240,165 Q150,155 60,165 Z" fill="#cbd5e1" stroke="#000000" />

    <!-- Techo -->
    <path d="M60,165 L55,320 L75,345 Q150,355 225,345 L245,320 L240,165 Z" fill="#ffffff" stroke="#000000" />

    <!-- Luneta -->
    <path d="M75,345 Q150,355 225,345 L215,380 Q150,390 85,380 Z" fill="#cbd5e1" stroke="#000000" />
    
    <!-- Detalles -->
    <line x1="70" y1="40" x2="75" y2="130" stroke="#94a3b8" />
    <line x1="230" y1="40" x2="225" y2="130" stroke="#94a3b8" />
    <line x1="85" y1="380" x2="70" y2="480" stroke="#94a3b8" />
    <line x1="215" y1="380" x2="230" y2="480" stroke="#94a3b8" />
  </g>
  <text x="150" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#000000" font-family="Arial, sans-serif">FRENTE</text>
  <text x="150" y="495" text-anchor="middle" font-size="14" font-weight="bold" fill="#000000" font-family="Arial, sans-serif">ATRÁS</text>
</svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
};

// Reuse Croquis Component for ReadOnly View
const ReadOnlyCarCroquis = ({ points }: { points: DamagePoint[] }) => {
    return (
        // Contenedor fijo para PDF
        <div 
            className="relative mx-auto select-none bg-white rounded-lg border border-slate-300 overflow-hidden"
            style={{ width: '200px', height: '333px' }} 
        >
            {/* SOLUCIÓN FINAL: Usar <img> en lugar de <svg> directo. html2canvas renderiza imágenes mucho mejor. */}
            <img 
                src={getCarImageSrc()} 
                alt="Esquema Vehículo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {/* Damage Points (Estos son DIVs HTML, html2pdf los renderiza sin problemas sobre la imagen) */}
            {points.map(p => (
                <div 
                    key={p.id}
                    className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white z-10"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                    X
                </div>
            ))}
        </div>
    );
};

export const OtDetail: React.FC<OtDetailProps> = ({ ot, settings, onBack }) => {
  
  if (!ot) return <div className="p-8 text-center text-red-600">Error: No se pudo cargar la información de la OT.</div>;

  // --- SAFEGUARDS ---
  const items = Array.isArray(ot.items) ? ot.items : [];
  const client = ot.client || { name: 'Sin Nombre', phone: '' };
  const vehicle = ot.vehicle || { 
      brand: 'Desconocido', model: '', plate: 'XXXXXX', year: '', mileage: '', vin: ''
  };
  
  const safeSettings = {
      name: settings?.name || 'Taller Mecánico',
      subtitle: settings?.subtitle || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
      email: settings?.email || '',
      logoUrl: settings?.logoUrl || undefined
  };

  // --- CALCULATIONS ---
  const displayItems = items.filter(item => (item.unitPrice || 0) > 0 || item.type !== 'expense');
  
  const calculateItemTotal = (item: WorkItem) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      let discountAmount = 0;
      if (item.discountType === 'percent') {
          discountAmount = subtotal * ((item.discount || 0) / 100);
      } else {
          discountAmount = item.discount || 0;
      }
      return Math.max(0, subtotal - discountAmount);
  };

  const partsTotalGross = items
    .filter(i => i.type === 'part')
    .reduce((sum, i) => sum + calculateItemTotal(i), 0);

  const laborTotalGross = items
    .filter(i => i.type === 'labor')
    .reduce((sum, i) => sum + calculateItemTotal(i), 0);

  const totalGross = partsTotalGross + laborTotalGross;
  
  const partsTotalNet = partsTotalGross / (1 + TAX_RATE);
  const laborTotalNet = laborTotalGross / (1 + TAX_RATE);
  
  const totalNet = totalGross / (1 + TAX_RATE);
  const totalIVA = totalGross - totalNet;

  const handleDownloadPdf = () => {
    if (typeof (window as any).html2pdf !== 'undefined') {
        const element = document.getElementById('printable-area');
        const safeName = (safeSettings.name || 'taller').replace(/[^a-z0-9]/gi, '_');
        
        // Optimización de configuración para html2pdf
        const opt = {
          margin:       [5, 5, 5, 5],
          filename:     `OT-${ot.id}_${safeName}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Pequeño delay para asegurar carga de imagenes
        setTimeout(() => {
            (window as any).html2pdf().set(opt).from(element).save();
        }, 200);
        
    } else {
        window.print();
    }
  };

  const hasInspectionData = ot.visualInspectionComments || ot.technicalRecommendations || (ot.damagePoints && ot.damagePoints.length > 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Toolbar (No Print) */}
      <div className="no-print bg-slate-100 p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex gap-2">
            <button 
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800"
            >
              <FileDown className="w-4 h-4" /> Guardar como PDF
            </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="max-w-4xl mx-auto p-8 print:p-6" id="printable-area">
        
        {/* Dynamic Header */}
        <div className="mb-6 bg-black text-white p-6 print:p-4 flex justify-between items-center rounded-sm break-inside-avoid page-break-inside-avoid">
            <div className="flex items-center gap-4">
                {safeSettings.logoUrl && (
                  <img src={safeSettings.logoUrl} alt="Logo" className="h-16 w-16 object-contain bg-white rounded-md p-1" />
                )}
                <div>
                    <div className="flex items-baseline gap-1">
                        <h1 className="text-3xl print:text-2xl font-black italic tracking-tighter uppercase" style={{fontFamily: 'sans-serif'}}>
                            {safeSettings.name}
                        </h1>
                    </div>
                    <p className="text-xs tracking-[0.2em] uppercase mt-1 text-gray-300 font-bold ml-1">
                        {safeSettings.subtitle}
                    </p>
                </div>
            </div>
            <div className="text-right text-sm leading-tight">
                <p className="font-bold text-lg text-gray-100">{safeSettings.name}</p>
                <p className="text-gray-300">{safeSettings.address}</p>
                <p className="text-gray-300">Tel: {safeSettings.phone}</p>
                <p className="text-gray-300">{safeSettings.email}</p>
            </div>
        </div>
        
        {/* Header Metadata */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6 break-inside-avoid page-break-inside-avoid">
            <div className="flex items-center gap-4"></div>
            <div className="text-right">
                <h2 className="text-2xl font-bold text-slate-400">ORDEN DE TRABAJO</h2>
                <h3 className="text-xl font-mono text-slate-900 mt-1">#{ot.id}</h3>
                <div className="mt-2 text-sm">
                    <p><span className="font-semibold">Fecha:</span> {ot.date}</p>
                    {ot.deliveredAt && <p><span className="font-semibold">Entregado:</span> {ot.deliveredAt}</p>}
                    <p><span className="font-semibold">Estado:</span> {STATUS_LABELS[ot.status] || ot.status}</p>
                    <p><span className="font-semibold">Mecánico:</span> {ot.mechanic || 'No Asignado'}</p>
                </div>
            </div>
        </div>

        {/* Client & Vehicle Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6 break-inside-avoid page-break-inside-avoid">
            <div className="border rounded-lg p-4 bg-gray-50 print:bg-white print:border-gray-300">
                <h3 className="font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Cliente
                </h3>
                <div className="space-y-1 text-sm">
                    <p><span className="font-semibold w-24 inline-block">Nombre:</span> {client.name}</p>
                    <p><span className="font-semibold w-24 inline-block">Teléfono:</span> {client.phone}</p>
                </div>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50 print:bg-white print:border-gray-300">
                <h3 className="font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4" /> Vehículo
                </h3>
                <div className="space-y-1 text-sm">
                    <p><span className="font-semibold w-24 inline-block">Vehículo:</span> {vehicle.brand} {vehicle.model}</p>
                    <p><span className="font-semibold w-24 inline-block">Patente:</span> <span className="uppercase border px-1 rounded bg-white">{vehicle.plate}</span></p>
                    <p><span className="font-semibold w-24 inline-block">Año:</span> {vehicle.year}</p>
                    <p><span className="font-semibold w-24 inline-block">Kilometraje:</span> {vehicle.mileage ? `${vehicle.mileage} km` : ''}</p>
                    {vehicle.vin && <p><span className="font-semibold w-24 inline-block">VIN:</span> {vehicle.vin}</p>}
                </div>
            </div>
        </div>

        {/* Description & Scanner Info (Kept together) */}
        <div className="mb-6 grid grid-cols-1 gap-4 break-inside-avoid page-break-inside-avoid">
            <div>
                <h3 className="font-bold text-slate-800 mb-2">Descripción del Servicio / Síntomas:</h3>
                <div className="p-4 bg-gray-50 rounded border text-sm text-gray-700 min-h-[60px] print:bg-white">
                    {ot.description || 'Sin descripción'}
                </div>
            </div>
            
            {ot.hasScanner && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-bold text-blue-800">
                        <ScanLine className="w-5 h-5" />
                        Se Realizó Scanner
                    </div>
                    {ot.scannerLink ? (
                        <div className="text-sm">
                            <span className="font-semibold text-gray-600 mr-2">Reporte:</span>
                            <a href={ot.scannerLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {ot.scannerLink} <ExternalLink className="w-3 h-3 inline ml-1" />
                            </a>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-500 italic">Sin enlace adjunto</span>
                    )}
                </div>
            )}
        </div>

        {/* --- COSTOS (Movido Antes de Inspección) --- */}

        {/* Items Table (Agrupado para no romper página a mitad de encabezado) */}
        <div className="mb-6 break-inside-avoid page-break-inside-avoid">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                Detalle de Costos
                {ot.clientProvidesParts && (
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded border border-gray-300 uppercase flex items-center gap-1">
                        <PackageCheck className="w-3 h-3" /> Cliente trae repuestos
                    </span>
                )}
            </h3>
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-800 text-white print:bg-gray-200 print:text-black">
                        <th className="py-2 px-4 text-left rounded-l-lg print:rounded-none">Descripción</th>
                        <th className="py-2 px-4 text-center">Tipo</th>
                        <th className="py-2 px-4 text-center">Cant.</th>
                        <th className="py-2 px-4 text-right">Precio Unit. (Neto)</th>
                        <th className="py-2 px-4 text-right rounded-r-lg print:rounded-none">Total Neto</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {displayItems.length === 0 && !ot.clientProvidesParts && (
                        <tr>
                            <td colSpan={5} className="py-4 text-center text-gray-500">No hay items cobrables registrados.</td>
                        </tr>
                    )}
                    
                    {ot.clientProvidesParts && (
                        <tr className="bg-gray-50 print:bg-gray-50">
                            <td className="py-3 px-4 italic font-medium text-gray-700" colSpan={3}>
                                ** Cliente trae sus propios repuestos **
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400">-</td>
                            <td className="py-3 px-4 text-right text-gray-400">-</td>
                        </tr>
                    )}

                    {displayItems.map((item, idx) => {
                        const iQty = item.quantity || 0;
                        const iPrice = item.unitPrice || 0;
                        const discount = item.discount || 0;
                        const netUnitPrice = iPrice / (1 + TAX_RATE);
                        
                        let realDiscountAmount = 0;
                        if (item.discountType === 'percent') {
                             realDiscountAmount = (iPrice * iQty) * (discount / 100);
                        } else {
                             realDiscountAmount = discount;
                        }

                        const grossRowTotal = (iPrice * iQty) - realDiscountAmount;
                        const netRowTotal = grossRowTotal / (1 + TAX_RATE);
                        
                        return (
                            <tr key={idx}>
                                <td className="py-3 px-4">
                                    {item.description}
                                    {discount > 0 && (
                                        <div className="text-xs text-red-600 italic mt-0.5">
                                            (Desc: {item.discountType === 'percent' ? `${discount}%` : `$${discount.toLocaleString()}`} 
                                            {item.discountReason ? ` - ${item.discountReason}` : ''})
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-center text-xs uppercase text-gray-500">{item.type === 'part' ? 'Repuesto' : item.type === 'labor' ? 'M. Obra' : 'Gasto'}</td>
                                <td className="py-3 px-4 text-center">{iQty}</td>
                                <td className="py-3 px-4 text-right">${Math.round(netUnitPrice).toLocaleString()}</td>
                                <td className="py-3 px-4 text-right font-medium">${Math.round(netRowTotal).toLocaleString()}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* Financial Summary (Agrupado para no romper página) */}
        <div className="flex justify-end break-inside-avoid page-break-inside-avoid mb-6">
            <div className="w-1/2">
                {!ot.clientProvidesParts && (
                    <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-600">Neto Repuestos:</span>
                        <span>${Math.round(partsTotalNet).toLocaleString()}</span>
                    </div>
                )}
                <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">Neto Mano de Obra:</span>
                    <span>${Math.round(laborTotalNet).toLocaleString()}</span>
                </div>
                
                <div className="border-t my-2"></div>
                
                <div className="flex justify-between py-1 text-sm font-semibold text-gray-800">
                    <span>Total Neto:</span>
                    <span>${Math.round(totalNet).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 text-sm text-gray-600">
                    <span>IVA (19%):</span>
                    <span>${Math.round(totalIVA).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between py-2 mt-2 border-t-2 border-slate-900 text-lg font-bold">
                    <span>TOTAL A PAGAR:</span>
                    <span>${totalGross.toLocaleString()}</span>
                </div>
            </div>
        </div>

        {/* --- INSPECCIÓN Y RECOMENDACIONES (Agrupado para no romper página) --- */}
        {hasInspectionData && (
            <div className="mb-6 border rounded-lg border-gray-300 overflow-hidden break-inside-avoid page-break-inside-avoid">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Inspección y Estado del Vehículo
                </div>
                <div className="p-4 grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                         {ot.visualInspectionComments && (
                            <div>
                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">Observaciones Visuales</h4>
                                <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200 min-h-[40px]">
                                    {ot.visualInspectionComments}
                                </div>
                            </div>
                         )}
                         {ot.technicalRecommendations && (
                            <div>
                                <h4 className="text-xs font-bold uppercase text-green-700 mb-1">Recomendaciones Técnicas</h4>
                                <div className="text-sm bg-green-50 p-2 rounded border border-green-100 min-h-[40px] italic text-gray-700">
                                    {ot.technicalRecommendations}
                                </div>
                            </div>
                         )}
                    </div>
                    <div className="col-span-1 flex flex-col items-center justify-center border-l pl-4">
                        <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 w-full text-center">Croquis de Daños</h4>
                        <ReadOnlyCarCroquis points={ot.damagePoints || []} />
                        {(ot.damagePoints?.length || 0) > 0 && (
                            <span className="text-[10px] text-red-500 mt-1 font-bold">{ot.damagePoints?.length} puntos marcados</span>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Footer / Disclaimer (Agrupado) */}
        <div className="mt-16 text-xs text-gray-400 text-center border-t pt-8 break-inside-avoid page-break-inside-avoid">
            <p>La presente Orden de Trabajo tiene validez de presupuesto por 10 días.</p>
            <p>El taller no se hace responsable por objetos de valor dejados en el vehículo.</p>
            <br />
            <div className="flex justify-between mt-8 px-16">
                <div className="border-t border-gray-400 w-40 pt-2">Firma Cliente</div>
                <div className="border-t border-gray-400 w-40 pt-2">Firma Taller</div>
            </div>
        </div>

      </div>
    </div>
  );
};