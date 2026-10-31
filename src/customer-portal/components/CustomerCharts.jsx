import React, { useState } from 'react';
import { ANALYTICS_DATA } from '../mockData';

export function MonthlySpendingChart() {
  const [activeBar, setActiveBar] = useState(
    ANALYTICS_DATA.monthlySpending[ANALYTICS_DATA.monthlySpending.length - 1]
  );

  return (
    <div className="portal-chart-card">
      <div className="chart-header-row">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8 }}>
            SUBSCRIPTION EXPENDITURE (PAST 6 MONTHS)
          </span>
          <h3>Monthly Spending</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#376bf4', backgroundColor: '#eef3ff', padding: '3px 8px', borderRadius: 4 }}>
            Verified Invoices
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, paddingBottom: 14, marginBottom: 18, borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
            Selected Month ({activeBar.month})
          </span>
          <strong style={{ fontSize: 20, color: '#14213d', fontFamily: 'Manrope, sans-serif' }}>
            ₹{activeBar.amount.toLocaleString('en-IN')}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
            Monthly Average
          </span>
          <strong style={{ fontSize: 20, color: '#14213d', fontFamily: 'Manrope, sans-serif' }}>
            ₹9,184
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
            Active Run Rate
          </span>
          <strong style={{ fontSize: 20, color: '#10b981', fontFamily: 'Manrope, sans-serif' }}>
            +68.8% YoY
          </strong>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="chart-bars-container" aria-label="Monthly spending bar chart" style={{ height: 190 }}>
        <div className="chart-grid-lines">
          <div className="grid-line"><span>₹16K</span></div>
          <div className="grid-line"><span>₹12K</span></div>
          <div className="grid-line"><span>₹8K</span></div>
          <div className="grid-line"><span>₹4K</span></div>
          <div className="grid-line"><span>₹0</span></div>
        </div>

        <div className="bars-track">
          {ANALYTICS_DATA.monthlySpending.map((item) => {
            const isSelected = activeBar.month === item.month;
            return (
              <div
                key={item.month}
                className={`chart-bar-col ${isSelected ? 'is-selected' : ''}`}
                onMouseEnter={() => setActiveBar(item)}
                onClick={() => setActiveBar(item)}
              >
                <div className="bar-tooltip">
                  <strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                  <span>{item.month} 2026</span>
                </div>
                <div className="bar-pillar-wrap">
                  <div
                    className="bar-pillar"
                    style={{
                      height: `${item.height}%`,
                      background: isSelected
                        ? 'linear-gradient(180deg, #1d4ed8, #376bf4)'
                        : 'linear-gradient(180deg, #376bf4, #81a4fd)'
                    }}
                  />
                </div>
                <span className="bar-month-label">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PaidVsOutstandingChart() {
  const { paidFormatted, paidPercent, outstandingFormatted, outstandingPercent } =
    ANALYTICS_DATA.paidVsOutstanding;

  return (
    <div className="portal-chart-card">
      <div className="chart-header-row">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8 }}>
            PAYMENT RECONCILIATION
          </span>
          <h3>Paid vs. Outstanding</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '14px', border: '1px solid #a7f3d0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', display: 'block', textTransform: 'uppercase' }}>
            Total Paid
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#065f46', fontFamily: 'Manrope, sans-serif' }}>
            {paidFormatted}
          </div>
          <small style={{ color: '#059669', fontSize: 11 }}>{paidPercent}% cleared</small>
        </div>

        <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px', border: '1px solid #fecaca' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', display: 'block', textTransform: 'uppercase' }}>
            Outstanding
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#991b1b', fontFamily: 'Manrope, sans-serif' }}>
            {outstandingFormatted}
          </div>
          <small style={{ color: '#dc2626', fontSize: 11 }}>{outstandingPercent}% pending</small>
        </div>
      </div>

      {/* Segmented Dual Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
          <span>Settled: {paidPercent}%</span>
          <span>Due: {outstandingPercent}%</span>
        </div>
        <div style={{ width: '100%', height: 14, borderRadius: 7, overflow: 'hidden', display: 'flex', backgroundColor: '#f1f5f9' }}>
          <div
            style={{
              width: `${paidPercent}%`,
              backgroundColor: '#10b981',
              transition: 'width 0.4s ease'
            }}
            title={`Paid: ${paidFormatted} (${paidPercent}%)`}
          />
          <div
            style={{
              width: `${outstandingPercent}%`,
              backgroundColor: '#ef4444',
              transition: 'width 0.4s ease'
            }}
            title={`Outstanding: ${outstandingFormatted} (${outstandingPercent}%)`}
          />
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            <span>Settled Invoices (4 transactions)</span>
          </div>
          <strong style={{ color: '#14213d' }}>{paidFormatted}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            <span>Pending Invoices (2 invoices)</span>
          </div>
          <strong style={{ color: '#b91c1c' }}>{outstandingFormatted}</strong>
        </div>
      </div>
    </div>
  );
}
