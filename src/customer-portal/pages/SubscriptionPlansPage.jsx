import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../mockData';
import { AdminIcon } from '../../admin/AdminIcons';

export function SubscriptionPlansPage({ onNavigate }) {
  const [selectedFreq, setSelectedFreq] = useState('all');
  const [activatedNotice, setActivatedNotice] = useState('');

  const filteredPlans =
    selectedFreq === 'all'
      ? SUBSCRIPTION_PLANS
      : SUBSCRIPTION_PLANS.filter((p) => p.frequency === selectedFreq);

  const handleSelectPlan = (plan) => {
    setActivatedNotice(`Selected "${plan.frequencyLabel}". Redirecting to subscription setup...`);
    setTimeout(() => {
      setActivatedNotice('');
      if (onNavigate) onNavigate('/portal/my-subscriptions');
    }, 2000);
  };

  return (
    <div className="customer-plans-page">
      <div className="portal-page-header">
        <div>
          <h2>Subscription Plans & Pricing Tiers</h2>
          <p>
            Choose the billing frequency that matches your operational rhythm: daily on-demand, weekly sprints, standard monthly growth, or annual contracts.
          </p>
        </div>

        {/* Frequency Filter Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: 3, borderRadius: 8 }}>
          {['all', 'daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setSelectedFreq(freq)}
              style={{
                border: 'none',
                background: selectedFreq === freq ? '#ffffff' : 'transparent',
                color: selectedFreq === freq ? '#14213d' : '#64748b',
                fontWeight: 700,
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
                boxShadow: selectedFreq === freq ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {freq === 'all' ? 'All Frequencies' : freq}
            </button>
          ))}
        </div>
      </div>

      {activatedNotice && (
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
          ✓ {activatedNotice}
        </div>
      )}

      {/* Grid of Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        {filteredPlans.map((plan) => {
          return (
            <div
              key={plan.id}
              className="portal-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 24,
                marginBottom: 0,
                border: plan.popular ? '2px solid #376bf4' : '1px solid #e6ecf4',
                position: 'relative',
                boxShadow: plan.popular ? '0 8px 20px -4px rgba(55, 107, 244, 0.15)' : '0 1px 3px 0 rgba(15, 23, 42, 0.04)'
              }}
            >
              <div>
                {/* Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: plan.popular ? '#ffffff' : '#376bf4',
                      backgroundColor: plan.popular ? '#376bf4' : '#eef3ff',
                      padding: '3px 8px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  >
                    {plan.badge}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    Frequency: <strong>{plan.frequency}</strong>
                  </span>
                </div>

                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: '#14213d' }}>
                  {plan.frequencyLabel}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
                  {plan.description}
                </p>

                {/* Price Display */}
                <div style={{ padding: '14px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 32, fontWeight: 800, color: '#14213d' }}>
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{plan.period}</span>
                  </div>
                  {plan.billedInfo && (
                    <small style={{ color: '#059669', fontWeight: 600, display: 'block', marginTop: 4 }}>
                      {plan.billedInfo}
                    </small>
                  )}
                </div>

                {/* Required Details: Minimum Quantity & Availability Dates */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Minimum Quantity:</span>
                    <strong style={{ color: '#14213d' }}>{plan.minQuantity} user seat{plan.minQuantity > 1 ? 's' : ''}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Availability:</span>
                    <strong style={{ color: '#14213d', textAlign: 'right', maxWidth: 160 }}>{plan.availabilityDates}</strong>
                  </div>
                </div>

                {/* Features */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                    Plan Entitlements
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {plan.features.map((feat, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#10b981', marginTop: 2, display: 'flex' }}>
                          <AdminIcon name="check" size={13} />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  className={`portal-btn ${plan.popular ? 'portal-btn-primary' : 'portal-btn-secondary'}`}
                  style={{ width: '100%' }}
                  onClick={() => handleSelectPlan(plan)}
                >
                  Choose {plan.frequencyLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Policies Matrix Table */}
      <section className="portal-card">
        <div className="portal-card-header">
          <div>
            <h3>Plan Policies & Lifecycle Rules</h3>
            <p>Summary of Pause, Renew, and Termination allowances per frequency</p>
          </div>
        </div>

        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Billing Tier</th>
                <th>Frequency</th>
                <th>Minimum Seats</th>
                <th>Pause Permitted?</th>
                <th>Renew Permitted?</th>
                <th>Mid-Term Close?</th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <tr key={plan.id}>
                  <td><strong>{plan.frequencyLabel}</strong></td>
                  <td><span style={{ textTransform: 'capitalize' }}>{plan.frequency}</span></td>
                  <td>{plan.minQuantity} seat{plan.minQuantity > 1 ? 's' : ''}</td>
                  <td>
                    {plan.allowPause ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>✓ Allowed (up to 30d)</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>✕ Not applicable</span>
                    )}
                  </td>
                  <td>
                    <span style={{ color: '#059669', fontWeight: 600 }}>✓ Auto or Manual</span>
                  </td>
                  <td>
                    {plan.allowClose ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>✓ Self-service</span>
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>Via Account Rep</span>
                    )}
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
