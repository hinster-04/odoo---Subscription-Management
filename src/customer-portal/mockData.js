// Sample demonstration data for Brightloop Customer Portal
// Grounded in PostgreSQL Database Schema (auth & users tables)

export const CURRENT_CUSTOMER = {
  // Aligned with `auth` and `users` tables
  id: 'usr-8924-bf12-9842',
  auth_id: 'ath-4820-c918-1092',
  email: 'priya.sharma@novalabs.in',
  first_name: 'Priya',
  last_name: 'Sharma',
  business_name: 'NovaLabs Technologies Private Limited',
  business_type: 'Software Development & IT Consulting',
  phone: '+91 98765 43210',
  address: 'Suite 402, 4th Floor, Pinnacle Tech Park, Electronic City Phase 1',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  postal_code: '560100',
  role: 'customer',
  is_active: true,
  email_verified: true,
  created_at: '2025-11-15T09:30:00Z',
  updated_at: '2026-10-25T14:20:00Z'
};

export const PRODUCTS_CATALOG = [
  {
    id: 'flow',
    name: 'Brightloop Flow',
    category: 'CUSTOMER MANAGEMENT',
    tag: 'Popular choice',
    title: 'Customer relationship and sales pipeline platform.',
    description: 'Track deals, organize client communications, log interactions, and automate follow-ups in a single intuitive workspace.',
    basePrice: 1299,
    basePeriod: 'month',
    icon: 'flow',
    color: 'blue',
    features: [
      'Customer and contact records with timeline',
      'Sales pipeline visual Kanban boards',
      'Smart follow-up notifications & SLA alerts',
      'Email integration & template synchronization',
      'Basic sales report exports (CSV/PDF)'
    ],
    variants: [
      { id: 'standard', name: 'Brightloop Cloud Native', extraPrice: 0, tag: 'Included' },
      { id: 'odoo-brand', name: 'Odoo Connected Edition (Certified Bridge)', extraPrice: 560, tag: 'Most Popular' },
      { id: 'enterprise-self', name: 'Dedicated On-Premise Gateway', extraPrice: 1200, tag: 'Enterprise' }
    ]
  },
  {
    id: 'books',
    name: 'Brightloop Books',
    category: 'FINANCE & BILLING',
    tag: 'Everyday essential',
    title: 'Automated invoicing, taxes and financial accounting.',
    description: 'Generate GST-compliant invoices, track everyday business expenditure, manage receivables, and generate year-end reports.',
    basePrice: 699,
    basePeriod: 'month',
    icon: 'books',
    color: 'mint',
    features: [
      'GST tax computation and E-way bill generation',
      'Bank reconciliation & UPI instant checkout links',
      'Recurring subscription ledger tracking',
      'Vendor invoice extraction & receipts archive',
      'Profit & Loss quarterly financial statements'
    ],
    variants: [
      { id: 'standard', name: 'Brightloop Standard Ledger', extraPrice: 0, tag: 'Included' },
      { id: 'odoo-brand', name: 'Odoo Accounting Sync Plugin', extraPrice: 560, tag: 'Certified' },
      { id: 'multi-currency', name: 'Multi-Currency Global Edition', extraPrice: 450, tag: 'Global' }
    ]
  },
  {
    id: 'people',
    name: 'Brightloop People',
    category: 'HUMAN RESOURCES',
    tag: 'For growing teams',
    title: 'Employee records, attendance, and HR operations.',
    description: 'Streamline team onboarding, leave approvals, attendance logging, and salary slip generation for growing distributed companies.',
    basePrice: 899,
    basePeriod: 'month',
    icon: 'people',
    color: 'violet',
    features: [
      'Digital employee master profiles & document vault',
      'Leave policy workflows with multi-level approval',
      'Biometric & geo-fenced mobile attendance tracking',
      'Automated payroll slip generation',
      'Statutory compliance calculators (PF, ESI, TDS)'
    ],
    variants: [
      { id: 'standard', name: 'Brightloop Core HR', extraPrice: 0, tag: 'Included' },
      { id: 'odoo-brand', name: 'Odoo HRMS Bi-directional Sync', extraPrice: 560, tag: 'Partner' },
      { id: 'advanced-payroll', name: 'Advanced Tax Deduction Module', extraPrice: 380, tag: 'Add-on' }
    ]
  },
  {
    id: 'core',
    name: 'Brightloop Core',
    category: 'BUSINESS OPERATIONS',
    tag: 'Comprehensive ERP',
    title: 'Unified enterprise resource planning and procurement.',
    description: 'Coordinate vendor purchasing, manufacturing workflows, supply requests, and cross-departmental operations.',
    basePrice: 2499,
    basePeriod: 'month',
    icon: 'core',
    color: 'amber',
    features: [
      'Multi-department requisition and purchase orders',
      'Vendor scoring and payment milestone tracker',
      'Asset depreciation and equipment register',
      'Role-based granular access permission matrices',
      'Audit log and security compliance inspection'
    ],
    variants: [
      { id: 'standard', name: 'Brightloop Enterprise Cloud', extraPrice: 0, tag: 'Included' },
      { id: 'odoo-brand', name: 'Odoo Community / Enterprise Connector', extraPrice: 560, tag: 'Recommended' },
      { id: 'high-availability', name: 'High Availability Multi-Region Replica', extraPrice: 1800, tag: 'Dedicated' }
    ]
  },
  {
    id: 'stock',
    name: 'Brightloop Stock',
    category: 'INVENTORY MANAGEMENT',
    tag: 'Warehouse ready',
    title: 'Real-time warehouse, SKU, and barcode tracking.',
    description: 'Maintain stock accuracy across multiple distribution warehouses, prevent stock-outs, and track batches with barcode scanning.',
    basePrice: 999,
    basePeriod: 'month',
    icon: 'stock',
    color: 'rose',
    features: [
      'Multi-location inventory tracking',
      'Serial number and expiry batch management',
      'Barcode label generation and scanner compatibility',
      'Automated reorder point replenishment alerts',
      'Stock dispatch and gate-pass generation'
    ],
    variants: [
      { id: 'standard', name: 'Brightloop Standard Warehouse', extraPrice: 0, tag: 'Included' },
      { id: 'odoo-brand', name: 'Odoo Barcode & Inventory Bridge', extraPrice: 560, tag: 'Odoo Ready' }
    ]
  },
  {
    id: 'projects',
    name: 'Brightloop Projects',
    category: 'WORK MANAGEMENT',
    tag: 'Collaboration',
    title: 'Collaborative task planning and milestone delivery.',
    description: 'Keep your team coordinated with Gantt roadmaps, time tracking, billable hour calculators, and client approval portals.',
    basePrice: 1499,
    basePeriod: 'month',
    icon: 'projects',
    color: 'cyan',
    features: [
      'Interactive Gantt timeline scheduling',
      'Billable vs non-billable timesheet logging',
      'Client guest review portal',
      'Milestone deliverable sign-offs',
      'Resource utilization workload heatmaps'
    ],
    variants: [
      { id: 'standard', name: 'Brightloop Standard Projects', extraPrice: 0, tag: 'Included' },
      { id: 'odoo-brand', name: 'Odoo Project & Timesheet Link', extraPrice: 560, tag: 'Plugin' }
    ]
  }
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan-daily',
    frequency: 'daily',
    frequencyLabel: 'Daily Pass',
    badge: 'On-Demand',
    price: 99,
    period: '/ day',
    description: 'Short-term burst capacity for seasonal spikes, audits, or rapid prototyping.',
    minQuantity: 1,
    availabilityDates: 'Available year-round (24-hour auto-cycle)',
    features: [
      'No long-term commitment (cancel anytime)',
      'Instant license provisioning in 60 seconds',
      'Full feature access during active cycle',
      'Daily usage report emailed at midnight',
      'Pay-per-day gateway settlement'
    ],
    allowPause: false,
    allowRenew: true,
    allowClose: true
  },
  {
    id: 'plan-weekly',
    frequency: 'weekly',
    frequencyLabel: 'Weekly Sprint',
    badge: 'Flexible',
    price: 499,
    period: '/ week',
    description: 'Ideal for short client projects, contractor teams, or temporary review periods.',
    minQuantity: 2,
    availabilityDates: 'Available year-round (7-day recurring cycle)',
    features: [
      'Minimum 2 seats per activation',
      'Priority live chat support',
      'Weekly automated backup snapshot',
      'Rollover unused storage quotas',
      '7-day license renewal grace period'
    ],
    allowPause: true,
    allowRenew: true,
    allowClose: true
  },
  {
    id: 'plan-monthly',
    frequency: 'monthly',
    frequencyLabel: 'Monthly Growth',
    badge: 'Most Popular',
    popular: true,
    price: 1299,
    period: '/ month',
    description: 'Our most popular plan for businesses that require dependable ongoing operations.',
    minQuantity: 1,
    availabilityDates: 'Available year-round (30-day recurring cycle)',
    features: [
      'Unlimited customer and contact records',
      'Standard business hours email & phone support (9 AM - 6 PM)',
      'Automated daily encrypted offsite backups',
      'Full API webhook access and Zapier connector',
      'Single sign-on (SSO) and 2FA security enforcement'
    ],
    allowPause: true,
    allowRenew: true,
    allowClose: true
  },
  {
    id: 'plan-yearly',
    frequency: 'yearly',
    frequencyLabel: 'Annual Enterprise',
    badge: 'Save 20%',
    price: 12470,
    period: '/ year',
    billedInfo: 'Billed annually (~₹1,039/mo, save ₹3,118)',
    description: 'Long-term predictable stability with substantial price savings and dedicated VIP support.',
    minQuantity: 5,
    availabilityDates: 'Available year-round (365-day annual term)',
    features: [
      'Everything in Monthly Growth plan',
      'Dedicated Customer Success Account Manager',
      '99.9% uptime Service Level Agreement (SLA)',
      'Custom onboarding and staff training session',
      'Complimentary quarterly data health checkup'
    ],
    allowPause: false, // Annual plans cannot be paused per policy
    allowRenew: true,
    allowClose: false  // Annual contracts cannot be closed mid-term without representative
  }
];

