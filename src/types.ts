export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  skuOrCode?: string;
  category?: string;
}

export interface VendorInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxIdOrVat?: string;
  bankDetails?: {
    bankName?: string;
    ibanOrAccount?: string;
    swiftBic?: string;
    routingNumber?: string;
  };
}

export interface CustomerInfo {
  name: string;
  address?: string;
  taxId?: string;
  contactPerson?: string;
  email?: string;
}

export interface AuditAnomaly {
  type: 'math_error' | 'high_amount' | 'duplicate_risk' | 'due_date_warning' | 'missing_tax_id' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestedAction?: string;
}

export interface InvoiceData {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  previewUrl?: string; // base64 or object URL
  uploadedAt: string;
  processedAt: string;
  
  // Extraction core
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  purchaseOrderNumber?: string;
  paymentTerms?: string;
  currency: string;
  status: 'draft' | 'needs_review' | 'approved' | 'paid' | 'rejected';
  
  // Entities
  vendor: VendorInfo;
  customer: CustomerInfo;
  
  // Financial breakdown
  lineItems: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal?: number;
  shippingHandling?: number;
  grandTotal: number;
  
  // AI Categorization & Insights
  category: 'Software & SaaS' | 'Hardware & Equipment' | 'Professional Services' | 'Logistics & Shipping' | 'Marketing & Advertising' | 'Office & Facilities' | 'Travel & Entertainment' | 'Utilities' | 'Other';
  confidenceScore: number; // 0 to 100
  summary: string;
  anomalies: AuditAnomaly[];
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'overdue';
  tags: string[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalSpend: number;
  pendingApproval: number;
  highRiskCount: number;
  averageProcessingTime: string;
  currencyBreakdown: Record<string, number>;
}
