import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Copy, 
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { InvoiceData } from '../types';
import { SAMPLE_INVOICES } from '../data/sampleInvoices';

interface UploadZoneProps {
  onInvoiceProcessed: (invoice: InvoiceData) => void;
  onBatchSelected: (files: File[]) => void;
  isLoading: boolean;
  loadingStep: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onInvoiceProcessed,
  onBatchSelected,
  isLoading,
  loadingStep,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1) {
        onBatchSelected(Array.from(e.dataTransfer.files));
      } else {
        processFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        onBatchSelected(Array.from(e.target.files));
      } else {
        processFile(e.target.files[0]);
      }
    }
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result as string;
        
        const response = await fetch('/api/process-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/png',
            fileName: file.name,
            fileSize: file.size,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to extract invoice data');
        }

        onInvoiceProcessed(data.invoice);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error processing invoice file');
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRawTextSubmit = async () => {
    if (!textInput.trim()) return;
    setErrorMsg(null);
    try {
      const response = await fetch('/api/process-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textInput,
          fileName: 'pasted_invoice_text.txt',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract invoice from text');
      }

      setShowTextModal(false);
      setTextInput('');
      onInvoiceProcessed(data.invoice);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error parsing invoice text');
    }
  };

  const handleLoadSample = (sample: InvoiceData) => {
    onInvoiceProcessed({
      ...sample,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      processedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Error alert banner */}
      {errorMsg && (
        <div className="flex items-start space-x-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-200">Processing Notice</h4>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-200 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        id="invoice-dropzone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer overflow-hidden ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10 scale-[1.008]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="invoice-file-input"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <Sparkles className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-bold text-white tracking-tight">Gemini 3.7 Flash AI Analysis</h3>
              <p className="text-sm text-blue-400 font-medium animate-pulse">
                {loadingStep || 'Extracting line items, vendor details, and auditing taxes...'}
              </p>
            </div>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse-subtle w-3/4 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition shadow-inner">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Drop your invoice document here, or <span className="text-blue-400 underline underline-offset-4">browse files</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Supports PDF, PNG, JPG, and WEBP formats. Multimodal AI automatically extracts vendor info, line items, taxes, and fraud flags.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-cyan-400" /> Image Receipts
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-rose-400" /> PDF Invoices
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Batch Uploads
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Alternative Options: Paste Raw Text or Load Sample Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paste Raw Text Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">Paste Raw Invoice Text or Receipt</h4>
            </div>
            <p className="text-xs text-slate-400">
              Have an email receipt, text snippet, or markdown table? Paste it directly for instant AI parsing.
            </p>
          </div>
          <button
            id="btn-paste-invoice-text"
            onClick={() => setShowTextModal(true)}
            className="mt-4 inline-flex items-center justify-center space-x-2 w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Open Text / Snippet Parser</span>
          </button>
        </div>

        {/* Instant Enterprise Samples */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-white">Try Interactive Sample Invoices</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">1-Click</span>
            </div>
            <p className="text-xs text-slate-400">
              Explore immediate extraction results with pre-audited enterprise bills:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            {SAMPLE_INVOICES.map((sample) => (
              <button
                key={sample.id}
                id={`btn-sample-${sample.id}`}
                onClick={() => handleLoadSample(sample)}
                className="p-2 text-left rounded-xl bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-700/60 transition group"
              >
                <div className="text-[11px] font-semibold text-slate-200 truncate group-hover:text-blue-400">
                  {sample.vendor?.name?.split(' ')[0] || 'Sample'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {sample.currency} {sample.grandTotal.toFixed(0)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Pasting Raw Text */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Paste Invoice Text Snippet</h3>
              </div>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <textarea
              id="raw-invoice-textarea"
              rows={8}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste raw invoice text, receipt email, or billing table here...
Example:
Invoice #INV-9021
Vendor: Acme Hosting Corp
Date: 2025-08-15
Line Items:
1x Dedicated Cloud Server - $250.00
1x SSL Wildcard Certificate - $49.00
Tax (8%): $23.92
Total Due: $322.92"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono resize-none"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowTextModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="btn-submit-raw-text"
                onClick={handleRawTextSubmit}
                disabled={!textInput.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract with Gemini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
