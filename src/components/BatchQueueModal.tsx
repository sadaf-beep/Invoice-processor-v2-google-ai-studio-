import React, { useState } from 'react';
import { 
  Layers, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { InvoiceData } from '../types';

interface BatchQueueModalProps {
  files: File[];
  onClose: () => void;
  onBatchComplete: (invoices: InvoiceData[]) => void;
}

interface FileProgress {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  invoice?: InvoiceData;
}

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  files,
  onClose,
  onBatchComplete,
}) => {
  const [queue, setQueue] = useState<FileProgress[]>(
    files.map((f) => ({ file: f, status: 'pending' }))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedInvoices, setProcessedInvoices] = useState<InvoiceData[]>([]);

  const startBatch = async () => {
    setIsProcessing(true);
    const results: InvoiceData[] = [];

    for (let i = 0; i < queue.length; i++) {
      const currentItem = queue[i];
      
      // Update status to processing
      setQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing' } : item
        )
      );

      try {
        const base64 = await fileToBase64(currentItem.file);
        const response = await fetch('/api/process-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: currentItem.file.type || 'image/png',
            fileName: currentItem.file.name,
            fileSize: currentItem.file.size,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Extraction failed');
        }

        results.push(data.invoice);
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'completed', invoice: data.invoice } : item
          )
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', error: err.message } : item
          )
        );
      }
    }

    setIsProcessing(false);
    setProcessedInvoices(results);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFinish = () => {
    onBatchComplete(processedInvoices);
    onClose();
  };

  const completedCount = queue.filter((q) => q.status === 'completed').length;
  const progressPercent = Math.round((completedCount / queue.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Batch Document Processing</h3>
              <p className="text-xs text-slate-400">{queue.length} files queued for Gemini AI analysis</p>
            </div>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Extracting & Auditing...</span>
              <span>{progressPercent}% ({completedCount}/{queue.length})</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* File Queue List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {queue.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <div className="flex items-center space-x-2.5 truncate max-w-[70%]">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-200 truncate">{item.file.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{(item.file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>

              <div>
                {item.status === 'pending' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                    Ready
                  </span>
                )}
                {item.status === 'processing' && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Analyzing...</span>
                  </span>
                )}
                {item.status === 'completed' && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Extracted</span>
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono">
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>Failed</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {completedCount > 0 && `${completedCount} successfully extracted`}
          </div>

          <div className="flex items-center space-x-2">
            {!isProcessing && completedCount === 0 && (
              <button
                onClick={startBatch}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Batch Processing</span>
              </button>
            )}

            {!isProcessing && completedCount > 0 && (
              <button
                onClick={handleFinish}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition"
              >
                <span>View Extracted Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
