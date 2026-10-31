import React, { useState } from 'react';
import { AdminIcon } from '../../admin/AdminIcons';
import { Breadcrumbs } from '../../admin/components/Breadcrumbs';
import { CURRENT_CUSTOMER } from '../mockData';

export function CustomerTopNav({
  pageTitle,
  breadcrumbs,
  onNavigate,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleCollapse
}) {
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  return (
    <header className="customer-topnav">
      <div className="customer-topnav-left">
        {/* Mobile menu trigger */}
        <button
          type="button"
          className="customer-toggle-btn mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle mobile menu"
        >
          <AdminIcon name="menu" size={20} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          className="customer-toggle-btn desktop-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={isSidebarCollapsed ? 'Expand sidebar labels' : 'Collapse sidebar labels'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse to icon-only'}
        >
          <AdminIcon name={isSidebarCollapsed ? 'panelExpand' : 'panelCollapse'} size={18} />
        </button>

        {/* Breadcrumbs and Page Title */}
        <div>
          <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
          <h1 className="customer-topnav-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="customer-topnav-right">
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="customer-notification-btn"
            onClick={() => setShowNotificationToast(!showNotificationToast)}
            aria-label="Notifications"
            title="Notifications (1 urgent)"
          >
            <AdminIcon name="bell" size={18} />
            <span className="customer-notification-dot" aria-hidden="true" />
          </button>

          {/* Simple Dropdown Notice */}
          {showNotificationToast && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 290,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                padding: '14px 16px',
                zIndex: 60,
                fontSize: 13
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ color: '#14213d' }}>Notifications</strong>
                <span style={{ fontSize: 11, color: '#376bf4', cursor: 'pointer' }} onClick={() => setShowNotificationToast(false)}>Close</span>
              </div>
              <div style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ margin: 0, color: '#b91c1c', fontWeight: 600 }}>Invoice Overdue: INV-2026-088</p>
                <small style={{ color: '#64748b' }}>₹1,413.64 due on 25 Oct 2026</small>
              </div>
              <div style={{ padding: '8px 0' }}>
                <p style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>Quotation Received: QUO-2026-104</p>
                <small style={{ color: '#64748b' }}>Brightloop Core ERP Suite quotation ready</small>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Pill */}
        <div
          className="customer-user-avatar-pill"
          onClick={() => onNavigate && onNavigate('/portal/my-account')}
          title="View My Account"
          role="button"
          tabIndex={0}
        >
          <div className="customer-avatar-circle">
            {CURRENT_CUSTOMER.first_name[0]}{CURRENT_CUSTOMER.last_name[0]}
          </div>
          <div className="customer-avatar-details">
            <span className="customer-avatar-name">
              {CURRENT_CUSTOMER.first_name} {CURRENT_CUSTOMER.last_name}
            </span>
            <span className="customer-avatar-sub">
              {CURRENT_CUSTOMER.business_name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
