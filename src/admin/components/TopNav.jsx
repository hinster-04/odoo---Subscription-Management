import React from 'react';
import { AdminIcon } from '../AdminIcons';
import { Breadcrumbs } from './Breadcrumbs';

export function TopNav({
  pageTitle,
  breadcrumbs,
  onNavigate,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleCollapse
}) {
  return (
    <header className="admin-topnav">
      <div className="topnav-left">
        {/* Mobile menu trigger */}
        <button
          type="button"
          className="topnav-icon-btn mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Open mobile navigation menu"
        >
          <AdminIcon name="menu" size={20} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          className="topnav-icon-btn desktop-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <AdminIcon name={isSidebarCollapsed ? 'panelExpand' : 'panelCollapse'} size={18} />
        </button>

        {/* Page title and breadcrumbs */}
        <div className="topnav-heading-group">
          <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
          <h1 className="topnav-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="topnav-right">
        {/* Visual search field */}
        <div className="topnav-search" role="search">
          <span className="search-icon">
            <AdminIcon name="search" size={16} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search subscriptions, customers, invoices..."
            readOnly
            aria-label="Search"
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>

        {/* Visual notification bell */}
        <button
          type="button"
          className="topnav-icon-btn notification-btn"
          aria-label="Notifications (visual only)"
          title="Notifications"
        >
          <AdminIcon name="bell" size={18} />
          <span className="notification-badge-dot" aria-hidden="true" />
        </button>

        <div className="topnav-divider" aria-hidden="true" />

        {/* Visual admin profile area */}
        <div className="topnav-profile" title="Admin Account">
          <div className="profile-avatar">
            <span>AM</span>
          </div>
          <div className="profile-details">
            <span className="profile-name">Alex Morgan</span>
            <span className="profile-role">Administrator</span>
          </div>
          <span className="profile-chevron">
            <AdminIcon name="chevronDown" size={14} />
          </span>
        </div>
      </div>
    </header>
  );
}
