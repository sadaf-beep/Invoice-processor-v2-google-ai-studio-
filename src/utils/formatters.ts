import { InvoiceData } from '../types';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function exportToCSV(invoices: InvoiceData[]): void {
  const headers = [
    'Invoice ID',
    'Invoice Number',
    'Date',
    'Due Date',
    'Vendor Name',
    'Vendor Tax ID',
    'Customer Name',
    'Category',
    'Currency',
    'Subtotal',
    'Tax Total',
    'Discount Total',
    'Grand Total',
    'Status',
    'Payment Status',
    'Anomalies Count',
    'Confidence Score',
    'Tags',
  ];

  const rows = invoices.map((inv) => [
    `"${inv.id}"`,
    `"${inv.invoiceNumber}"`,
    `"${inv.invoiceDate}"`,
    `"${inv.dueDate}"`,
    `"${inv.vendor?.name?.replace(/"/g, '""') || ''}"`,
    `"${inv.vendor?.taxIdOrVat || ''}"`,
    `"${inv.customer?.name?.replace(/"/g, '""') || ''}"`,
    `"${inv.category}"`,
    `"${inv.currency}"`,
    inv.subtotal.toFixed(2),
    inv.taxTotal.toFixed(2),
    (inv.discountTotal || 0).toFixed(2),
    inv.grandTotal.toFixed(2),
    `"${inv.status}"`,
    `"${inv.paymentStatus}"`,
    inv.anomalies?.length || 0,
    `${inv.confidenceScore}%`,
    `"${(inv.tags || []).join('; ')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Invoices_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSingleInvoiceJSON(invoice: InvoiceData): void {
  const jsonString = JSON.stringify(invoice, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${invoice.invoiceNumber || 'Invoice'}_Data.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printInvoiceSummary(invoice: InvoiceData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice Summary - ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #0f172a; }
          .meta { color: #64748b; font-size: 14px; }
          .entities { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .entity-box h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; }
          .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .totals { margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals-grand { font-size: 18px; font-weight: bold; border-top: 2px solid #0f172a; padding-top: 10px; color: #0f172a; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
          .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">INVOICE AUDIT REPORT</div>
            <div class="meta">Invoice No: <strong>${invoice.invoiceNumber}</strong></div>
            <div class="meta">Category: ${invoice.category}</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">${invoice.status.toUpperCase()}</div>
            <div class="meta" style="margin-top: 8px;">Date: ${invoice.invoiceDate}</div>
            <div class="meta">Due: ${invoice.dueDate}</div>
          </div>
        </div>

        <div class="entities">
          <div class="entity-box">
            <h3>Vendor / Supplier</h3>
            <strong>${invoice.vendor?.name || '—'}</strong><br/>
            ${invoice.vendor?.address || ''}<br/>
            ${invoice.vendor?.email ? `Email: ${invoice.vendor.email}<br/>` : ''}
            ${invoice.vendor?.taxIdOrVat ? `Tax/VAT ID: ${invoice.vendor.taxIdOrVat}<br/>` : ''}
          </div>
          <div class="entity-box">
            <h3>Billed Customer</h3>
            <strong>${invoice.customer?.name || '—'}</strong><br/>
            ${invoice.customer?.address || ''}<br/>
            ${invoice.customer?.contactPerson ? `Attn: ${invoice.customer.contactPerson}<br/>` : ''}
            ${invoice.purchaseOrderNumber ? `PO Ref: ${invoice.purchaseOrderNumber}<br/>` : ''}
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Tax</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.lineItems || [])
              .map(
                (item) => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${invoice.currency} ${item.unitPrice.toFixed(2)}</td>
                <td style="text-align: right;">${item.taxRate ? `${item.taxRate}%` : '0%'}</td>
                <td style="text-align: right;">${invoice.currency} ${item.total.toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${invoice.currency} ${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Tax:</span>
            <span>${invoice.currency} ${invoice.taxTotal.toFixed(2)}</span>
          </div>
          ${
            invoice.discountTotal
              ? `
            <div class="totals-row" style="color: #16a34a;">
              <span>Discount:</span>
              <span>-${invoice.currency} ${invoice.discountTotal.toFixed(2)}</span>
            </div>
          `
              : ''
          }
          ${
            invoice.shippingHandling
              ? `
            <div class="totals-row">
              <span>Shipping & Freight:</span>
              <span>${invoice.currency} ${invoice.shippingHandling.toFixed(2)}</span>
            </div>
          `
              : ''
          }
          <div class="totals-row totals-grand">
            <span>Grand Total:</span>
            <span>${invoice.currency} ${invoice.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        ${
          invoice.summary
            ? `
          <div style="margin-top: 30px; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <strong>AI Executive Audit Summary:</strong>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${invoice.summary}</p>
          </div>
        `
            : ''
        }

        <div class="footer">
          Processed and Audited with Invoice Processor v2 Powered by Google AI Studio & Gemini 3.7 Flash
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
