import React, { useState, useEffect } from 'react';
import { ADMIN_NAV_GROUPS, getGroupIdForPath } from '../adminRoutes';
import { AdminIcon } from '../AdminIcons';

export function Sidebar({
  currentPath,
  onNavigate,
  isCollapsed,
  mobileOpen,
  onCloseMobile
}) {
  const normalizedCurrent = (currentPath || '').replace(/\/+$/, '') || '/admin';
  const activeGroupId = getGroupIdForPath(normalizedCurrent);

  // Expanded groups state. Active group is always expanded by default.
  const [expandedGroups, setExpandedGroups] = useState(() => ({
    catalog: true,
    people: true,
    sales: true,
    finance: true,
    ...(activeGroupId ? { [activeGroupId]: true } : {})
  }));

  // Automatically expand group containing active route if route changes
  useEffect(() => {
    if (activeGroupId) {
      setExpandedGroups((prev) => ({
        ...prev,
        [activeGroupId]: true
      }));
    }
  }, [activeGroupId]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

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
            {!isCollapsed ? 'Navigation' : '•••'}
          </div>

          <ul className="sidebar-nav-list">
            {ADMIN_NAV_GROUPS.map((entry) => {
              // 1. Standalone Navigation Item
              if (entry.type === 'standalone') {
                const isActive =
                  entry.path === normalizedCurrent ||
                  (entry.aliasPath && entry.aliasPath === normalizedCurrent);

                return (
                  <li key={entry.id} className="sidebar-nav-item">
                    <a
                      href={entry.path}
                      className={`sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(entry.path);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      title={isCollapsed ? entry.label : undefined}
                    >
                      <span className="nav-icon-wrapper">
                        <AdminIcon name={entry.icon} size={18} />
                      </span>

                      {!isCollapsed && (
                        <span className="nav-item-label">{entry.label}</span>
                      )}

                      {isActive && <span className="active-indicator" aria-hidden="true" />}
                    </a>
                  </li>
                );
              }

              // 2. Expandable Navigation Group
              if (entry.type === 'group') {
                const isExpanded = !!expandedGroups[entry.id];
                const hasActiveChild = entry.items.some(
                  (child) =>
                    child.path === normalizedCurrent ||
                    (child.aliasPath && child.aliasPath === normalizedCurrent)
                );

                return (
                  <li
                    key={entry.id}
                    className={`sidebar-nav-item sidebar-group-item ${
                      hasActiveChild ? 'has-active-child' : ''
                    } ${isExpanded ? 'is-group-open' : 'is-group-closed'}`}
                  >
                    {/* Group Header Button */}
                    <button
                      type="button"
                      className={`sidebar-group-header ${
                        hasActiveChild ? 'is-parent-active' : ''
                      }`}
                      onClick={() => {
                        if (isCollapsed) {
                          // When sidebar is collapsed, navigate to first child route
                          if (entry.items && entry.items.length > 0) {
                            onNavigate(entry.items[0].path);
                            if (onCloseMobile) onCloseMobile();
                          }
                        } else {
                          toggleGroup(entry.id);
                        }
                      }}
                      title={
                        isCollapsed
                          ? `${entry.label}: ${entry.items.map((i) => i.label).join(', ')}`
                          : undefined
                      }
                      aria-expanded={isExpanded}
                      aria-controls={`group-menu-${entry.id}`}
                    >
                      <span className="nav-icon-wrapper">
                        <AdminIcon name={entry.icon} size={18} />
                      </span>

                      {!isCollapsed && (
                        <>
                          <span className="nav-item-label group-title-label">
                            {entry.label}
                          </span>
                          <span
                            className={`sidebar-group-chevron ${
                              isExpanded ? 'is-expanded' : ''
                            }`}
                          >
                            <AdminIcon name="chevronDown" size={14} />
                          </span>
                        </>
                      )}

                      {/* In collapsed mode, show indicator if any child is active */}
                      {isCollapsed && hasActiveChild && (
                        <span className="active-indicator" aria-hidden="true" />
                      )}
                    </button>

                    {/* Expandable Sub-items List (only in expanded sidebar mode) */}
                    {!isCollapsed && isExpanded && (
                      <ul
                        id={`group-menu-${entry.id}`}
                        className="sidebar-child-list"
                        role="group"
                        aria-label={entry.label}
                      >
                        {entry.items.map((child) => {
                          const isChildActive =
                            child.path === normalizedCurrent ||
                            (child.aliasPath && child.aliasPath === normalizedCurrent);

                          return (
                            <li key={child.id} className="sidebar-child-item">
                              <a
                                href={child.path}
                                className={`sidebar-child-link ${
                                  isChildActive ? 'is-active' : ''
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onNavigate(child.path);
                                  if (onCloseMobile) onCloseMobile();
                                }}
                              >
                                <span className="child-icon-wrapper">
                                  <AdminIcon name={child.icon} size={15} />
                                </span>

                                <span className="child-item-label">{child.label}</span>

                                {isChildActive && (
                                  <span
                                    className="active-indicator"
                                    aria-hidden="true"
                                  />
                                )}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return null;
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

