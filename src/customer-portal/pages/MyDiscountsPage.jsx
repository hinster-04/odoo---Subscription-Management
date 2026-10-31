import React, { useState } from 'react';
import { MY_DISCOUNTS } from '../mockData';
import { StatusBadge } from '../components/StatusBadge';
import { AdminIcon } from '../../admin/AdminIcons';

export function MyDiscountsPage() {
  const [discountsList, setDiscountsList] = useState(MY_DISCOUNTS);
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (discountsList.some((d) => d.code === cleanCode)) {
      setCouponMessage({ type: 'warning', text: `Coupon code "${cleanCode}" is already active in your account.` });
      return;
    }

    if (cleanCode === 'FESTIVE25') {
      const newDisc = {
        id: `DISC-${Date.now()}`,
        code: 'FESTIVE25',
        title: 'Festival Season Business Special',
        discount: '25% OFF',
        type: 'percentage',
        appliedTo: 'Next Upcoming Subscription Renewal',
        validUntil: '31 Dec 2026',
        status: 'Active',
        savingsAmount: 'Up to ₹5,000',
        description: 'Applied automatically to your next invoice generation.'
      };
      setDiscountsList([newDisc, ...discountsList]);
      setCouponMessage({ type: 'success', text: `Coupon "${cleanCode}" applied successfully! 25% discount added.` });
      setCouponInput('');
    } else {
      setCouponMessage({
        type: 'error',
        text: `Invalid or expired coupon code "${cleanCode}". Try testing with demo code "FESTIVE25".`
      });
    }
  };

  return (
    <div className="customer-discounts-page">
      <div className="portal-page-header">
        <div>
          <h2>My Discounts & Special Perks</h2>
          <p>
            Promotional coupon vouchers, enterprise volume rebates, and recurring partnership discounts.
          </p>
        </div>
      </div>

      {/* Coupon Application Box */}
      <section className="portal-card" style={{ padding: 22, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontFamily: 'Manrope, sans-serif' }}>
          Have a promotional voucher or enterprise discount code?
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>
          Enter your Brightloop voucher code to apply savings directly to your active subscriptions or quotes.
        </p>

        <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 10, maxWidth: 480 }}>
          <input
            type="text"
            className="portal-input"
            placeholder="e.g. FESTIVE25"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            style={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}
          />
          <button type="submit" className="portal-btn portal-btn-primary" style={{ flexShrink: 0 }}>
            Apply Code
          </button>
        </form>

        {couponMessage && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12.5,
              backgroundColor: couponMessage.type === 'success' ? '#ecfdf5' : couponMessage.type === 'warning' ? '#fffbeb' : '#fef2f2',
              color: couponMessage.type === 'success' ? '#065f46' : couponMessage.type === 'warning' ? '#92400e' : '#b91c1c',
              border: `1px solid ${couponMessage.type === 'success' ? '#a7f3d0' : couponMessage.type === 'warning' ? '#fde68a' : '#fecaca'}`
            }}
          >
            {couponMessage.text}
          </div>
        )}
      </section>

      {/* Discounts Table */}
      <section className="portal-card">
        <div className="portal-card-header">
          <div>
            <h3>Active & Applied Discounts</h3>
            <p>Vouchers automatically credited against your billing accounts</p>
          </div>
        </div>

        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Details</th>
                <th>Benefit Value</th>
                <th>Applied Directly To</th>
                <th>Valid Until</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {discountsList.map((disc) => (
                <tr key={disc.id}>
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: '#1d4ed8',
                        backgroundColor: '#eef3ff',
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid #d4e1fd'
                      }}
                    >
                      {disc.code}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#14213d' }}>{disc.title}</strong>
                    <span style={{ display: 'block', color: '#64748b', fontSize: 12 }}>
                      {disc.description}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontSize: 14 }}>{disc.discount}</strong>
                    <small style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                      Est. saving {disc.savingsAmount}
                    </small>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{disc.appliedTo}</span>
                  </td>
                  <td>
                    <span style={{ color: disc.status === 'Active' ? '#14213d' : '#94a3b8' }}>
                      {disc.validUntil}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={disc.status} />
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