export const MY_SUBSCRIPTIONS = [
  {
    id: 'SUB-2026-001',
    product: 'Brightloop Flow',
    category: 'CUSTOMER MANAGEMENT',
    icon: 'flow',
    color: 'blue',
    plan: 'Monthly Growth',
    frequency: 'monthly',
    quantity: 5,
    unitPrice: 1299,
    baseTotal: 6495,
    currency: '₹',
    startDate: '15 Jan 2026',
    expiryDate: '15 Nov 2026',
    nextBillingDate: '15 Nov 2026',
    status: 'Active',
    planPermissions: {
      allowPause: true,
      allowRenew: true,
      allowClose: true
    },
    addOns: [
      { id: 'addon-flow-1', name: 'WhatsApp Business API Gateway', price: 450, period: '/ month', active: true, description: 'Direct customer message sending from leads' },
      { id: 'addon-flow-2', name: 'AI Sales Email Drafter', price: 350, period: '/ month', active: true, description: 'AI-assisted reply recommendations' },
      { id: 'addon-flow-3', name: 'Custom Domain White-labeling', price: 750, period: '/ month', active: false, description: 'Host portal on your own domain (crm.novalabs.in)' }
    ]
  },
  {
    id: 'SUB-2026-002',
    product: 'Brightloop Books',
    category: 'FINANCE & BILLING',
    icon: 'books',
    color: 'mint',
    plan: 'Annual Enterprise',
    frequency: 'yearly',
    quantity: 3,
    unitPrice: 12470,
    baseTotal: 37410,
    currency: '₹',
    startDate: '01 Apr 2026',
    expiryDate: '31 Mar 2027',
    nextBillingDate: '31 Mar 2027',
    status: 'Active',
    planPermissions: {
      allowPause: false, // Yearly policy
      allowRenew: true,
      allowClose: false
    },
    addOns: [
      { id: 'addon-books-1', name: 'Direct Bank Feeds (HDFC & ICICI)', price: 300, period: '/ month', active: true, description: 'Real-time statement synchronization' },
      { id: 'addon-books-2', name: 'Multi-Branch Tax Consolidation', price: 600, period: '/ month', active: false, description: 'Aggregated GST filings across GSTINs' }
    ]
  },
  {
    id: 'SUB-2026-003',
    product: 'Brightloop People',
    category: 'HUMAN RESOURCES',
    icon: 'people',
    color: 'violet',
    plan: 'Weekly Sprint',
    frequency: 'weekly',
    quantity: 2,
    unitPrice: 499,
    baseTotal: 998,
    currency: '₹',
    startDate: '10 Oct 2026',
    expiryDate: '17 Oct 2026',
    nextBillingDate: '17 Oct 2026',
    status: 'Overdue',
    planPermissions: {
      allowPause: true,
      allowRenew: true,
      allowClose: true
    },
    addOns: [
      { id: 'addon-people-1', name: 'Mobile Geo-Attendance Tracking', price: 200, period: '/ week', active: true, description: 'GPS verified check-in for field consultants' }
    ]
  },
  {
    id: 'SUB-2025-084',
    product: 'Brightloop Stock',
    category: 'INVENTORY MANAGEMENT',
    icon: 'stock',
    color: 'rose',
    plan: 'Monthly Growth',
    frequency: 'monthly',
    quantity: 1,
    unitPrice: 999,
    baseTotal: 999,
    currency: '₹',
    startDate: '01 Aug 2025',
    expiryDate: '31 Dec 2025',
    nextBillingDate: '—',
    status: 'Closed',
    planPermissions: {
      allowPause: false,
      allowRenew: true,
      allowClose: false
    },
    addOns: []
  }
];

