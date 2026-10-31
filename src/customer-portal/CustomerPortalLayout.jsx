import React, { useState, useEffect } from 'react';
import { CustomerSidebar } from './components/CustomerSidebar';
import { CustomerTopNav } from './components/CustomerTopNav';
import { getCustomerRouteByPath } from './customerRoutes';

// Import all 9 portal pages
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { SubscriptionPlansPage } from './pages/SubscriptionPlansPage';
import { MySubscriptionsPage } from './pages/MySubscriptionsPage';
import { MyQuotationsPage } from './pages/MyQuotationsPage';
import { MyInvoicesPage } from './pages/MyInvoicesPage';
import { MyPaymentsPage } from './pages/MyPaymentsPage';
import { MyDiscountsPage } from './pages/MyDiscountsPage';
import { MyAccountPage } from './pages/MyAccountPage';

import { useAuth } from '../context/AuthContext.jsx';
import './customer-portal.css';

export function CustomerPortalLayout({ currentPath, onNavigate }) {
  const { logout } = useAuth();
  // Left sidebar is always visible with icons; expanded by default on desktop, collapsible
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  // If user entered /portal, seamlessly update browser URL to /portal/dashboard
  useEffect(() => {
    if (currentPath === '/portal') {
      window.history.replaceState({}, '', '/portal/dashboard');
    }
  }, [currentPath]);

  // Retrieve route definition for current path
  const activeRoute = getCustomerRouteByPath(currentPath);

  // Update document title
  useEffect(() => {
    document.title = `${activeRoute.label} | Brightloop Customer Portal`;
  }, [activeRoute]);

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

  // Render the appropriate component for the route
  const renderPageComponent = () => {
    switch (activeRoute.id) {
      case 'dashboard':
        return <DashboardPage onNavigate={onNavigate} />;
      case 'products':
        return <ProductsPage onNavigate={onNavigate} />;
      case 'subscription-plans':
        return <SubscriptionPlansPage onNavigate={onNavigate} />;
      case 'my-subscriptions':
        return <MySubscriptionsPage onNavigate={onNavigate} />;
      case 'my-quotations':
        return <MyQuotationsPage onNavigate={onNavigate} />;
      case 'my-invoices':
        return <MyInvoicesPage onNavigate={onNavigate} />;
      case 'my-payments':
        return <MyPaymentsPage onNavigate={onNavigate} />;
      case 'my-discounts':
        return <MyDiscountsPage onNavigate={onNavigate} />;
      case 'my-account':
        return <MyAccountPage onLogout={handleLogout} />;
      default:
        return <DashboardPage onNavigate={onNavigate} />;
    }
  };

  return (
    <div className={`customer-portal-root ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left Sidebar: always visible with icons, expand button toggles text labels */}
      <CustomerSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="customer-main-wrapper">
        {/* Top Navigation Bar: logo, menu button, notification icon and user avatar */}
        <CustomerTopNav
          pageTitle={activeRoute.label}
          breadcrumbs={activeRoute.breadcrumbs}
          onNavigate={onNavigate}
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
          isSidebarCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Content Viewport */}
        <main className="customer-content-area" id="customer-main-content">
          <div className="customer-content-container">
            {renderPageComponent()}
          </div>
        </main>
      </div>
    </div>
  );
}
