import React, { useState } from 'react';
import { MY_QUOTATIONS } from '../mockData';
import { StatusBadge } from '../components/StatusBadge';
import { AdminIcon } from '../../admin/AdminIcons';

export function MyQuotationsPage() {
  const [quotations, setQuotations] = useState(MY_QUOTATIONS);
  const [activeQuoteModal, setActiveQuoteModal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const handleAcceptQuote = (quote) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, status: 'Confirmed' } : q))
    );
    setToastMessage(`Quotation ${quote.id} accepted! An invoice will be generated shortly.`);
    setActiveQuoteModal(null);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const handleDownloadPDF = (quote) => {
    setToastMessage(`Downloading official Quotation PDF for ${quote.id}...`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="customer-quotations-page">
      <div className="portal-page-header">
        <div>
          <h2>My Quotations</h2>
          <p>
            Official commercial proposals, customized seat configurations, itemized GST tax breakdowns, and validity windows.
          </p>
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

      {/* Quotations Table Card */}
      <section className="portal-card">
        <div className="portal-card-header">
          <div>
            <h3>Received Quotations</h3>
            <p>Active and past quotes sent by your sales account manager</p>
          </div>
        </div>

        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Quote Number</th>
                <th>Product & Specification</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Taxes (18% GST)</th>
                <th>Total Amount</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#376bf4' }}>
                      {quote.id}
                    </span>
                    <small style={{ display: 'block', color: '#94a3b8', fontSize: 11 }}>
                      {quote.createdDate}
                    </small>
                  </td>
                  <td>
                    <strong style={{ color: '#14213d' }}>{quote.productName}</strong>
                    <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                      {quote.description}
                    </span>
                  </td>
                  <td>
                    <strong>{quote.quantity}</strong>
                  </td>
                  <td>
                    {quote.currency}{quote.unitPrice.toLocaleString('en-IN')}
                  </td>
                  <td>
                    {quote.currency}{quote.taxes.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <strong style={{ color: '#14213d', fontSize: 14.5 }}>
                      {quote.currency}{quote.totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: quote.status === 'Expired' ? '#94a3b8' : '#14213d', fontWeight: 600 }}>
                      {quote.validityDate}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={quote.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="portal-btn portal-btn-secondary portal-btn-sm"
                        onClick={() => setActiveQuoteModal(quote)}
                        title="View Full Itemized Quote"
                      >
                        Details
                      </button>
                      {quote.status === 'Draft' && (
                        <button
                          type="button"
                          className="portal-btn portal-btn-primary portal-btn-sm"
                          onClick={() => handleAcceptQuote(quote)}
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed Modal */}
      {activeQuoteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 26, 48, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16
          }}
          onClick={() => setActiveQuoteModal(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 14,
              maxWidth: 580,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#376bf4', textTransform: 'uppercase' }}>
                  Quotation Proposal
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: 20, color: '#14213d', fontFamily: 'Manrope, sans-serif' }}>
                  {activeQuoteModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuoteModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <AdminIcon name="close" size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <div style={{ marginBottom: 6 }}>
                <strong>Product:</strong> {activeQuoteModal.productName}
              </div>
              <div style={{ color: '#64748b', marginBottom: 6 }}>
                {activeQuoteModal.description}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 8 }}>
                <span>Subtotal ({activeQuoteModal.quantity} seats @ ₹{activeQuoteModal.unitPrice}):</span>
                <strong>₹{activeQuoteModal.subtotal.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>Tax Breakdown ({activeQuoteModal.taxRate}):</span>
                <span>₹{activeQuoteModal.taxes.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 8, marginTop: 8, fontSize: 15 }}>
                <strong>Total Amount:</strong>
                <strong style={{ color: '#14213d' }}>
                  ₹{activeQuoteModal.totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
              <strong>Notice:</strong> {activeQuoteModal.notes} Valid until <strong>{activeQuoteModal.validityDate}</strong>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="portal-btn portal-btn-secondary"
                onClick={() => handleDownloadPDF(activeQuoteModal)}
              >
                Download PDF
              </button>
              {activeQuoteModal.status === 'Draft' && (
                <button
                  type="button"
                  className="portal-btn portal-btn-primary"
                  onClick={() => handleAcceptQuote(activeQuoteModal)}
                >
                  Accept Quotation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
