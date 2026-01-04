
export type ItemType = 'part' | 'labor' | 'expense';
export type DocumentType = 'factura' | 'boleta' | 'cotizacion';
export type ExpenseDocType = 'factura' | 'boleta' | 'cotizacion';
export type ExpenseCategory = 'general' | 'insumos';
export type OtType = 'normal' | 'warranty';

export interface WorkItem {
  id: string;
  description: string;
  type: ItemType;
  quantity: number;
  unitPrice: number; // Precio Venta FINAL (IVA incluido) - Para cliente
  costPrice?: number; // Precio Costo (Solo para Gasto Interno)
  purchaseDocType?: DocumentType; // Con qué documento compramos este repuesto/gasto
  buyer?: string; // Quien realizó el gasto (Solo para Gasto Interno)
  provider?: string; // Proveedor donde se compró el repuesto
  isReimbursed?: boolean; // Si el taller ya le pagó a quien compró el repuesto
  reimbursementDate?: string; // Fecha cuando se devolvió el dinero
  
  // New Discount Fields
  discount?: number; // Monto o Porcentaje
  discountType?: 'amount' | 'percent'; // Tipo de descuento
  discountReason?: string; // Motivo
}

export interface DamagePoint {
    id: string;
    x: number; // Percentage X
    y: number; // Percentage Y
    type: 'scratch' | 'dent' | 'other';
    note?: string;
}

export interface Client {
  name: string;
  phone: string;
}

export interface Vehicle {
  brand: string; // Marca
  model: string; // Modelo
  plate: string; // Patente
  year: string; // Año
  mileage: string; // Kilometraje
  vin?: string; // VIN (Chasis) Opcional
}

export interface WorkOrder {
  id: string; // OT Number
  otType?: OtType; // Normal or Warranty
  parentOtId?: string; // If warranty, which OT is the origin
  warrantyReason?: string; // Description of the warranty claim
  date: string; // Fecha creation
  deliveredAt?: string; // Fecha real de entrega (YYYY-MM-DD)
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  documentType: DocumentType;
  client: Client;
  vehicle: Vehicle;
  mechanic: string;
  description: string; // General description of issue
  items: WorkItem[];
  notes?: string;
  clientProvidesParts?: boolean; // Flag if client brings their own parts
  // Maintenance Fields
  isMaintenance?: boolean;
  maintenanceIntervalMonths?: number;
  nextMaintenanceDate?: string; // Calculated date
  maintenanceAlertDismissed?: boolean; // To hide alert after contact
  
  // Inspection Fields
  technicalRecommendations?: string; // Recomendaciones al cliente
  visualInspectionComments?: string; // Comentarios revisión visual
  damagePoints?: DamagePoint[]; // Puntos marcados en el croquis
  
  // Scanner Fields
  hasScanner?: boolean;
  scannerLink?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number; // Gross amount (Total)
  documentType: ExpenseDocType;
  category?: ExpenseCategory; // General o Insumos
  buyerName: string; // Quien hizo la compra
  provider?: string; // Proveedor / Donde se compro
  notes?: string; // Comentarios adicionales
  isPaid: boolean; // Si ya se le devolvio el dinero o pago la empresa
  paymentDate?: string; // Fecha de pago o programada
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  clientName: string;
  plate: string;
  issue: string; // Problema/Motivo
  status: AppointmentStatus;
  createdAt: string;
}

export interface WorkshopSettings {
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string; // Base64 string for image
}

export interface RaffleWinner {
  id: string;
  dateWon: string;
  clientName: string;
  clientPhone: string;
  vehicleInfo: string;
  prizeTitle: string;
  prizeDetail: string;
  isRedeemed: boolean; // Si ya se cobro el premio
  redemptionDate?: string;
}

export type ViewState = 'dashboard' | 'list' | 'create' | 'details' | 'expenses' | 'parts' | 'agenda' | 'settings' | 'raffle' | 'calculator';
