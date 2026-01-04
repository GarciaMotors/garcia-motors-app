import { FileText, Users, Wrench, Settings } from "lucide-react";

export const TAX_RATE = 0.19; // 19% IVA

// Mechanics list removed to allow dynamic input

export const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pendiente',
  'in-progress': 'En Progreso',
  'completed': 'Terminado',
  'delivered': 'Entregado'
};

export const STATUS_COLORS: Record<string, string> = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'delivered': 'bg-gray-100 text-gray-800'
};

export const DOC_LABELS: Record<string, string> = {
  'factura': 'Factura',
  'boleta': 'Boleta',
  'cotizacion': 'Solo Cotización'
};