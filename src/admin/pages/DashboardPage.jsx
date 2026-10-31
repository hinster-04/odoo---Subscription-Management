import React from 'react';
import { OverviewCard } from '../components/OverviewCard';
import { RevenueChart, SubscriptionChart } from '../components/DashboardCharts';
import { AdminIcon } from '../AdminIcons';

// Static demonstration data for tables
const RECENT_SUBSCRIPTIONS = [
  {
    id: 'SUB-4102',
    customer: 'Apex Global Logistics',
    plan: 'Brightloop Core (ERP)',
    cycle: 'Annual',
    amount: '₹29,988',
    status: 'Active',
    date: '28 Oct 2026'
  },
  {
    id: 'SUB-4101',
    customer: 'Zenith Labs Biotech',
    plan: 'Brightloop Flow (CRM)',
    cycle: 'Monthly',
    amount: '₹1,299',
    status: 'Active',
    date: '27 Oct 2026'
  },
  {
    id: 'SUB-4100',
    customer: 'Kavita Design Studio',
    plan: 'Brightloop Books',
    cycle: 'Monthly',
    amount: '₹699',
    status: 'Trial (12d)',
    date: '26 Oct 2026'
  },
  {
    id: 'SUB-4099',
    customer: 'Nexus Horizon Infotech',
    plan: 'Brightloop People',
    cycle: 'Annual',
    amount: '₹10,788',
    status: 'Active',
    date: '24 Oct 2026'
  },
  {
    id: 'SUB-4098',
    customer: 'Cascade Retail Goods',
    plan: 'Brightloop Stock',
    cycle: 'Monthly',
    amount: '₹999',
    status: 'Past Due',
    date: '21 Oct 2026'
  }
];

const RECENT_PAYMENTS = [
  {
    id: 'PAY-8912',
    invoice: 'INV-2026-084',
    customer: 'Apex Global Logistics',
    method: 'HDFC NetBanking',
    amount: '₹29,988',
    status: 'Paid',
    date: '28 Oct, 14:22'
  },
  {
    id: 'PAY-8911',
    invoice: 'INV-2026-083',
    customer: 'Zenith Labs Biotech',
    method: 'Razorpay UPI',
    amount: '₹1,299',
    status: 'Paid',
    date: '27 Oct, 09:14'
  },
  {
    id: 'PAY-8910',
    invoice: 'INV-2026-082',
    customer: 'Nexus Horizon Infotech',
    method: 'Corporate Card',
    amount: '₹10,788',
    status: 'Paid',
    date: '24 Oct, 18:45'
  },
  {
    id: 'PAY-8909',
    invoice: 'INV-2026-081',
    customer: 'Pioneer Pharma Ltd',
    method: 'NEFT Transfer',
    amount: '₹24,500',
    status: 'Processing',
    date: '23 Oct, 11:30'
  },
  {
    id: 'PAY-8908',
    invoice: 'INV-2026-080',
    customer: 'Cascade Retail Goods',
    method: 'Visa •••• 4242',
    amount: '₹999',
    status: 'Failed',
    date: '21 Oct, 16:02'
  }
];

export function DashboardPage({ onNavigate }) {
  return (
    <div className="admin-dashboard-page">
      {/* Top Banner Notice */}
      <div className="dashboard-notice-banner">
        <div className="notice-content">
          <span className="notice-icon">
            <AdminIcon name="dashboard" size={16} />
          </span>
          <p>
            <strong>Internal Admin Panel Base:</strong> Displaying static demonstration data for design validation. Real business logic and database integration will be linked in future development steps.
          </p>
        </div>
      </div>

      {/* 6 Required Overview Cards */}
      <section className="overview-cards-grid" aria-label="Key Performance Indicators">
        {/* 1. Total Customers */}
        <OverviewCard
          title="Total Customers"
          value="1,284"
          change="+12.5%"
          isPositive={true}
          subtext="vs last month"
          icon="customers"
        />

        {/* 2. Total Products */}
        <OverviewCard
          title="Total Products"
          value="6"
          badgeText="Active Catalog"
          subtext="6 live products"
          icon="products"
        />

        {/* 3. Active Subscriptions */}
        <OverviewCard
          title="Active Subscriptions"
          value="892"
          change="+8.3%"
          isPositive={true}
          subtext="94.2% retention"
          icon="subscriptions"
        />

        {/* 4. Monthly Recurring Revenue */}
        <OverviewCard
          title="Monthly Recurring Revenue"
          value="₹14,82,500"
          change="+14.2%"
          isPositive={true}
          subtext="MRR run-rate"
          icon="plans"
        />

        {/* 5. Total Revenue */}
        <OverviewCard
          title="Total Revenue"
          value="₹1.84 Cr"
          change="+28.4%"
          isPositive={true}
          subtext="Fiscal YTD"
          icon="reports"
        />

        {/* 6. Outstanding Invoices */}
        <OverviewCard
          title="Outstanding Invoices"
          value="₹1,24,000"
          change="14 pending"
          isPositive={false}
          subtext="Requires follow-up"
          icon="invoices"
        />
      </section>

      {/* Charts Section */}
      <section className="dashboard-charts-grid" aria-label="Visual Analytics">
        <RevenueChart />
        <SubscriptionChart />
      </section>

      {/* Recent Subscriptions & Recent Payments Tables */}
      <section className="dashboard-tables-grid" aria-label="Recent Operational Activity">
        {/* Recent Subscriptions */}
        <div className="admin-table-card">
          <div className="table-card-header">
            <div>
              <h3 className="table-title">Recent Subscriptions</h3>
              <p className="table-subtitle">Latest customer activations and renewals</p>
            </div>
            <a
              href="/admin/subscriptions"
              className="table-view-all-link"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/admin/subscriptions');
              }}
            >
              <span>View all</span>
              <AdminIcon name="arrowRight" size={14} />
            </a>
          </div>

          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subscription</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_SUBSCRIPTIONS.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span className="font-mono text-muted">{sub.id}</span>
                    </td>
                    <td>
                      <strong>{sub.customer}</strong>
                    </td>
                    <td>
                      <span className="badge-sub-plan">{sub.plan}</span>
                      <small className="block-sub-text">{sub.cycle}</small>
                    </td>
                    <td>
                      <strong>{sub.amount}</strong>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          sub.status.includes('Active')
                            ? 'status-success'
                            : sub.status.includes('Trial')
                            ? 'status-warning'
                            : 'status-danger'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="admin-table-card">
          <div className="table-card-header">
            <div>
              <h3 className="table-title">Recent Payments</h3>
              <p className="table-subtitle">Live gateway transactions and settlements</p>
            </div>
            <a
              href="/admin/payments"
              className="table-view-all-link"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/admin/payments');
              }}
            >
              <span>View all</span>
              <AdminIcon name="arrowRight" size={14} />
            </a>
          </div>

          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_PAYMENTS.map((pmt) => (
                  <tr key={pmt.id}>
                    <td>
                      <span className="font-mono text-muted">{pmt.id}</span>
                      <small className="block-sub-text">{pmt.invoice}</small>
                    </td>
                    <td>
                      <strong>{pmt.customer}</strong>
                    </td>
                    <td>
                      <span className="text-secondary">{pmt.method}</span>
                      <small className="block-sub-text">{pmt.date}</small>
                    </td>
                    <td>
                      <strong>{pmt.amount}</strong>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          pmt.status === 'Paid'
                            ? 'status-success'
                            : pmt.status === 'Processing'
                            ? 'status-warning'
                            : 'status-danger'
                        }`}
                      >
                        {pmt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
