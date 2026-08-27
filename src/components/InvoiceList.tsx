import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Download, 
  Tag, 
  Building2, 
  FileText,
  CheckSquare,
  Square,
  ArrowUpDown,
  Plus
} from 'lucide-react';
import { InvoiceData } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceListProps {
  invoices: InvoiceData[];
  onSelectInvoice: (invoice: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
  onBatchApprove?: (ids: string[]) => void;
  onBatchDelete?: (ids: string[]) => void;
  onNewUpload: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onBatchApprove,
  onBatchDelete,
  onNewUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'vendor'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter & search
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch =
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.tags && inv.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || inv.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'date') {
          cmp = new Date(b.invoiceDate || 0).getTime() - new Date(a.invoiceDate || 0).getTime();
        } else if (sortField === 'amount') {
          cmp = b.grandTotal - a.grandTotal;
        } else if (sortField === 'vendor') {
          cmp = (a.vendor?.name || '').localeCompare(b.vendor?.name || '');
        }
        return sortAsc ? -cmp : cmp;
      });
  }, [invoices, searchQuery, statusFilter, categoryFilter, sortField, sortAsc]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (onBatchApprove && selectedIds.length > 0) {
      onBatchApprove(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (onBatchDelete && selectedIds.length > 0) {
      onBatchDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search-invoices-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, vendor name, PO, or tag..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="needs_review">Needs Review</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            id="filter-category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Software & SaaS">Software & SaaS</option>
            <option value="Hardware & Equipment">Hardware & Equipment</option>
            <option value="Professional Services">Professional Services</option>
            <option value="Logistics & Shipping">Logistics & Shipping</option>
            <option value="Marketing & Advertising">Marketing & Advertising</option>
            <option value="Office & Facilities">Office & Facilities</option>
          </select>

          {/* Sort Switch */}
          <button
            id="btn-sort-toggle"
            onClick={() => setSortAsc(!sortAsc)}
            title="Toggle sort order"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* New Upload Button */}
          <button
            id="btn-new-upload"
            onClick={onNewUpload}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Process New</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-600/10 border border-blue-500/30 text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-blue-300 font-semibold">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>{selectedIds.length} invoice(s) selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkApprove}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
            >
              Approve Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-medium text-xs transition"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Invoice Table / Cards */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No invoices match your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or upload a new invoice to get started.
          </p>
          <button
            onClick={onNewUpload}
            className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Invoice</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <button onClick={toggleSelectAll} className="p-0.5 text-slate-400 hover:text-white">
                      {selectedIds.length === filteredInvoices.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Invoice & Vendor</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date & Due</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Audit</th>
                  <th className="py-3 px-3 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  const hasAnomalies = inv.anomalies && inv.anomalies.length > 0;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        isSelected ? 'bg-blue-600/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => toggleSelect(inv.id, e)}>
                        <button className="p-0.5 text-slate-400 hover:text-white">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Invoice & Vendor */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white tracking-tight flex items-center space-x-1.5">
                          <span>{inv.invoiceNumber}</span>
                          {inv.confidenceScore >= 95 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[200px] mt-0.5">
                          {inv.vendor?.name}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 whitespace-nowrap">
                          {inv.category}
                        </span>
                      </td>

                      {/* Date & Due */}
                      <td className="py-3 px-3">
                        <div className="text-slate-200 text-[11px]">{formatDate(inv.invoiceDate)}</div>
                        <div className="text-slate-500 text-[10px]">Due: {formatDate(inv.dueDate)}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : inv.status === 'needs_review'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : inv.status === 'paid'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      {/* Audit */}
                      <td className="py-3 px-3 text-center">
                        {hasAnomalies ? (
                          <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{inv.anomalies.length} flag(s)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Clean</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            title="Open Invoice Workstation"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            title="Delete Invoice"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
