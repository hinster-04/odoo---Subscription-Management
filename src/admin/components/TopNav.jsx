import React, { useState } from 'react';
import { AdminIcon } from '../AdminIcons';
import { Breadcrumbs } from './Breadcrumbs';
import { useAuth } from '../../context/AuthContext.jsx';

export function TopNav({
  pageTitle,
  breadcrumbs,
  onNavigate,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleCollapse
}) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const displayName = user?.name || (user?.role === 'staff' ? 'Staff Member' : 'Administrator');
  const roleLabel = user?.role === 'staff' ? (user.designation || 'Staff') : 'Administrator';
  const firstName = user?.firstName || user?.first_name || (user?.role === 'staff' ? 'S' : 'A');
  const lastName = user?.lastName || user?.last_name || 'M';
  const initials = ((firstName[0] || 'A') + (lastName[0] || '')).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      if (onNavigate) {
        onNavigate('/login');
      } else {
        window.location.href = '/login';
      }
    }
  };

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

        {/* Visual admin profile area with interactive dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            className="topnav-profile"
            title="Account Options"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          >
            <div className="profile-avatar">
              <span>{initials}</span>
            </div>
            <div className="profile-details">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">{roleLabel}</span>
            </div>
            <span className="profile-chevron">
              <AdminIcon name="chevronDown" size={14} />
            </span>
          </div>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 220,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                padding: '8px 0',
                zIndex: 100,
                fontSize: 13
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{displayName}</p>
                <small style={{ color: '#64748b' }}>{user?.email || 'admin@brightloop.dev'}</small>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  color: '#b91c1c',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
