
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
  unitPrice: number; 
  costPrice?: number; 
  purchaseDocType?: DocumentType;
  buyer?: string;
  provider?: string;
  isReimbursed?: boolean;
  reimbursementDate?: string;
  discount?: number; 
  discountType?: 'amount' | 'percent';
  discountReason?: string;
}

export interface DamagePoint {
    id: string;
    x: number;
    y: number;
    type: 'scratch' | 'dent' | 'other';
    note?: string;
}

export interface Client {
  name: string;
  phone: string;
}

export interface Vehicle {
  brand: string;
  model: string;
  plate: string;
  year: string;
  mileage: string;
  vin?: string;
}

export interface WorkOrder {
  id: string;
  otType?: OtType;
  parentOtId?: string;
  warrantyReason?: string;
  date: string;
  deliveredAt?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  documentType: DocumentType;
  client: Client;
  vehicle: Vehicle;
  mechanic: string;
  description: string;
  items: WorkItem[];
  notes?: string;
  clientProvidesParts?: boolean;
  isMaintenance?: boolean;
  maintenanceIntervalMonths?: number;
  nextMaintenanceDate?: string;
  maintenanceAlertDismissed?: boolean;
  technicalRecommendations?: string;
  visualInspectionComments?: string;
  damagePoints?: DamagePoint[];
  hasScanner?: boolean;
  scannerLink?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  documentType: ExpenseDocType;
  category?: ExpenseCategory;
  buyerName: string;
  provider?: string;
  notes?: string;
  isPaid: boolean;
  paymentDate?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  clientName: string;
  plate: string;
  issue: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface WorkshopSettings {
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  syncCode?: string; // Código para sincronización en la nube
  lastSync?: string; // Fecha de última sincronización exitosa
}

export interface RaffleWinner {
  id: string;
  dateWon: string;
  clientName: string;
  clientPhone: string;
  vehicleInfo: string;
  prizeTitle: string;
  prizeDetail: string;
  isRedeemed: boolean;
  redemptionDate?: string;
}

export type ViewState = 'dashboard' | 'list' | 'create' | 'details' | 'expenses' | 'parts' | 'agenda' | 'settings' | 'raffle' | 'calculator';
