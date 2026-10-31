// Definition of all 9 Customer Portal routes and navigation items
export const CUSTOMER_ROUTES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/portal/dashboard',
    aliasPath: '/portal',
    icon: 'dashboard',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'Dashboard' }],
    description: 'Overview of your active subscriptions, upcoming billings, and spending analytics'
  },
  {
    id: 'products',
    label: 'Products',
    path: '/portal/products',
    icon: 'products',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'Products' }],
    description: 'Explore available software products, configure variants, and view live pricing'
  },
  {
    id: 'subscription-plans',
    label: 'Subscription plans',
    path: '/portal/subscription-plans',
    icon: 'plans',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'Subscription Plans' }],
    description: 'View pricing tiers, billing cycles (daily, weekly, monthly, yearly), and minimums'
  },
  {
    id: 'my-subscriptions',
    label: 'My subscriptions',
    path: '/portal/my-subscriptions',
    icon: 'subscriptions',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'My Subscriptions' }],
    description: 'Manage active and past subscriptions, configure add-ons, and perform plan actions'
  },
  {
    id: 'my-quotations',
    label: 'My quotations',
    path: '/portal/my-quotations',
    icon: 'quotations',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'My Quotations' }],
    description: 'Review formal price quotations, tax breakdowns, validity periods, and acceptance'
  },
  {
    id: 'my-invoices',
    label: 'My invoices',
    path: '/portal/my-invoices',
    icon: 'invoices',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'My Invoices' }],
    description: 'Track invoices, payment statuses, GST breakdowns, and download receipts'
  },
  {
    id: 'my-payments',
    label: 'My payments',
    path: '/portal/my-payments',
    icon: 'payments',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'My Payments' }],
    description: 'Review transaction history, payment gateways, and outstanding balances'
  },
  {
    id: 'my-discounts',
    label: 'My discounts',
    path: '/portal/my-discounts',
    icon: 'discounts',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'My Discounts' }],
    description: 'Active promo codes, enterprise vouchers, and volume rebates applied'
  },
  {
    id: 'my-account',
    label: 'My account',
    path: '/portal/my-account',
    icon: 'settings',
    breadcrumbs: [{ label: 'Portal', path: '/portal/dashboard' }, { label: 'My Account' }],
    description: 'Manage business profile, contact information, and security credentials'
  }
];

export function getCustomerRouteByPath(currentPath) {
  const normalized = (currentPath || '').replace(/\/+$/, '') || '/portal/dashboard';
  return (
    CUSTOMER_ROUTES.find((r) => r.path === normalized || r.aliasPath === normalized) ||
    CUSTOMER_ROUTES[0]
  );
}
