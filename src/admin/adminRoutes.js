// Definition of all 16 Admin Panel routes and navigation items
export const ADMIN_ROUTES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin/dashboard',
    aliasPath: '/admin',
    icon: 'dashboard',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Dashboard' }],
    description: 'Overview of business performance and key subscription metrics'
  },
  {
    id: 'products',
    label: 'Products',
    path: '/admin/products',
    icon: 'products',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Products' }],
    description: 'Manage software products catalog and modules'
  },
  {
    id: 'subscription-plans',
    label: 'Subscription Plans',
    path: '/admin/subscription-plans',
    icon: 'plans',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Subscription Plans' }],
    description: 'Configure pricing tiers, billing cycles, and plan features'
  },
  {
    id: 'product-variants',
    label: 'Product Variants',
    path: '/admin/product-variants',
    icon: 'variants',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Product Variants' }],
    description: 'Manage software editions, deployment variants, and regional packages'
  },
  {
    id: 'add-ons',
    label: 'Add-ons',
    path: '/admin/add-ons',
    icon: 'addons',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Add-ons' }],
    description: 'Manage optional add-on licenses, capacity boosts, and integrations'
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/admin/customers',
    icon: 'customers',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Customers' }],
    description: 'Customer profiles, business accounts, and primary contacts'
  },
  {
    id: 'staff',
    label: 'Staff Management',
    path: '/admin/staff',
    icon: 'staff',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Staff Management' }],
    description: 'Internal team access, roles, and administrative permissions'
  },
  {
    id: 'quotation-templates',
    label: 'Quotation Templates',
    path: '/admin/quotation-templates',
    icon: 'quotationTemplates',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Quotation Templates' }],
    description: 'Reusable quotation boilerplates and terms presets'
  },
  {
    id: 'quotations',
    label: 'Quotations',
    path: '/admin/quotations',
    icon: 'quotations',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Quotations' }],
    description: 'Sales quotes, enterprise proposals, and pricing approvals'
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    path: '/admin/subscriptions',
    icon: 'subscriptions',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Subscriptions' }],
    description: 'Active client subscriptions, renewals, upgrades, and cancellations'
  },
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/admin/invoices',
    icon: 'invoices',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Invoices' }],
    description: 'Subscription billing invoices, credit notes, and tax breakdowns'
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/admin/payments',
    icon: 'payments',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Payments' }],
    description: 'Payment transactions, gateway settlements, and refunds'
  },
  {
    id: 'discounts',
    label: 'Discounts',
    path: '/admin/discounts',
    icon: 'discounts',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Discounts' }],
    description: 'Promotional coupon codes, enterprise discounts, and campaign rules'
  },
  {
    id: 'taxes',
    label: 'Taxes',
    path: '/admin/taxes',
    icon: 'taxes',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Taxes' }],
    description: 'GST, VAT, and jurisdictional sales tax rate rules'
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/admin/reports',
    icon: 'reports',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Reports' }],
    description: 'Financial ledgers, churn analytics, and ARR growth statements'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/admin/settings',
    icon: 'settings',
    breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Settings' }],
    description: 'Organization profile, currency formats, and system preferences'
  }
];

export function getRouteByPath(currentPath) {
  const normalized = (currentPath || '').replace(/\/+$/, '') || '/admin';
  return (
    ADMIN_ROUTES.find((r) => r.path === normalized || r.aliasPath === normalized) ||
    ADMIN_ROUTES[0]
  );
}
