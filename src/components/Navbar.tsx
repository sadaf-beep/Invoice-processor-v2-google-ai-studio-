import React from 'react';
import { 
  FileText, 
  Sparkles, 
  BarChart3, 
  ListFilter, 
  Upload, 
  Download, 
  CheckCircle2, 
  Layers,
  HelpCircle,
  Zap
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'process' | 'list' | 'analytics' | 'batch';
  setActiveTab: (tab: 'process' | 'list' | 'analytics' | 'batch') => void;
  invoiceCount: number;
  onExportAll: () => void;
  onLoadSamples: () => void;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  invoiceCount,
  onExportAll,
  onLoadSamples,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('process')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Invoice Processor</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  v2.0 AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Multimodal Document Intelligence</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-process"
              onClick={() => setActiveTab('process')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'process'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Process & Review</span>
            </button>

            <button
              id="nav-tab-list"
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Invoices ({invoiceCount})</span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Audit</span>
            </button>

            <button
              id="nav-tab-batch"
              onClick={() => setActiveTab('batch')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'batch'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Queue</span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2">
            {/* Gemini Model Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">Gemini 3.7 Flash</span>
            </div>

            {/* Load Sample Data */}
            <button
              id="btn-load-samples"
              onClick={onLoadSamples}
              title="Load demo enterprise sample invoices"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white rounded-lg border border-slate-700 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Samples</span>
            </button>

            {/* Export CSV */}
            {invoiceCount > 0 && (
              <button
                id="btn-export-csv"
                onClick={onExportAll}
                title="Export all invoices to CSV"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white rounded-lg border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('process')}
            className={`px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'process' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Process
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Invoices ({invoiceCount})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'batch' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Batch
          </button>
        </div>
      </div>
    </header>
  );
};