export const MY_QUOTATIONS = [
  {
    id: 'QUO-2026-104',
    productName: 'Brightloop Core (ERP) Enterprise Suite',
    description: '10 User Seats, Odoo Connector Bridge, Dedicated Migration Support & SLA',
    quantity: 10,
    unitPrice: 2499,
    subtotal: 24990,
    taxRate: '18% GST',
    taxes: 4498.20,
    totalAmount: 29488.20,
    currency: '₹',
    validityDate: '15 Nov 2026',
    createdDate: '26 Oct 2026',
    status: 'Confirmed',
    notes: 'Price lock valid for 20 calendar days. Includes 12-hour data migration assistance.'
  },
  {
    id: 'QUO-2026-102',
    productName: 'Brightloop Projects Pro Upgrade',
    description: '5 Project Manager Seats with Interactive Gantt Timelines & Client Reviewer Links',
    quantity: 5,
    unitPrice: 1499,
    subtotal: 7495,
    taxRate: '18% GST',
    taxes: 1349.10,
    totalAmount: 8844.10,
    currency: '₹',
    validityDate: '08 Nov 2026',
    createdDate: '20 Oct 2026',
    status: 'Draft',
    notes: 'Awaiting manager sign-off. Special discount coupon available.'
  },
  {
    id: 'QUO-2026-098',
    productName: 'Custom Storage Capacity Extension (2TB)',
    description: 'High-speed encrypted document archival capacity boost',
    quantity: 2,
    unitPrice: 1800,
    subtotal: 3600,
    taxRate: '18% GST',
    taxes: 648.00,
    totalAmount: 4248.00,
    currency: '₹',
    validityDate: '10 Oct 2026',
    createdDate: '25 Sep 2026',
    status: 'Expired',
    notes: 'Validity period has ended. Request an updated quotation from the products page.'
  }
];

