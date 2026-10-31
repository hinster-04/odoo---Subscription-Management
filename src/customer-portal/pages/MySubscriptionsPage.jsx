import React, { useState } from 'react';
import { MY_SUBSCRIPTIONS } from '../mockData';
import { StatusBadge } from '../components/StatusBadge';
import { AdminIcon } from '../../admin/AdminIcons';

export function MySubscriptionsPage() {
  // Local state to support live toggle of add-ons and action feedback
  const [subscriptions, setSubscriptions] = useState(MY_SUBSCRIPTIONS);
  const [actionMessage, setActionMessage] = useState(null);

  // Toggle add-on switch
  const handleToggleAddon = (subId, addonId) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id !== subId) return sub;
        const updatedAddOns = sub.addOns.map((addon) => {
          if (addon.id !== addonId) return addon;
          const newStatus = !addon.active;
          setActionMessage({
            type: 'info',
            text: `${newStatus ? 'Activated' : 'Deactivated'} add-on "${addon.name}" for subscription ${sub.id}.`
          });
          return { ...addon, active: newStatus };
        });
        return { ...sub, addOns: updatedAddOns };
      })
    );
  };

  // Handle plan actions (Pause, Renew, Close)
  const handlePlanAction = (sub, actionType) => {
    if (actionType === 'pause') {
      setActionMessage({
        type: 'warning',
        text: `Paused ${sub.product} (${sub.id}). Subscription billing is temporarily frozen for 30 days.`
      });
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'Paused' } : s))
      );
    } else if (actionType === 'renew') {
      setActionMessage({
        type: 'success',
        text: `Renewed ${sub.product} (${sub.id}). New expiry extended by one cycle.`
      });
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'Active' } : s))
      );
    } else if (actionType === 'close') {
      setActionMessage({
        type: 'danger',
        text: `Closed ${sub.product} (${sub.id}). Access will terminate at the end of the billing term.`
      });
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'Closed' } : s))
      );
    }
  };

  return (
    <div className="customer-subscriptions-page">
      <div className="portal-page-header">
        <div>
          <h2>My Subscriptions</h2>
          <p>
            Review active and previous subscriptions, toggle individual add-on licenses, and manage plan lifecycles.
          </p>
        </div>
      </div>

      {/* Action feedback message */}
      {actionMessage && (
        <div
          style={{
            backgroundColor:
              actionMessage.type === 'success'
                ? '#ecfdf5'
                : actionMessage.type === 'danger'
                ? '#fef2f2'
                : '#fffbeb',
            border: `1px solid ${
              actionMessage.type === 'success'
                ? '#a7f3d0'
                : actionMessage.type === 'danger'
                ? '#fecaca'
                : '#fde68a'
            }`,
            color:
              actionMessage.type === 'success'
                ? '#065f46'
                : actionMessage.type === 'danger'
                ? '#991b1b'
                : '#92400e',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13.5
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Subscription Cards with Add-ons and Conditional Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {subscriptions.map((sub) => {
          const { allowPause, allowRenew, allowClose } = sub.planPermissions || {};

          return (
            <div key={sub.id} className="portal-card" style={{ padding: 24, marginBottom: 0 }}>
              {/* Top Row: Product Title, Status, Number */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingBottom: 16,
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: '#eef3ff',
                      color: '#376bf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <AdminIcon name={sub.icon} size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Manrope, sans-serif', color: '#14213d' }}>
                        {sub.product}
                      </h3>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                      Subscription No: <strong style={{ fontFamily: 'monospace' }}>{sub.id}</strong> • Plan: <strong>{sub.plan}</strong> ({sub.frequency})
                    </div>
                  </div>
                </div>

                {/* Conditional Plan Buttons (shown ONLY when plan allows them) */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {allowPause && sub.status !== 'Closed' && sub.status !== 'Paused' && (
                    <button
                      type="button"
                      className="portal-btn portal-btn-warning portal-btn-sm"
                      onClick={() => handlePlanAction(sub, 'pause')}
                      title="Pause this subscription for 30 days"
                    >
                      Pause
                    </button>
                  )}

                  {allowRenew && sub.status !== 'Closed' && (
                    <button
                      type="button"
                      className="portal-btn portal-btn-primary portal-btn-sm"
                      onClick={() => handlePlanAction(sub, 'renew')}
                      title="Renew subscription for the next billing cycle"
                    >
                      Renew
                    </button>
                  )}

                  {allowClose && sub.status !== 'Closed' && (
                    <button
                      type="button"
                      className="portal-btn portal-btn-danger portal-btn-sm"
                      onClick={() => handlePlanAction(sub, 'close')}
                      title="Cancel/Close this subscription"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Quantity, Dates, Base Amount */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 16,
                  padding: '16px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 13
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Licensed Seats
                  </span>
                  <strong style={{ color: '#14213d', fontSize: 15 }}>
                    {sub.quantity} User License{sub.quantity > 1 ? 's' : ''}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Activation Date
                  </span>
                  <span style={{ color: '#334155', fontWeight: 600 }}>{sub.startDate}</span>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Expiry / Renewal Date
                  </span>
                  <span style={{ color: sub.status === 'Overdue' ? '#dc2626' : '#334155', fontWeight: 600 }}>
                    {sub.expiryDate}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Base Billing Total
                  </span>
                  <strong style={{ color: '#14213d', fontSize: 15 }}>
                    {sub.currency}{sub.baseTotal.toLocaleString('en-IN')}
                  </strong>
                  <small style={{ color: '#64748b', display: 'block' }}>
                    ({sub.quantity} × {sub.currency}{sub.unitPrice.toLocaleString('en-IN')})
                  </small>
                </div>
              </div>

              {/* Add-ons with ON/OFF Switches */}
              <div style={{ paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Modular Add-ons & Extra Capabilities
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    Toggle switch to activate or pause add-on anytime
                  </span>
                </div>

                {sub.addOns && sub.addOns.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sub.addOns.map((addon) => (
                      <div
                        key={addon.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: addon.active ? '#f8faff' : '#f8fafc',
                          border: addon.active ? '1px solid #d4e1fd' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 13, color: addon.active ? '#1e3a8a' : '#475569' }}>
                              {addon.name}
                            </strong>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: addon.active ? '#059669' : '#64748b',
                                backgroundColor: addon.active ? '#ecfdf5' : '#f1f5f9',
                                padding: '1px 6px',
                                borderRadius: 4
                              }}
                            >
                              +₹{addon.price}{addon.period}
                            </span>
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                            {addon.description}
                          </p>
                        </div>

                        {/* Interactive Toggle Switch */}
                        <label className="toggle-switch-label">
                          <input
                            type="checkbox"
                            className="toggle-switch-input"
                            checked={addon.active}
                            onChange={() => handleToggleAddon(sub.id, addon.id)}
                            aria-label={`Toggle ${addon.name}`}
                          />
                          <span className="toggle-switch-slider" />
                          <span style={{ fontSize: 12, color: addon.active ? '#10b981' : '#94a3b8' }}>
                            {addon.active ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                    No optional add-ons configured on this plan.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
