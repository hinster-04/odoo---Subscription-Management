import React, { useState } from 'react';
import { AdminIcon } from '../AdminIcons';

// Static demonstration data
const REVENUE_DATA = [
  { month: 'May', value: 8.4, formatted: '₹8.4L', height: 48 },
  { month: 'Jun', value: 9.8, formatted: '₹9.8L', height: 56 },
  { month: 'Jul', value: 11.2, formatted: '₹11.2L', height: 64 },
  { month: 'Aug', value: 12.6, formatted: '₹12.6L', height: 72 },
  { month: 'Sep', value: 13.9, formatted: '₹13.9L', height: 80 },
  { month: 'Oct', value: 14.8, formatted: '₹14.8L', height: 86 }
];

const PLAN_DISTRIBUTION = [
  { name: 'Brightloop Flow (CRM)', count: 342, percentage: 38, color: '#376bf4' },
  { name: 'Brightloop Core (ERP)', count: 218, percentage: 24, color: '#10b981' },
  { name: 'Brightloop People (HRM)', count: 184, percentage: 21, color: '#8b5cf6' },
  { name: 'Brightloop Books', count: 148, percentage: 17, color: '#f59e0b' }
];

export function RevenueChart() {
  const [activeBar, setActiveBar] = useState(REVENUE_DATA[REVENUE_DATA.length - 1]);

  return (
    <div className="admin-chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-tagline">FINANCIAL METRICS (DEMO DATA)</div>
          <h3 className="chart-title">Revenue Overview</h3>
        </div>
        <div className="chart-actions">
          <span className="demo-data-pill">Placeholder Data</span>
          <div className="chart-period-tabs">
            <button type="button" className="period-tab active">Last 6 Months</button>
            <button type="button" className="period-tab">FY 2026</button>
          </div>
        </div>
      </div>

      <div className="chart-stat-summary">
        <div>
          <span className="summary-label">Selected Month ({activeBar.month})</span>
          <div className="summary-val">{activeBar.formatted}</div>
        </div>
        <div>
          <span className="summary-label">Average Monthly Run Rate</span>
          <div className="summary-val">₹11.8L</div>
        </div>
        <div>
          <span className="summary-label">Period Growth</span>
          <div className="summary-val text-positive">+76.2%</div>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="chart-bars-container" aria-label="Revenue bar chart">
        <div className="chart-grid-lines">
          <div className="grid-line"><span>₹16L</span></div>
          <div className="grid-line"><span>₹12L</span></div>
          <div className="grid-line"><span>₹8L</span></div>
          <div className="grid-line"><span>₹4L</span></div>
          <div className="grid-line"><span>₹0</span></div>
        </div>

        <div className="bars-track">
          {REVENUE_DATA.map((item) => {
            const isSelected = activeBar.month === item.month;
            return (
              <div
                key={item.month}
                className={`chart-bar-col ${isSelected ? 'is-selected' : ''}`}
                onMouseEnter={() => setActiveBar(item)}
                onClick={() => setActiveBar(item)}
              >
                <div className="bar-tooltip">
                  <strong>{item.formatted}</strong>
                  <span>{item.month} 2026</span>
                </div>
                <div className="bar-pillar-wrap">
                  <div
                    className="bar-pillar"
                    style={{ height: `${item.height}%` }}
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

export function SubscriptionChart() {
  return (
    <div className="admin-chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-tagline">PLAN UTILIZATION (DEMO DATA)</div>
          <h3 className="chart-title">Subscription Overview</h3>
        </div>
        <div className="chart-actions">
          <span className="demo-data-pill">Placeholder Data</span>
        </div>
      </div>

      <div className="subscription-breakdown-panel">
        <div className="donut-summary-row">
          <div className="donut-metric-block">
            <span className="metric-num">892</span>
            <span className="metric-desc">Total Active Subscriptions</span>
          </div>
          <div className="donut-metric-block">
            <span className="metric-num text-positive">94.2%</span>
            <span className="metric-desc">Monthly Retention Rate</span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="segmented-progress-track" aria-label="Subscription plan breakdown">
          {PLAN_DISTRIBUTION.map((plan) => (
            <div
              key={plan.name}
              className="progress-segment"
              style={{
                width: `${plan.percentage}%`,
                backgroundColor: plan.color
              }}
              title={`${plan.name}: ${plan.count} (${plan.percentage}%)`}
            />
          ))}
        </div>

        {/* Legend listing */}
        <div className="chart-legend-list">
          {PLAN_DISTRIBUTION.map((plan) => (
            <div key={plan.name} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: plan.color }}
              />
              <span className="legend-name">{plan.name}</span>
              <span className="legend-count">{plan.count} subs</span>
              <span className="legend-pct">{plan.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
