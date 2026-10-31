import React from 'react';
import { AdminIcon } from '../../admin/AdminIcons';
import { OverviewCard } from '../../admin/components/OverviewCard';
import { MonthlySpendingChart, PaidVsOutstandingChart } from '../components/CustomerCharts';
import { StatusBadge } from '../components/StatusBadge';
import { ANALYTICS_DATA, CURRENT_CUSTOMER } from '../mockData';

export function DashboardPage({ onNavigate }) {
  return (
    <div className="customer-dashboard-page">
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d4e1fd',
          borderLeft: '4px solid #376bf4',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#14213d', fontFamily: 'Manrope, sans-serif' }}>
            Welcome back, {CURRENT_CUSTOMER.first_name}!
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Account for <strong>{CURRENT_CUSTOMER.business_name}</strong>. Here is your current subscription portfolio summary.
          </p>
        </div>
        <button
          type="button"
          className="portal-btn portal-btn-primary portal-btn-sm"
          onClick={() => onNavigate && onNavigate('/portal/products')}
        >
          <AdminIcon name="products" size={15} />
          <span>Explore Products</span>
        </button>
      </div>

      {/* 4 Required Summary Cards */}
      <section className="portal-kpi-grid" aria-label="Key Subscription Metrics">
        {/* 1. Active Subscriptions */}
        <OverviewCard
          title="Active Subscriptions"
          value={String(ANALYTICS_DATA.activeSubscriptionsCount)}
          badgeText="3 Active"
          subtext="Flow, Books & People"
          icon="subscriptions"
        />

        {/* 2. Upcoming Billing Date */}
        <OverviewCard
          title="Upcoming Billing"
          value={ANALYTICS_DATA.upcomingBillingDate}
          change="In 7 days"
          isPositive={true}
          subtext="Next renewal cycle"
          icon="plans"
        />

        {/* 3. Total Paid */}
        <OverviewCard
          title="Total Paid"
          value={ANALYTICS_DATA.totalPaidAmount}
          change="87% Settled"
          isPositive={true}
          subtext="Lifetime billing"
          icon="payments"
        />

        {/* 4. Outstanding Amount */}
        <OverviewCard
          title="Outstanding Amount"
          value={ANALYTICS_DATA.outstandingAmount}
          change="Action required"
          isPositive={false}
          subtext="2 invoices pending"
          icon="invoices"
        />
      </section>

      {/* Analytics Section: Monthly spending chart & Paid vs Outstanding chart */}
      <section className="portal-analytics-grid" aria-label="Subscription Analytics">
        <MonthlySpendingChart />
        <PaidVsOutstandingChart />
      </section>

      {/* Upcoming Billing List */}
      <section className="portal-card" aria-label="Upcoming Billing Schedule">
        <div className="portal-card-header">
          <div>
            <h3>Upcoming Billing Schedule</h3>
            <p>Anticipated auto-renewals and settlement milestones</p>
          </div>
          <button
            type="button"
            className="portal-btn portal-btn-secondary portal-btn-sm"
            onClick={() => onNavigate && onNavigate('/portal/my-invoices')}
          >
            <span>View All Invoices</span>
            <AdminIcon name="arrowRight" size={13} />
          </button>
        </div>

        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Billing Date</th>
                <th>Product & Service</th>
                <th>Billing Cycle</th>
                <th>Estimated Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ANALYTICS_DATA.upcomingBillingList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ color: '#14213d' }}>{item.date}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{item.product}</span>
                    <small style={{ display: 'block', color: '#94a3b8', fontSize: 11 }}>ID: {item.id}</small>
                  </td>
                  <td>
                    <span style={{ color: '#475569' }}>{item.cycle}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#14213d' }}>{item.amount}</strong>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="portal-btn portal-btn-secondary portal-btn-sm"
                      onClick={() => onNavigate && onNavigate('/portal/my-subscriptions')}
                    >
                      Manage
                    </button>
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
