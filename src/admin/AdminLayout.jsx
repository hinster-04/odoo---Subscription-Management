import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { getRouteByPath } from './adminRoutes';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { EmptyAdminPage } from './pages/EmptyAdminPage';
import './admin.css';

export function AdminLayout({ currentPath, onNavigate }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  // Retrieve route definition for current path
  const activeRoute = getRouteByPath(currentPath);

  // Update browser document title
  useEffect(() => {
    document.title = `${activeRoute.label} | Brightloop Software Admin`;
  }, [activeRoute]);

  const isDashboard =
    activeRoute.id === 'dashboard' ||
    currentPath === '/admin' ||
    currentPath === '/admin/dashboard';

  const isProductsModule =
    activeRoute.id === 'products' ||
    activeRoute.id === 'product-variants' ||
    activeRoute.id === 'add-ons';

  return (
    <div className={`admin-app-root ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Reusable Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Admin Area */}
      <div className="admin-main-wrapper">
        {/* Top Navigation */}
        <TopNav
          pageTitle={activeRoute.label}
          breadcrumbs={activeRoute.breadcrumbs}
          onNavigate={onNavigate}
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
          isSidebarCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Page Content Viewport */}
        <main className="admin-content-area" id="admin-main-content">
          <div className="admin-content-container">
            {isDashboard ? (
              <DashboardPage onNavigate={onNavigate} />
            ) : isProductsModule ? (
              <ProductsPage
                onNavigate={onNavigate}
                initialTab={
                  activeRoute.id === 'product-variants'
                    ? 'variants'
                    : activeRoute.id === 'add-ons'
                    ? 'addons'
                    : 'general'
                }
              />
            ) : (
              <EmptyAdminPage route={activeRoute} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
