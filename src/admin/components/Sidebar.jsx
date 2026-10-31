import React from 'react';
import { ADMIN_ROUTES } from '../adminRoutes';
import { AdminIcon } from '../AdminIcons';

export function Sidebar({
  currentPath,
  onNavigate,
  isCollapsed,
  mobileOpen,
  onCloseMobile
}) {
  const normalizedCurrent = (currentPath || '').replace(/\/+$/, '') || '/admin';

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
          mobileOpen ? 'is-mobile-open' : ''
        }`}
        aria-label="Admin Navigation"
      >
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand-header">
          <a
            href="/admin"
            className="sidebar-brand-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/admin/dashboard');
            }}
          >
            <div className="sidebar-brand-mark">
              <span></span>
              <span></span>
              <span></span>
            </div>

            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">
                  brightloop<span className="sidebar-brand-period">.</span>
                </span>
                <span className="sidebar-brand-badge">ADMIN</span>
              </div>
            )}
          </a>

          {/* Mobile close button */}
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar menu"
          >
            <AdminIcon name="close" size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="sidebar-nav-container">
          <div className="sidebar-section-label">
            {!isCollapsed ? 'Management' : '•••'}
          </div>

          <ul className="sidebar-nav-list">
            {ADMIN_ROUTES.map((route) => {
              const isActive =
                route.path === normalizedCurrent ||
                (route.aliasPath && route.aliasPath === normalizedCurrent);

              return (
                <li key={route.id} className="sidebar-nav-item">
                  <a
                    href={route.path}
                    className={`sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(route.path);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? route.label : undefined}
                  >
                    <span className="nav-icon-wrapper">
                      <AdminIcon name={route.icon} size={18} />
                    </span>

                    {!isCollapsed && (
                      <span className="nav-item-label">{route.label}</span>
                    )}

                    {isActive && <span className="active-indicator" aria-hidden="true" />}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <a
            href="/"
            className="sidebar-exit-link"
            title={isCollapsed ? 'View Live Website' : undefined}
          >
            <span className="nav-icon-wrapper">
              <AdminIcon name="arrowRight" size={16} />
            </span>
            {!isCollapsed && <span>View Live Website</span>}
          </a>
        </div>
      </aside>
    </>
  );
}
