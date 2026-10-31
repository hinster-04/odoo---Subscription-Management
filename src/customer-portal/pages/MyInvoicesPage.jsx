import React, { useState } from 'react';
import { MY_INVOICES } from '../mockData';
import { StatusBadge } from '../components/StatusBadge';
import { AdminIcon } from '../../admin/AdminIcons';

export function MyInvoicesPage({ onNavigate }) {
  const [invoices, setInvoices] = useState(MY_INVOICES);
  const [filterStatus, setFilterStatus] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  const filteredInvoices =
    filterStatus === 'all'
      ? invoices
      : invoices.filter((inv) => inv.status.toLowerCase() === filterStatus.toLowerCase());

  const handlePayInvoice = (invoice) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id
          ? { ...inv, status: 'Paid', paidDate: 'Today', paymentMethod: 'NetBanking Instant' }
          : inv
      )
    );
    setToastMessage(`Payment of ₹${invoice.totalAmount.toLocaleString('en-IN')} for invoice ${invoice.id} successful!`);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const handleDownloadInvoice = (invoice) => {
    setToastMessage(`Downloading official Tax Invoice PDF for ${invoice.id}...`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="customer-invoices-page">
      <div className="portal-page-header">
        <div>
          <h2>My Invoices & Tax Invoices</h2>
          <p>
            Review billing records, itemized GST taxes, payment statuses, and download official receipts.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: 3, borderRadius: 8 }}>
          {['all', 'Paid', 'Confirmed', 'Draft', 'Overdue'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              style={{
                border: 'none',
                background: filterStatus === status ? '#ffffff' : 'transparent',
                color: filterStatus === status ? '#14213d' : '#64748b',
                fontWeight: 700,
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: filterStatus === status ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {status === 'all' ? 'All Invoices' : status}
            </button>
          ))}
        </div>
      </div>

      {toastMessage && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 20,
            fontSize: 13.5
          }}
        >
          ✓ {toastMessage}
        </div>
      )}

      {/* Invoices List */}
      <section className="portal-card">
        <div className="portal-card-header">
          <div>
            <h3>Invoice Ledger</h3>
            <p>Showing {filteredInvoices.length} billing document{filteredInvoices.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Invoice Date</th>
                <th>Product & Description</th>
                <th>Taxes (18% GST)</th>
                <th>Total Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#376bf4' }}>
                      {inv.id}
                    </span>
                    {inv.paidDate && (
                      <small style={{ display: 'block', color: '#059669', fontSize: 11 }}>
                        Paid on {inv.paidDate}
                      </small>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: '#14213d' }}>{inv.invoiceDate}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#14213d' }}>{inv.productDetails}</span>
                    <small style={{ display: 'block', color: '#64748b', fontSize: 11.5 }}>
                      Subtotal: ₹{inv.subtotal.toLocaleString('en-IN')} • Method: {inv.paymentMethod}
                    </small>
                  </td>
                  <td>
                    <span>₹{inv.taxes.toLocaleString('en-IN')}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#14213d', fontSize: 14.5 }}>
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: inv.status === 'Overdue' ? '#dc2626' : '#64748b', fontWeight: inv.status === 'Overdue' ? 700 : 500 }}>
                      {inv.dueDate}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inv.status !== 'Paid' && (
                        <button
                          type="button"
                          className="portal-btn portal-btn-primary portal-btn-sm"
                          onClick={() => handlePayInvoice(inv)}
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        type="button"
                        className="portal-btn portal-btn-secondary portal-btn-sm"
                        onClick={() => handleDownloadInvoice(inv)}
                        title="Download Tax Invoice Receipt"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
