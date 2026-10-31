import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { getRouteByPath } from './adminRoutes';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { EmptyAdminPage } from './pages/EmptyAdminPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { CustomersPage } from './pages/CustomersPage';
import { StaffPage } from './pages/StaffPage';
import { SubscriptionPlansPage } from './pages/SubscriptionPlansPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { DiscountsPage } from './pages/DiscountsPage';
import { TaxesPage } from './pages/TaxesPage';
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
  const isQuotations = activeRoute.id === 'quotations' || currentPath === '/admin/quotations' || currentPath === '/admin/quotation-templates';
  const isSubscriptions = activeRoute.id === 'subscriptions' || currentPath === '/admin/subscriptions';
  const isSubscriptionPlans = activeRoute.id === 'subscription-plans' || currentPath === '/admin/subscription-plans';
  const isCustomers = activeRoute.id === 'customers' || currentPath === '/admin/customers';
  const isStaff = activeRoute.id === 'staff' || currentPath === '/admin/staff';
  const isInvoices = activeRoute.id === 'invoices' || currentPath === '/admin/invoices';
  const isPayments = activeRoute.id === 'payments' || currentPath === '/admin/payments';
  const isDiscounts = activeRoute.id === 'discounts' || currentPath === '/admin/discounts';
  const isTaxes = activeRoute.id === 'taxes' || currentPath === '/admin/taxes';

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
            ) : isCustomers ? (
              <CustomersPage onNavigate={onNavigate} />
            ) : isStaff ? (
              <StaffPage onNavigate={onNavigate} />
            ) : isQuotations ? (
              <QuotationsPage
                onNavigate={onNavigate}
                initialTab={currentPath === '/admin/quotation-templates' ? 'templates' : 'quotations'}
              />
            ) : isSubscriptions ? (
              <SubscriptionsPage onNavigate={onNavigate} />
            ) : isSubscriptionPlans ? (
              <SubscriptionPlansPage onNavigate={onNavigate} />
            ) : isInvoices ? (
              <InvoicesPage />
            ) : isPayments ? (
              <PaymentsPage />
            ) : isDiscounts ? (
              <DiscountsPage />
            ) : isTaxes ? (
              <TaxesPage />
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