export const MY_INVOICES = [
  {
    id: 'INV-2026-089',
    invoiceDate: '28 Oct 2026',
    dueDate: '07 Nov 2026',
    productDetails: 'Brightloop Flow (CRM) — Monthly Subscription (5 Seats) + 2 Add-ons',
    subtotal: 7295.00,
    taxRate: '18% GST',
    taxes: 1313.10,
    totalAmount: 8608.10,
    status: 'Draft',
    paymentMethod: 'Pending Selection',
    receiptNumber: 'REC-PENDING'
  },
  {
    id: 'INV-2026-088',
    invoiceDate: '15 Oct 2026',
    dueDate: '25 Oct 2026',
    productDetails: 'Brightloop People — Weekly Sprint (2 Seats) + Geo-Attendance Add-on',
    subtotal: 1198.00,
    taxRate: '18% GST',
    taxes: 215.64,
    totalAmount: 1413.64,
    status: 'Overdue',
    paymentMethod: 'Unpaid',
    receiptNumber: '—'
  },
  {
    id: 'INV-2026-084',
    invoiceDate: '01 Oct 2026',
    dueDate: '10 Oct 2026',
    productDetails: 'Brightloop Flow (CRM) — Monthly Subscription (5 Seats)',
    subtotal: 6495.00,
    taxRate: '18% GST',
    taxes: 1169.10,
    totalAmount: 7664.10,
    status: 'Paid',
    paidDate: '03 Oct 2026',
    paymentMethod: 'HDFC NetBanking',
    receiptNumber: 'REC-2026-4401'
  },
  {
    id: 'INV-2026-076',
    invoiceDate: '15 Sep 2026',
    dueDate: '25 Sep 2026',
    productDetails: 'Brightloop Quotation #QUO-2026-088 Confirmed Activation',
    subtotal: 18500.00,
    taxRate: '18% GST',
    taxes: 3330.00,
    totalAmount: 21830.00,
    status: 'Confirmed',
    paymentMethod: 'Awaiting Bank Settlement',
    receiptNumber: 'REC-CONFIRMED'
  },
  {
    id: 'INV-2026-061',
    invoiceDate: '01 Apr 2026',
    dueDate: '10 Apr 2026',
    productDetails: 'Brightloop Books — Annual Enterprise License (3 Seats)',
    subtotal: 37410.00,
    taxRate: '18% GST',
    taxes: 6733.80,
    totalAmount: 44143.80,
    status: 'Paid',
    paidDate: '02 Apr 2026',
    paymentMethod: 'Corporate Credit Card (Mastercard •••• 9812)',
    receiptNumber: 'REC-2026-1092'
  }
];

