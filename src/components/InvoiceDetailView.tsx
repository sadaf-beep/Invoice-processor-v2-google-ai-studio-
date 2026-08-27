import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Printer, 
  Download, 
  Share2, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Building2, 
  UserCheck, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  MessageSquare, 
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Save
} from 'lucide-react';
import { InvoiceData, LineItem, AuditAnomaly } from '../types';
import { formatCurrency, formatDate, exportSingleInvoiceJSON, printInvoiceSummary } from '../utils/formatters';
import { InvoiceChatAssistant } from './InvoiceChatAssistant';

interface InvoiceDetailViewProps {
  invoice: InvoiceData;
  onUpdateInvoice: (updated: InvoiceData) => void;
  onClose: () => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onUpdateInvoice,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'lineItems' | 'audit' | 'chat'>('lineItems');
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Line item handlers
  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...invoice.lineItems];
    const item = { ...updatedItems[index], [field]: value };
    
    // Auto recalculate item total
    const qty = field === 'quantity' ? Number(value) : item.quantity;
    const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
    item.total = Number((qty * price).toFixed(2));
    
    if (item.taxRate) {
      item.taxAmount = Number(((item.total * item.taxRate) / 100).toFixed(2));
    }
    
    updatedItems[index] = item;
    
    // Recalculate totals
    const newSubtotal = updatedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const newTax = updatedItems.reduce((sum, it) => sum + (it.taxAmount || 0), 0);
    const newGrandTotal = Number((newSubtotal + newTax - (invoice.discountTotal || 0) + (invoice.shippingHandling || 0)).toFixed(2));

    onUpdateInvoice({
      ...invoice,
      lineItems: updatedItems,
      subtotal: Number(newSubtotal.toFixed(2)),
      taxTotal: Number(newTax.toFixed(2)),
      grandTotal: newGrandTotal,
    });
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: 'New Item Description',
      quantity: 1,
      unitPrice: 0.00,
      taxRate: 0,
      taxAmount: 0,
      total: 0.00,
      category: 'General',
    };
    onUpdateInvoice({
      ...invoice,
      lineItems: [...invoice.lineItems, newItem],
    });
  };

  const handleDeleteLineItem = (index: number) => {
    const updatedItems = invoice.lineItems.filter((_, i) => i !== index);
    const newSubtotal = updatedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const newTax = updatedItems.reduce((sum, it) => sum + (it.taxAmount || 0), 0);
    const newGrandTotal = Number((newSubtotal + newTax - (invoice.discountTotal || 0) + (invoice.shippingHandling || 0)).toFixed(2));

    onUpdateInvoice({
      ...invoice,
      lineItems: updatedItems,
      subtotal: Number(newSubtotal.toFixed(2)),
      taxTotal: Number(newTax.toFixed(2)),
      grandTotal: newGrandTotal,
    });
  };

  const handleStatusChange = (newStatus: InvoiceData['status']) => {
    onUpdateInvoice({
      ...invoice,
      status: newStatus,
    });
    triggerSaveToast();
  };

  const handlePaymentStatusChange = (newPaymentStatus: InvoiceData['paymentStatus']) => {
    onUpdateInvoice({
      ...invoice,
      paymentStatus: newPaymentStatus,
    });
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            id="btn-back-to-invoices"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {invoice.invoiceNumber || 'Draft Invoice'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {invoice.category}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {invoice.vendor?.name} • Issued {formatDate(invoice.invoiceDate)} • Due {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
          {/* Status Selector */}
          <select
            id="invoice-status-select"
            value={invoice.status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none transition cursor-pointer ${
              invoice.status === 'approved'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : invoice.status === 'needs_review'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : invoice.status === 'paid'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <option value="approved" className="bg-slate-900 text-emerald-400">Approved</option>
            <option value="needs_review" className="bg-slate-900 text-amber-400">Needs Review</option>
            <option value="paid" className="bg-slate-900 text-blue-400">Paid</option>
            <option value="rejected" className="bg-slate-900 text-red-400">Rejected</option>
          </select>

          {/* Print Summary */}
          <button
            id="btn-print-invoice"
            onClick={() => printInvoiceSummary(invoice)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          {/* Export JSON */}
          <button
            id="btn-export-json"
            onClick={() => exportSingleInvoiceJSON(invoice)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Document Visual on Left, Structured Data on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Document Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="truncate max-w-[180px]">{invoice.fileName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400 font-mono px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 overflow-auto bg-slate-950/60 rounded-xl mt-3 p-4 flex items-center justify-center relative">
              {invoice.previewUrl ? (
                <img
                  src={invoice.previewUrl}
                  alt="Invoice visual capture"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  className="max-w-full max-h-full object-contain rounded shadow-lg transition-transform duration-100"
                />
              ) : (
                <div 
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300 font-mono text-xs flex flex-col justify-between shadow-2xl transition-transform"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-sm font-bold text-white">{invoice.vendor?.name}</div>
                        <div className="text-[11px] text-slate-400">{invoice.vendor?.address}</div>
                        <div className="text-[10px] text-slate-500">Tax ID: {invoice.vendor?.taxIdOrVat || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-400">INVOICE</div>
                        <div className="text-[11px] text-slate-300">{invoice.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-500">{invoice.invoiceDate}</div>
                      </div>
                    </div>

                    <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500">Billed to: </span>
                      <strong className="text-slate-200">{invoice.customer?.name}</strong>
                      <div className="text-[10px] text-slate-400">{invoice.customer?.address}</div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 pb-1 flex justify-between">
                        <span>Description</span>
                        <span>Total ({invoice.currency})</span>
                      </div>
                      {invoice.lineItems.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-300 py-0.5">
                          <span className="truncate max-w-[200px]">{item.description}</span>
                          <span>{item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {invoice.lineItems.length > 4 && (
                        <div className="text-[10px] text-slate-500 italic">
                          + {invoice.lineItems.length - 4} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">GRAND TOTAL:</span>
                    <span className="font-bold text-sm text-emerald-400">
                      {formatCurrency(invoice.grandTotal, invoice.currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Confidence & Summary Footnote */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">Extraction Quality</span>
                  <span className="font-mono text-emerald-400 font-bold">{invoice.confidenceScore}%</span>
                </div>
                <p className="text-slate-400 line-clamp-2">{invoice.summary}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workstation Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Workstation Header Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <button
              id="tab-line-items"
              onClick={() => setActiveTab('lineItems')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'lineItems'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Line Items & Math ({invoice.lineItems.length})</span>
            </button>

            <button
              id="tab-audit-risk"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition relative ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>AI Audit & Anomalies</span>
              {invoice.anomalies && invoice.anomalies.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                  {invoice.anomalies.length}
                </span>
              )}
            </button>

            <button
              id="tab-ai-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Invoice Copilot</span>
            </button>
          </div>

          {/* TAB 1: Editable Line Items and Financial Recalculation */}
          {activeTab === 'lineItems' && (
            <div className="space-y-4">
              {/* Vendor & Customer Quick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-400" /> Vendor / Payee</span>
                    <span className="text-[10px] font-mono text-slate-500">{invoice.vendor?.taxIdOrVat || 'No Tax ID'}</span>
                  </div>
                  <input
                    type="text"
                    value={invoice.vendor?.name || ''}
                    onChange={(e) =>
                      onUpdateInvoice({
                        ...invoice,
                        vendor: { ...invoice.vendor, name: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={invoice.vendor?.address || ''}
                    placeholder="Vendor Address"
                    onChange={(e) =>
                      onUpdateInvoice({
                        ...invoice,
                        vendor: { ...invoice.vendor, address: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Customer / Recipient</span>
                    <span className="text-[10px] font-mono text-slate-500">{invoice.purchaseOrderNumber || 'No PO'}</span>
                  </div>
                  <input
                    type="text"
                    value={invoice.customer?.name || ''}
                    onChange={(e) =>
                      onUpdateInvoice({
                        ...invoice,
                        customer: { ...invoice.customer, name: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={invoice.customer?.address || ''}
                    placeholder="Customer Address"
                    onChange={(e) =>
                      onUpdateInvoice({
                        ...invoice,
                        customer: { ...invoice.customer, address: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Editable Line Item Table */}
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Itemized Line Breakdown</h4>
                  <button
                    id="btn-add-line-item"
                    onClick={handleAddLineItem}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[11px]">
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-2 text-center w-16">Qty</th>
                        <th className="py-2.5 px-2 text-right w-24">Unit Price</th>
                        <th className="py-2.5 px-2 text-right w-20">Tax %</th>
                        <th className="py-2.5 px-3 text-right w-28">Total ({invoice.currency})</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {invoice.lineItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded px-2 py-1 text-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full text-center bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded px-1.5 py-1 text-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleLineItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full text-right bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded px-1.5 py-1 text-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={item.taxRate || 0}
                              onChange={(e) => handleLineItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                              className="w-full text-right bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded px-1.5 py-1 text-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                            {formatCurrency(item.total, invoice.currency)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleDeleteLineItem(idx)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & Grand Total Section */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>Payment Terms: <span className="text-slate-200 font-medium">{invoice.paymentTerms || 'Standard'}</span></p>
                    {invoice.vendor?.bankDetails?.ibanOrAccount && (
                      <p>Bank/Account: <span className="font-mono text-slate-300">{invoice.vendor.bankDetails.ibanOrAccount}</span></p>
                    )}
                  </div>

                  <div className="w-full sm:w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-mono text-slate-200">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tax / VAT:</span>
                      <span className="font-mono text-slate-200">{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
                    </div>
                    {invoice.discountTotal ? (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount:</span>
                        <span className="font-mono">-{formatCurrency(invoice.discountTotal, invoice.currency)}</span>
                      </div>
                    ) : null}
                    {invoice.shippingHandling ? (
                      <div className="flex justify-between text-slate-400">
                        <span>Shipping:</span>
                        <span className="font-mono text-slate-200">{formatCurrency(invoice.shippingHandling, invoice.currency)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-2">
                      <span>Grand Total:</span>
                      <span className="font-mono text-blue-400">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI Audit & Anomalies */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Automated Audit & Compliance Check</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                    Audit Status: {invoice.anomalies?.length ? `${invoice.anomalies.length} Flagged Item(s)` : 'Passed Clean'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {invoice.anomalies && invoice.anomalies.length > 0 ? (
                    invoice.anomalies.map((anom, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          anom.severity === 'critical' || anom.severity === 'high'
                            ? 'bg-red-500/10 border-red-500/30 text-red-200'
                            : anom.severity === 'medium'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <div className="flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{anom.title}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40">
                            {anom.severity}
                          </span>
                        </div>
                        <p className="opacity-90">{anom.description}</p>
                        {anom.suggestedAction && (
                          <div className="text-[11px] pt-1 font-semibold flex items-center space-x-1 opacity-95">
                            <span>👉 Action: {anom.suggestedAction}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center space-y-2 bg-slate-950/40 rounded-xl border border-slate-800/60">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-semibold text-white">No Discrepancies Detected</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Arithmetic calculations, tax rates, vendor identifiers, and terms are fully compliant.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Invoice Copilot Chat */}
          {activeTab === 'chat' && (
            <InvoiceChatAssistant invoice={invoice} />
          )}

        </div>
      </div>
    </div>
  );
};
