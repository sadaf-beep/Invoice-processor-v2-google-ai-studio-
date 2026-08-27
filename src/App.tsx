import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { InvoiceDetailView } from './components/InvoiceDetailView';
import { InvoiceList } from './components/InvoiceList';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BatchQueueModal } from './components/BatchQueueModal';
import { InvoiceData } from './types';
import { SAMPLE_INVOICES } from './data/sampleInvoices';
import { exportToCSV } from './utils/formatters';
import { Sparkles, FileText, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'ais_invoice_processor_v2_data';

export const App: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved invoices:', e);
    }
    return SAMPLE_INVOICES;
  });

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [activeTab, setActiveTab] = useState<'process' | 'list' | 'analytics' | 'batch'>('process');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [invoices]);

  // Check health on boot
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(data.geminiConfigured);
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInvoiceProcessed = (newInvoice: InvoiceData) => {
    setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.id !== newInvoice.id)]);
    setSelectedInvoice(newInvoice);
    setActiveTab('process');
    showToast(`Invoice ${newInvoice.invoiceNumber} processed successfully!`);
  };

  const handleUpdateInvoice = (updated: InvoiceData) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
    setSelectedInvoice(updated);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (selectedInvoice?.id === id) {
      setSelectedInvoice(null);
    }
    showToast('Invoice deleted from registry.');
  };

  const handleBatchApprove = (ids: string[]) => {
    setInvoices((prev) =>
      prev.map((inv) => (ids.includes(inv.id) ? { ...inv, status: 'approved' } : inv))
    );
    showToast(`Approved ${ids.length} invoice(s).`);
  };

  const handleBatchDelete = (ids: string[]) => {
    setInvoices((prev) => prev.filter((inv) => !ids.includes(inv.id)));
    if (selectedInvoice && ids.includes(selectedInvoice.id)) {
      setSelectedInvoice(null);
    }
    showToast(`Deleted ${ids.length} invoice(s).`);
  };

  const handleLoadSamples = () => {
    setInvoices(SAMPLE_INVOICES);
    setSelectedInvoice(SAMPLE_INVOICES[0]);
    showToast('Sample enterprise invoices loaded.');
  };

  const handleExportAllCSV = () => {
    exportToCSV(invoices);
    showToast('Invoices exported to CSV successfully.');
  };

  const handleBatchComplete = (newInvoices: InvoiceData[]) => {
    setInvoices((prev) => [...newInvoices, ...prev]);
    setBatchFiles(null);
    setActiveTab('list');
    showToast(`Batch processing completed for ${newInvoices.length} invoices.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'process') {
            // Keep selected invoice or reset if navigating away
          }
        }}
        invoiceCount={invoices.length}
        onExportAll={handleExportAllCSV}
        onLoadSamples={handleLoadSamples}
        hasApiKey={hasApiKey}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: Process & Workstation View */}
        {activeTab === 'process' && (
          <div className="space-y-6">
            {selectedInvoice ? (
              <InvoiceDetailView
                invoice={selectedInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onClose={() => setSelectedInvoice(null)}
              />
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2 py-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Multimodal Invoice Extraction & Audit Engine</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Smart Invoice Intelligence & Reconciliation
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                    Upload documents or receipts to instantly extract itemized line items, check arithmetic integrity, detect anomalies, and chat with Gemini 3.7 Flash.
                  </p>
                </div>

                <UploadZone
                  onInvoiceProcessed={handleInvoiceProcessed}
                  onBatchSelected={(files) => setBatchFiles(files)}
                  isLoading={isProcessing}
                  loadingStep={loadingStep}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Invoice Registry & Search */}
        {activeTab === 'list' && (
          <InvoiceList
            invoices={invoices}
            onSelectInvoice={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('process');
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onBatchApprove={handleBatchApprove}
            onBatchDelete={handleBatchDelete}
            onNewUpload={() => {
              setSelectedInvoice(null);
              setActiveTab('process');
            }}
          />
        )}

        {/* TAB 3: Financial Analytics & Risk Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard invoices={invoices} />
        )}

        {/* TAB 4: Batch Processing Queue */}
        {activeTab === 'batch' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2 py-4">
              <h2 className="text-xl font-bold text-white">Batch Invoice Processing</h2>
              <p className="text-xs text-slate-400">
                Select multiple invoices at once to extract and audit in parallel.
              </p>
            </div>

            <UploadZone
              onInvoiceProcessed={handleInvoiceProcessed}
              onBatchSelected={(files) => setBatchFiles(files)}
              isLoading={isProcessing}
              loadingStep={loadingStep}
            />
          </div>
        )}
      </main>

      {/* Batch Processing Modal */}
      {batchFiles && (
        <BatchQueueModal
          files={batchFiles}
          onClose={() => setBatchFiles(null)}
          onBatchComplete={handleBatchComplete}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Invoice Processor v2 • Powered by Google AI Studio & Gemini 3.7 Flash</p>
      </footer>
    </div>
  );
};
