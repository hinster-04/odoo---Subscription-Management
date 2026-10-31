import React, { useState } from 'react';
import { MY_PAYMENTS, OUTSTANDING_PAYMENTS } from '../mockData';
import { StatusBadge } from '../components/StatusBadge';
import { AdminIcon } from '../../admin/AdminIcons';

export function MyPaymentsPage({ onNavigate }) {
  const [payments, setPayments] = useState(MY_PAYMENTS);
  const [outstandingList, setOutstandingList] = useState(OUTSTANDING_PAYMENTS);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState('');

  const handleSettleOutstanding = (item) => {
    // Remove from outstanding and add to payment history
    setOutstandingList((prev) => prev.filter((o) => o.invoiceId !== item.invoiceId));
    const newPayment = {
      id: `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: item.amount,
      date: 'Just now',
      method: 'HDFC Instant NetBanking',
      relatedInvoice: item.invoiceId,
      gatewayRef: `PG_SETTLE_${Date.now()}`,
      status: 'Paid'
    };
    setPayments((prev) => [newPayment, ...prev]);
    setPaymentSuccessNotice(`Successfully settled payment of ${item.amount} for ${item.invoiceId}.`);
    setTimeout(() => setPaymentSuccessNotice(''), 5000);
  };

  return (
    <div className="customer-payments-page">
      <div className="portal-page-header">
        <div>
          <h2>My Payments & Transactions</h2>
          <p>
            Review settled transaction history, payment gateway references, and clear outstanding balances.
          </p>
        </div>
      </div>

      {paymentSuccessNotice && (
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
          ✓ {paymentSuccessNotice}
        </div>
      )}

      {/* Outstanding Payments Section */}
      <section className="portal-card" style={{ borderLeft: '4px solid #ef4444' }}>
        <div className="portal-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ color: '#991b1b' }}>Outstanding Payments</h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  padding: '2px 8px',
                  borderRadius: 12
                }}
              >
                {outstandingList.length} Pending
              </span>
            </div>
            <p>Immediate payments due on recurring subscriptions</p>
          </div>
        </div>

        {outstandingList.length > 0 ? (
          <div className="portal-table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Related Invoice</th>
                  <th>Subscription Product</th>
                  <th>Due Date</th>
                  <th>Amount Payable</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {outstandingList.map((item) => (
                  <tr key={item.invoiceId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#376bf4' }}>
                        {item.invoiceId}
                      </span>
                    </td>
                    <td>
                      <strong>{item.product}</strong>
                    </td>
                    <td>
                      <span style={{ color: item.status === 'Overdue' ? '#dc2626' : '#475569', fontWeight: 600 }}>
                        {item.dueDate}
                      </span>
                      {item.overdueDays && (
                        <small style={{ display: 'block', color: '#dc2626', fontSize: 11 }}>
                          {item.overdueDays} days past due
                        </small>
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: 15, color: '#991b1b' }}>{item.amount}</strong>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="portal-btn portal-btn-primary portal-btn-sm"
                        onClick={() => handleSettleOutstanding(item)}
                      >
                        Settle Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#059669', fontSize: 14 }}>
            ✓ All accounts and invoices are completely settled. No outstanding balance!
          </div>
        )}
      </section>

      {/* Payment History Section */}
      <section className="portal-card">
        <div className="portal-card-header">
          <div>
            <h3>Payment Transaction History</h3>
            <p>All cleared gateway receipts and banking records</p>
          </div>
        </div>

        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Date & Time</th>
                <th>Payment Method</th>
                <th>Related Invoice</th>
                <th>Gateway Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pmt) => (
                <tr key={pmt.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#14213d' }}>
                      {pmt.id}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#047857', fontSize: 14.5 }}>{pmt.amount}</strong>
                  </td>
                  <td>
                    <span style={{ color: '#475569' }}>{pmt.date}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#14213d' }}>{pmt.method}</span>
                  </td>
                  <td>
                    <a
                      href="/portal/my-invoices"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNavigate) onNavigate('/portal/my-invoices');
                      }}
                      style={{ color: '#376bf4', textDecoration: 'underline', fontFamily: 'monospace' }}
                    >
                      {pmt.relatedInvoice}
                    </a>
                  </td>
                  <td>
                    <small style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                      {pmt.gatewayRef}
                    </small>
                  </td>
                  <td>
                    <StatusBadge status={pmt.status} />
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