export const MY_PAYMENTS = [
  {
    id: 'PAY-2026-902',
    amount: '₹7,664.10',
    date: '03 Oct 2026, 11:24 IST',
    method: 'HDFC Corporate NetBanking',
    relatedInvoice: 'INV-2026-084',
    gatewayRef: 'HDFC_NB_9812034821',
    status: 'Paid'
  },
  {
    id: 'PAY-2026-871',
    amount: '₹7,664.10',
    date: '03 Sep 2026, 14:15 IST',
    method: 'Razorpay UPI (novalabs@okhdfcbank)',
    relatedInvoice: 'INV-2026-068',
    gatewayRef: 'UPI_RZP_78210398',
    status: 'Paid'
  },
  {
    id: 'PAY-2026-810',
    amount: '₹7,664.10',
    date: '02 Aug 2026, 16:40 IST',
    method: 'Razorpay UPI (novalabs@okhdfcbank)',
    relatedInvoice: 'INV-2026-054',
    gatewayRef: 'UPI_RZP_65192837',
    status: 'Paid'
  },
  {
    id: 'PAY-2026-742',
    amount: '₹44,143.80',
    date: '02 Apr 2026, 10:12 IST',
    method: 'Corporate Credit Card (Mastercard •••• 9812)',
    relatedInvoice: 'INV-2026-061',
    gatewayRef: 'PG_CC_88291039',
    status: 'Paid'
  }
];

