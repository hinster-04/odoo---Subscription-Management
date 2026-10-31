import React from 'react';
import { CUSTOMER_ROUTES } from '../customerRoutes';
import { AdminIcon } from '../../admin/AdminIcons';

export function CustomerSidebar({
  currentPath,
  onNavigate,
  isCollapsed,
  mobileOpen,
  onCloseMobile,
  onLogout
}) {
  const normalizedCurrent = (currentPath || '').replace(/\/+$/, '') || '/portal/dashboard';

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="customer-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`customer-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
          mobileOpen ? 'is-mobile-open' : ''
        }`}
        aria-label="Customer Navigation"
      >
        {/* Sidebar Brand Header */}
        <div className="customer-sidebar-brand">
          <a
            href="/portal/dashboard"
            className="customer-brand-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/portal/dashboard');
            }}
          >
            <div className="customer-brand-mark">
              <span></span>
              <span></span>
              <span></span>
            </div>

            {!isCollapsed && (
              <div className="customer-brand-text">
                <span className="customer-brand-name">
                  brightloop<span className="customer-brand-period">.</span>
                </span>
                <span className="customer-brand-badge">PORTAL</span>
              </div>
            )}
          </a>

          {/* Mobile close button */}
          {mobileOpen && (
            <button
              type="button"
              className="customer-toggle-btn"
              onClick={onCloseMobile}
              aria-label="Close menu"
              style={{ width: 30, height: 30 }}
            >
              <AdminIcon name="close" size={16} />
            </button>
          )}
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="customer-sidebar-nav">
          <div className="customer-sidebar-section">
            {!isCollapsed ? 'Customer Workspace' : '•••'}
          </div>

          <ul className="customer-nav-list">
            {CUSTOMER_ROUTES.map((route) => {
              const isActive =
                route.path === normalizedCurrent ||
                (route.aliasPath && route.aliasPath === normalizedCurrent);

              return (
                <li key={route.id} className="customer-nav-item">
                  <a
                    href={route.path}
                    className={`customer-nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(route.path);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? route.label : undefined}
                  >
                    <span className="customer-nav-icon">
                      <AdminIcon name={route.icon} size={18} />
                    </span>

                    {!isCollapsed && (
                      <span className="customer-nav-label">{route.label}</span>
                    )}

                    {isActive && (
                      <span className="customer-nav-indicator" aria-hidden="true" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer: Log out button at bottom */}
        <div className="customer-sidebar-footer">
          <button
            type="button"
            className="customer-logout-btn"
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                onNavigate('/login');
              }
            }}
            title={isCollapsed ? 'Log out' : undefined}
          >
            <span className="customer-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
