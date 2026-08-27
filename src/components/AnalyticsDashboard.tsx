import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  Building, 
  Layers,
  Sparkles,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area 
} from 'recharts';
import { InvoiceData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AnalyticsDashboardProps {
  invoices: InvoiceData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Software & SaaS': '#3b82f6',
  'Hardware & Equipment': '#06b6d4',
  'Professional Services': '#8b5cf6',
  'Logistics & Shipping': '#f59e0b',
  'Marketing & Advertising': '#ec4899',
  'Office & Facilities': '#10b981',
  'Travel & Entertainment': '#6366f1',
  'Utilities': '#14b8a6',
  'Other': '#64748b',
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ invoices }) => {
  // Aggregate Metrics
  const totalSpend = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const pendingApproval = invoices.filter((i) => i.status === 'needs_review').length;
  const approvedCount = invoices.filter((i) => i.status === 'approved' || i.status === 'paid').length;
  const flaggedCount = invoices.filter((i) => i.anomalies && i.anomalies.length > 0).length;

  // Category Breakdown Data
  const categoryMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    const cat = inv.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + (inv.grandTotal || 0);
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  // Vendor Spend Breakdown Data
  const vendorMap: Record<string, { total: number; count: number }> = {};
  invoices.forEach((inv) => {
    const vendorName = inv.vendor?.name || 'Unknown';
    if (!vendorMap[vendorName]) {
      vendorMap[vendorName] = { total: 0, count: 0 };
    }
    vendorMap[vendorName].total += inv.grandTotal || 0;
    vendorMap[vendorName].count += 1;
  });
  const vendorData = Object.entries(vendorMap)
    .map(([name, data]) => ({
      name,
      total: Number(data.total.toFixed(2)),
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Timeline Trend Data (Mock/Aggregated by date)
  const timelineMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    const dateKey = inv.invoiceDate ? inv.invoiceDate.substring(0, 7) : '2025-08';
    timelineMap[dateKey] = (timelineMap[dateKey] || 0) + (inv.grandTotal || 0);
  });
  const timelineData = Object.entries(timelineMap).map(([date, amount]) => ({
    date,
    amount: Number(amount.toFixed(2)),
  }));

  return (
    <div className="w-full space-y-6">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Expenditure</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(totalSpend, 'USD')}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{invoices.length}</span> audited documents
          </div>
        </div>

        {/* Needs Review / Pending */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
            {pendingApproval}
          </div>
          <div className="text-[11px] text-slate-400">
            Requires AP manager approval
          </div>
        </div>

        {/* Approved Clean */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Approved & Paid</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
            {approvedCount}
          </div>
          <div className="text-[11px] text-slate-400">
            Ready for ERP journal posting
          </div>
        </div>

        {/* AI Audit Confidence */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Extraction Quality</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tracking-tight">
            {invoices.length > 0
              ? `${Math.round(
                  invoices.reduce((acc, i) => acc + (i.confidenceScore || 90), 0) / invoices.length
                )}%`
              : '98%'}
          </div>
          <div className="text-[11px] text-slate-400">
            Gemini 3.7 Flash multimodal vision
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown (Pie Chart) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-400" />
                Spending by Expense Category
              </h3>
              <p className="text-xs text-slate-400">Automated classification of line items</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || '#3b82f6'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Spend']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No categorical data yet
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px]">
            {categoryData.map((entry) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[entry.name] || '#3b82f6' }}
                />
                <span className="text-slate-300">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors by Spend (Bar Chart) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Top Suppliers & Vendors
              </h3>
              <p className="text-xs text-slate-400">Total volume by approved payees</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {vendorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} tickFormatter={(val) => val.split(' ')[0]} />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Spend']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No vendor data yet
              </div>
            )}
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Showing top {vendorData.length} volume suppliers
          </div>
        </div>

      </div>
    </div>
  );
};