export const OUTSTANDING_PAYMENTS = [
  {
    invoiceId: 'INV-2026-088',
    product: 'Brightloop People — Weekly Sprint',
    amount: '₹1,413.64',
    dueDate: '25 Oct 2026',
    overdueDays: 6,
    status: 'Overdue',
    severity: 'critical'
  },
  {
    invoiceId: 'INV-2026-089',
    product: 'Brightloop Flow (CRM) — Monthly Subscription',
    amount: '₹8,608.10',
    dueDate: '07 Nov 2026',
    daysRemaining: 7,
    status: 'Draft',
    severity: 'upcoming'
  }
];

export const MY_DISCOUNTS = [
  {
    id: 'DISC-01',
    code: 'BRIGHTSTART20',
    title: 'First-Year Early Adopter Perk',
    discount: '20% OFF',
    type: 'percentage',
    appliedTo: 'Brightloop Books (Annual Enterprise)',
    validUntil: '31 Mar 2027',
    status: 'Active',
    savingsAmount: '₹9,352.00',
    description: 'Applied automatically to annual recurring billing cycles.'
  },
  {
    id: 'DISC-02',
    code: 'ODOOPARTNER10',
    title: 'Certified Odoo Community Bridge Rebate',
    discount: '₹560 Flat Credit',
    type: 'fixed',
    appliedTo: 'Monthly Flow Subscription (Odoo Edition)',
    validUntil: '15 Dec 2026',
    status: 'Active',
    savingsAmount: '₹560.00 / month',
    description: 'Rebated directly against certified Odoo connector variant usage.'
  },
  {
    id: 'DISC-03',
    code: 'STARTUPINDIA',
    title: 'DPIIT Registered Startup Grant',
    discount: '15% OFF',
    type: 'percentage',
    appliedTo: 'Brightloop Core Quotation #QUO-2026-104',
    validUntil: '30 Nov 2026',
    status: 'Confirmed',
    savingsAmount: '₹4,423.20',
    description: 'Special promotion code validated with DPIIT certificate.'
  },
  {
    id: 'DISC-04',
    code: 'WELCOME_BONUS',
    title: 'Account Onboarding Trial Voucher',
    discount: '₹1,000 Flat Credit',
    type: 'fixed',
    appliedTo: 'Invoice #INV-2025-084',
    validUntil: '31 Dec 2025',
    status: 'Used',
    savingsAmount: '₹1,000.00',
    description: 'Redeemed during initial system onboarding.'
  }
];

export const ANALYTICS_DATA = {
  activeSubscriptionsCount: 3,
  upcomingBillingDate: '07 Nov 2026',
  totalPaidAmount: '₹67,136.10',
  outstandingAmount: '₹10,021.74',
  monthlySpending: [
    { month: 'May', amount: 7664, label: '₹7.6K', height: 45 },
    { month: 'Jun', amount: 7664, label: '₹7.6K', height: 45 },
    { month: 'Jul', amount: 8450, label: '₹8.4K', height: 52 },
    { month: 'Aug', amount: 7664, label: '₹7.6K', height: 45 },
    { month: 'Sep', amount: 8860, label: '₹8.8K', height: 58 },
    { month: 'Oct', amount: 14958, label: '₹15.0K', height: 95 }
  ],
  paidVsOutstanding: {
    paid: 67136.10,
    paidFormatted: '₹67,136.10',
    paidPercent: 87,
    outstanding: 10021.74,
    outstandingFormatted: '₹10,021.74',
    outstandingPercent: 13
  },
  upcomingBillingList: [
    {
      id: 'BILL-01',
      date: '07 Nov 2026',
      product: 'Brightloop Flow (CRM)',
      cycle: 'Monthly Renewal',
      amount: '₹8,608.10',
      status: 'Draft'
    },
    {
      id: 'BILL-02',
      date: '17 Nov 2026',
      product: 'Brightloop People',
      cycle: 'Weekly Cycle',
      amount: '₹1,413.64',
      status: 'Overdue'
    },
    {
      id: 'BILL-03',
      date: '31 Mar 2027',
      product: 'Brightloop Books',
      cycle: 'Annual Enterprise',
      amount: '₹44,143.80',
      status: 'Active'
    }
  ]
};
