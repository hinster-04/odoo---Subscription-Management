import React, { useState, useRef, useEffect } from 'react';
import { AdminIcon } from '../AdminIcons';

// ─── Local icon helpers ────────────────────────────────────────────────────────
function SIcon({ name, size = 16 }) {
    const p = {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8,
        strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true
    };
    const icons = {
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
        eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
        edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
        trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
        pause: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
        play: <><polygon points="5 3 19 12 5 21 5 3" /></>,
        refresh: <><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9A9 9 0 0 1 20.49 15" /><path d="M20.49 15A9 9 0 0 1 3.51 9" /></>,
        close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
        chevLeft: <><polyline points="15 18 9 12 15 6" /></>,
        chevRight: <><polyline points="9 18 15 12 9 6" /></>,
        chevDown: <><polyline points="6 9 12 15 18 9" /></>,
        x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
        arrowLeft: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
        invoice: <><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" /></>,
        payment: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><circle cx="7" cy="15" r="1.5" /></>,
        activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>,
        info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    };
    return <svg {...p}>{icons[name] ?? null}</svg>;
}

// ─── Status map ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
    Active: 'status-success',
    Paused: 'status-warning',
    Expired: 'status-neutral',
    Cancelled: 'status-danger',
    Pending: 'status-info',
};
function StatusPill({ status }) {
    return <span className={`qp-status-pill ${STATUS_MAP[status] || 'status-neutral'}`}>{status}</span>;
}

// ─── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_SUBSCRIPTIONS = [
    {
        id: 'SUB-2026-001', customer: 'Acme Corp', startDate: '2026-01-01', expiryDate: '2026-12-31',
        billing: 'Monthly', items: 3, total: '₹13,500', nextBilling: '2026-11-01', status: 'Active',
        paymentTerms: 'Net 30', quotation: 'Q-2026-003',
        subscriptionItems: [
            { product: 'Brightloop Flow', plan: 'Professional', variant: 'Cloud', addons: 'API Access', qty: 1, unitPrice: '₹1,299', tax: '18%', discount: '₹0', amount: '₹1,299' },
            { product: 'Brightloop Books', plan: 'Standard', variant: 'Cloud', addons: '—', qty: 1, unitPrice: '₹699', tax: '18%', discount: '₹0', amount: '₹699' },
            { product: 'Brightloop People', plan: 'Starter', variant: 'Cloud', addons: '—', qty: 5, unitPrice: '₹899', tax: '18%', discount: '₹200', amount: '₹4,295' },
        ],
        invoices: [
            { no: 'INV-001', date: '2026-01-01', amount: '₹13,500', status: 'Paid' },
            { no: 'INV-002', date: '2026-02-01', amount: '₹13,500', status: 'Paid' },
            { no: 'INV-003', date: '2026-10-01', amount: '₹13,500', status: 'Due' },
        ],
        payments: [
            { ref: 'PAY-2026-001', date: '2026-01-03', amount: '₹13,500', method: 'Bank Transfer', status: 'Settled' },
            { ref: 'PAY-2026-002', date: '2026-02-04', amount: '₹13,500', method: 'Bank Transfer', status: 'Settled' },
        ],
        activity: [
            { date: '2026-01-01', event: 'Subscription created from Quotation Q-2026-003' },
            { date: '2026-01-01', event: 'First invoice INV-001 generated' },
            { date: '2026-10-01', event: 'Invoice INV-003 due' },
        ],
    },
    {
        id: 'SUB-2026-002', customer: 'BlueStar Ltd', startDate: '2026-02-15', expiryDate: '2027-02-14',
        billing: 'Quarterly', items: 5, total: '₹45,430', nextBilling: '2026-11-15', status: 'Active',
        paymentTerms: 'Advance', quotation: 'Q-2026-002',
        subscriptionItems: [], invoices: [], payments: [], activity: [],
    },
    {
        id: 'SUB-2026-003', customer: 'Horizon Media', startDate: '2026-03-01', expiryDate: '2026-08-31',
        billing: 'Monthly', items: 2, total: '₹9,476', nextBilling: '—', status: 'Expired',
        paymentTerms: 'Net 15', quotation: '—',
        subscriptionItems: [], invoices: [], payments: [], activity: [],
    },
    {
        id: 'SUB-2026-004', customer: 'Nexora Systems', startDate: '2026-05-01', expiryDate: '2027-04-30',
        billing: 'Annual', items: 7, total: '₹72,520', nextBilling: '2027-05-01', status: 'Active',
        paymentTerms: 'Net 30', quotation: 'Q-2026-004',
        subscriptionItems: [], invoices: [], payments: [], activity: [],
    },
    {
        id: 'SUB-2026-005', customer: 'Velocity IO', startDate: '2026-06-01', expiryDate: '2026-11-30',
        billing: 'Monthly', items: 4, total: '₹24,960', nextBilling: '2026-11-01', status: 'Paused',
        paymentTerms: 'Net 30', quotation: '—',
        subscriptionItems: [], invoices: [], payments: [], activity: [],
    },
    {
        id: 'SUB-2026-006', customer: 'GreenLeaf FMCG', startDate: '2026-07-01', expiryDate: '2026-12-31',
        billing: 'Monthly', items: 6, total: '₹57,916', nextBilling: '2026-11-01', status: 'Active',
        paymentTerms: 'Net 30', quotation: 'Q-2026-007',
        subscriptionItems: [], invoices: [], payments: [], activity: [],
    },
    {
        id: 'SUB-2026-007', customer: 'Starfield Tech', startDate: '2026-08-01', expiryDate: '2027-07-31',
        billing: 'Quarterly', items: 3, total: '₹17,200', nextBilling: '2027-02-01', status: 'Active',
        paymentTerms: 'Advance', quotation: 'Q-2026-008',
        subscriptionItems: [], invoices: [], payments: [], activity: [],
    },
    {
        id: 'SUB-2026-008', customer: 'Orbit Finance', startDate: '2026-09-01', expiryDate: '2027-08-31',
        billing: 'Monthly', items: 1, total: '₹5,310', nextBilling: '2026-11-01', status: 'Cancelled',
        paymentTerms: 'Net 15', quotation: '—',
        subscriptionItems: [], invoices: [], payments: [], activity: [],
    },
];

// ─── Action menu ───────────────────────────────────────────────────────────────
function ActionMenu({ items }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    return (
        <div className="qp-action-root" ref={ref}>
            <button className="qp-action-btn" onClick={() => setOpen(o => !o)} aria-label="Actions" type="button">···</button>
            {open && (
                <ul className="qp-action-menu" role="menu">
                    {items.map(item => (
                        <li key={item.label} role="menuitem">
                            <button
                                className={`qp-action-item${item.danger ? ' danger' : ''}`}
                                onClick={() => { item.onClick?.(); setOpen(false); }}
                                type="button"
                            >
                                <SIcon name={item.icon} size={14} />
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Backend notice ────────────────────────────────────────────────────────────
function BackendNotice({ message }) {
    return (
        <div className="qp-backend-notice" role="status">
            <SIcon name="info" size={15} />
            <span>{message}</span>
        </div>
    );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, wide = false, children }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);
    return (
        <div className="qp-modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div className={`qp-modal${wide ? ' qp-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sp-modal-title">
                <div className="qp-modal-header">
                    <h3 id="sp-modal-title" className="qp-modal-title">{title}</h3>
                    <button className="qp-modal-close" onClick={onClose} aria-label="Close" type="button">
                        <SIcon name="x" size={18} />
                    </button>
                </div>
                <div className="qp-modal-body">{children}</div>
            </div>
        </div>
    );
}

// ─── Subscription form modal ───────────────────────────────────────────────────
function SubscriptionFormModal({ subscription, onClose }) {
    return (
        <Modal title={subscription ? `Edit Subscription ${subscription.id}` : 'Create Subscription'} onClose={onClose}>
            <BackendNotice message={subscription
                ? 'Connect PUT /api/subscriptions/:id to save changes.'
                : 'Connect POST /api/subscriptions to create a new subscription.'} />
            <form className="qp-form" onSubmit={e => e.preventDefault()}>
                <div className="qp-form-row">
                    <div className="qp-field">
                        <label htmlFor="sf-customer">Customer</label>
                        <input id="sf-customer" type="text" placeholder="Search or select customer…" defaultValue={subscription?.customer || ''} />
                    </div>
                    <div className="qp-field">
                        <label htmlFor="sf-billing">Billing Frequency</label>
                        <select id="sf-billing" defaultValue={subscription?.billing || 'Monthly'}>
                            <option>Monthly</option>
                            <option>Quarterly</option>
                            <option>Semi-annual</option>
                            <option>Annual</option>
                        </select>
                    </div>
                </div>
                <div className="qp-form-row">
                    <div className="qp-field">
                        <label htmlFor="sf-start">Start Date</label>
                        <input id="sf-start" type="date" defaultValue={subscription?.startDate || ''} />
                    </div>
                    <div className="qp-field">
                        <label htmlFor="sf-expiry">Expiry Date</label>
                        <input id="sf-expiry" type="date" defaultValue={subscription?.expiryDate || ''} />
                    </div>
                </div>
                <div className="qp-field">
                    <label htmlFor="sf-payment">Payment Terms</label>
                    <select id="sf-payment" defaultValue={subscription?.paymentTerms || 'Net 30'}>
                        <option>Net 15</option>
                        <option>Net 30</option>
                        <option>Advance</option>
                    </select>
                </div>
                <div className="qp-field">
                    <label>Subscription Items</label>
                    <BackendNotice message="Connect GET /api/products and GET /api/subscription-plans to load options." />
                    <div className="qp-placeholder-block">Item rows (product, plan, variant, add-ons, qty, price, tax, discount) will be editable once APIs are connected.</div>
                </div>
                <div className="qp-modal-footer">
                    <button className="qp-btn qp-btn-ghost" onClick={onClose} type="button">Cancel</button>
                    <button className="qp-btn qp-btn-primary" type="submit">
                        {subscription ? 'Save Changes' : 'Create Subscription'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Confirm action modal ─────────────────────────────────────────────────────
function ConfirmModal({ title, message, endpoint, onClose, danger = false }) {
    return (
        <Modal title={title} onClose={onClose}>
            <BackendNotice message={`Connect ${endpoint} to execute this operation.`} />
            <p className="qp-delete-text">{message}</p>
            <div className="qp-modal-footer">
                <button className="qp-btn qp-btn-ghost" onClick={onClose} type="button">Cancel</button>
                <button className={`qp-btn ${danger ? 'qp-btn-danger' : 'qp-btn-primary'}`} type="button" onClick={onClose}>Confirm</button>
            </div>
        </Modal>
    );
}

// ─── Subscription detail view ─────────────────────────────────────────────────
function SubscriptionDetailView({ subscription, onBack, onEdit }) {
    const [section, setSection] = useState('items');
    const sections = [
        { id: 'items', label: 'Subscription Items', icon: 'invoice' },
        { id: 'invoices', label: 'Invoice History', icon: 'invoice' },
        { id: 'payments', label: 'Payment History', icon: 'payment' },
        { id: 'activity', label: 'Activity History', icon: 'activity' },
    ];

    return (
        <div className="sp-detail-page" id={`subscription-detail-${subscription.id}`}>
            {/* Back + header */}
            <div className="sp-detail-topbar">
                <button className="qp-btn qp-btn-ghost sp-back-btn" onClick={onBack} type="button">
                    <SIcon name="arrowLeft" size={15} /> Back to Subscriptions
                </button>
                <div className="sp-detail-actions">
                    <button className="qp-btn qp-btn-ghost" type="button" onClick={onEdit}>
                        <SIcon name="edit" size={14} /> Edit
                    </button>
                </div>
            </div>

            {/* Info card */}
            <div className="sp-detail-card">
                <div className="sp-detail-card-top">
                    <div>
                        <p className="sp-detail-id font-mono">{subscription.id}</p>
                        <h2 className="sp-detail-customer">{subscription.customer}</h2>
                    </div>
                    <StatusPill status={subscription.status} />
                </div>
                <div className="sp-info-grid">
                    <div className="sp-info-item"><span className="sp-info-label">Start Date</span><span className="sp-info-value">{subscription.startDate}</span></div>
                    <div className="sp-info-item"><span className="sp-info-label">Expiry Date</span><span className="sp-info-value">{subscription.expiryDate}</span></div>
                    <div className="sp-info-item"><span className="sp-info-label">Billing Frequency</span><span className="sp-info-value">{subscription.billing}</span></div>
                    <div className="sp-info-item"><span className="sp-info-label">Payment Terms</span><span className="sp-info-value">{subscription.paymentTerms}</span></div>
                    <div className="sp-info-item"><span className="sp-info-label">Next Billing Date</span><span className="sp-info-value">{subscription.nextBilling}</span></div>
                    <div className="sp-info-item"><span className="sp-info-label">Total Amount</span><span className="sp-info-value sp-total">{subscription.total}</span></div>
                    {subscription.quotation !== '—' && (
                        <div className="sp-info-item"><span className="sp-info-label">Related Quotation</span><span className="sp-info-value font-mono">{subscription.quotation}</span></div>
                    )}
                </div>
            </div>

            {/* Section tabs */}
            <div className="sp-section-tabs" role="tablist" aria-label="Subscription sections">
                {sections.map(s => (
                    <button
                        key={s.id}
                        role="tab"
                        aria-selected={section === s.id}
                        className={`sp-section-tab${section === s.id ? ' active' : ''}`}
                        onClick={() => setSection(s.id)}
                        type="button"
                    >
                        <SIcon name={s.icon} size={15} />
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Section content */}
            <div className="qp-table-wrap">
                {section === 'items' && (
                    <>
                        <BackendNotice message="Connect GET /api/subscriptions/:id/items to load subscription items." />
                        {subscription.subscriptionItems.length > 0 ? (
                            <table className="qp-table" aria-label="Subscription items">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Plan</th>
                                        <th>Variant</th>
                                        <th>Add-ons</th>
                                        <th style={{ textAlign: 'center' }}>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Tax</th>
                                        <th>Discount</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscription.subscriptionItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.product}</td>
                                            <td>{item.plan}</td>
                                            <td>{item.variant}</td>
                                            <td>{item.addons}</td>
                                            <td style={{ textAlign: 'center' }}>{item.qty}</td>
                                            <td>{item.unitPrice}</td>
                                            <td>{item.tax}</td>
                                            <td>{item.discount}</td>
                                            <td className="qp-total-cell">{item.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="qp-placeholder-block">No items loaded — connect the items API to populate this section.</div>
                        )}
                    </>
                )}

                {section === 'invoices' && (
                    <>
                        <BackendNotice message="Connect GET /api/subscriptions/:id/invoices to load invoice history." />
                        {subscription.invoices.length > 0 ? (
                            <table className="qp-table" aria-label="Invoice history">
                                <thead>
                                    <tr>
                                        <th>Invoice No.</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscription.invoices.map(inv => (
                                        <tr key={inv.no}>
                                            <td className="font-mono">{inv.no}</td>
                                            <td>{inv.date}</td>
                                            <td className="qp-total-cell">{inv.amount}</td>
                                            <td><StatusPill status={inv.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="qp-placeholder-block">No invoice history — connect the invoices API to populate this section.</div>
                        )}
                    </>
                )}

                {section === 'payments' && (
                    <>
                        <BackendNotice message="Connect GET /api/subscriptions/:id/payments to load payment history." />
                        {subscription.payments.length > 0 ? (
                            <table className="qp-table" aria-label="Payment history">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscription.payments.map(pay => (
                                        <tr key={pay.ref}>
                                            <td className="font-mono">{pay.ref}</td>
                                            <td>{pay.date}</td>
                                            <td className="qp-total-cell">{pay.amount}</td>
                                            <td>{pay.method}</td>
                                            <td><StatusPill status={pay.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="qp-placeholder-block">No payment history — connect the payments API to populate this section.</div>
                        )}
                    </>
                )}

                {section === 'activity' && (
                    <>
                        <BackendNotice message="Connect GET /api/subscriptions/:id/activity to load the activity log." />
                        {subscription.activity.length > 0 ? (
                            <ul className="sp-activity-list">
                                {subscription.activity.map((item, idx) => (
                                    <li key={idx} className="sp-activity-item">
                                        <span className="sp-activity-dot" />
                                        <span className="sp-activity-date">{item.date}</span>
                                        <span className="sp-activity-event">{item.event}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="qp-placeholder-block">No activity recorded — connect the activity API to populate this section.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Subscription list view ────────────────────────────────────────────────────
function SubscriptionListView({ onOpenDetail }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);
    const PER_PAGE = 6;

    const statuses = ['All', 'Active', 'Paused', 'Expired', 'Cancelled'];

    const filtered = SAMPLE_SUBSCRIPTIONS.filter(s => {
        const matchSearch = s.id.toLowerCase().includes(search.toLowerCase()) ||
            s.customer.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    function openModal(type, data = null) { setModal({ type, data }); }
    function closeModal() { setModal(null); }

    const stats = {
        active: SAMPLE_SUBSCRIPTIONS.filter(s => s.status === 'Active').length,
        paused: SAMPLE_SUBSCRIPTIONS.filter(s => s.status === 'Paused').length,
        expired: SAMPLE_SUBSCRIPTIONS.filter(s => s.status === 'Expired').length,
        cancelled: SAMPLE_SUBSCRIPTIONS.filter(s => s.status === 'Cancelled').length,
    };

    return (
        <div className="qp-tab-content">
            <BackendNotice message="All subscription data is static for UI demonstration. Connect GET /api/subscriptions to load live records." />

            {/* Quick stats */}
            <div className="sp-quick-stats">
                {[
                    { label: 'Active', count: stats.active, color: 'emerald' },
                    { label: 'Paused', count: stats.paused, color: 'amber' },
                    { label: 'Expired', count: stats.expired, color: 'slate' },
                    { label: 'Cancelled', count: stats.cancelled, color: 'rose' },
                ].map(s => (
                    <button
                        key={s.label}
                        className={`sp-stat-card sp-stat-${s.color}${statusFilter === s.label ? ' sp-stat-active' : ''}`}
                        onClick={() => { setStatusFilter(sf => sf === s.label ? 'All' : s.label); setPage(1); }}
                        type="button"
                        aria-pressed={statusFilter === s.label}
                    >
                        <span className="sp-stat-count">{s.count}</span>
                        <span className="sp-stat-label">{s.label}</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="qp-toolbar">
                <div className="qp-toolbar-left">
                    <div className="qp-search-wrap">
                        <SIcon name="search" size={15} />
                        <input
                            id="subscriptions-search"
                            className="qp-search-input"
                            type="search"
                            placeholder="Search by ID or customer…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            aria-label="Search subscriptions"
                        />
                    </div>
                    <div className="qp-filter-tabs" role="tablist" aria-label="Filter by status">
                        {statuses.map(s => (
                            <button
                                key={s}
                                role="tab"
                                aria-selected={statusFilter === s}
                                className={`qp-filter-tab${statusFilter === s ? ' active' : ''}`}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                type="button"
                            >{s}</button>
                        ))}
                    </div>
                </div>
                <button
                    id="create-subscription-btn"
                    className="qp-btn qp-btn-primary"
                    type="button"
                    onClick={() => openModal('create')}
                >
                    <SIcon name="plus" size={15} /> Create Subscription
                </button>
            </div>

            {/* Table */}
            <div className="qp-table-wrap">
                <table className="qp-table" aria-label="Subscriptions list">
                    <thead>
                        <tr>
                            <th>Subscription No.</th>
                            <th>Customer</th>
                            <th>Start Date</th>
                            <th>Expiry Date</th>
                            <th>Billing</th>
                            <th style={{ textAlign: 'center' }}>Items</th>
                            <th>Total</th>
                            <th>Next Billing</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="qp-empty-row">No subscriptions match your search.</td>
                            </tr>
                        ) : paged.map(s => (
                            <tr key={s.id}>
                                <td>
                                    <span
                                        className="font-mono qp-id-link"
                                        onClick={() => onOpenDetail(s)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => e.key === 'Enter' && onOpenDetail(s)}
                                        aria-label={`View ${s.id}`}
                                    >{s.id}</span>
                                </td>
                                <td className="qp-customer-cell">{s.customer}</td>
                                <td>{s.startDate}</td>
                                <td>{s.expiryDate}</td>
                                <td>{s.billing}</td>
                                <td style={{ textAlign: 'center' }}>{s.items}</td>
                                <td className="qp-total-cell">{s.total}</td>
                                <td>{s.nextBilling}</td>
                                <td><StatusPill status={s.status} /></td>
                                <td style={{ textAlign: 'center' }}>
                                    <ActionMenu items={[
                                        { label: 'View Details', icon: 'eye', onClick: () => onOpenDetail(s) },
                                        { label: 'Edit', icon: 'edit', onClick: () => openModal('edit', s) },
                                        ...(s.status === 'Active' ? [{ label: 'Pause', icon: 'pause', onClick: () => openModal('pause', s) }] : []),
                                        ...(s.status === 'Paused' ? [{ label: 'Resume', icon: 'play', onClick: () => openModal('resume', s) }] : []),
                                        ...(s.status !== 'Cancelled' && s.status !== 'Expired' ? [
                                            { label: 'Renew', icon: 'refresh', onClick: () => openModal('renew', s) },
                                            { label: 'Close', icon: 'close', danger: true, onClick: () => openModal('close', s) },
                                        ] : []),
                                    ]} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="qp-pagination" aria-label="Pagination">
                    <span className="qp-page-info">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                    <div className="qp-page-controls">
                        <button className="qp-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page" type="button">
                            <SIcon name="chevLeft" size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button
                                key={n}
                                className={`qp-page-btn${n === page ? ' active' : ''}`}
                                onClick={() => setPage(n)}
                                aria-current={n === page ? 'page' : undefined}
                                type="button"
                            >{n}</button>
                        ))}
                        <button className="qp-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page" type="button">
                            <SIcon name="chevRight" size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {modal?.type === 'create' && <SubscriptionFormModal subscription={null} onClose={closeModal} />}
            {modal?.type === 'edit' && <SubscriptionFormModal subscription={modal.data} onClose={closeModal} />}
            {modal?.type === 'pause' && (
                <ConfirmModal
                    title="Pause Subscription"
                    message={`Pausing ${modal.data?.id} will halt future billing until the subscription is resumed.`}
                    endpoint={`PATCH /api/subscriptions/${modal.data?.id}/pause`}
                    onClose={closeModal}
                />
            )}
            {modal?.type === 'resume' && (
                <ConfirmModal
                    title="Resume Subscription"
                    message={`Resuming ${modal.data?.id} will restart the billing cycle from the next billing date.`}
                    endpoint={`PATCH /api/subscriptions/${modal.data?.id}/resume`}
                    onClose={closeModal}
                />
            )}
            {modal?.type === 'renew' && (
                <ConfirmModal
                    title="Renew Subscription"
                    message={`Renewing ${modal.data?.id} will extend the subscription period for another billing cycle.`}
                    endpoint={`POST /api/subscriptions/${modal.data?.id}/renew`}
                    onClose={closeModal}
                />
            )}
            {modal?.type === 'close' && (
                <ConfirmModal
                    title="Close Subscription"
                    message={`Closing ${modal.data?.id} will permanently cancel it. This cannot be undone.`}
                    endpoint={`PATCH /api/subscriptions/${modal.data?.id}/close`}
                    onClose={closeModal}
                    danger
                />
            )}
        </div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function SubscriptionsPage() {
    const [detailSub, setDetailSub] = useState(null);
    const [editModal, setEditModal] = useState(false);

    if (detailSub) {
        return (
            <div id="subscriptions-page" className="qp-page">
                <SubscriptionDetailView
                    subscription={detailSub}
                    onBack={() => setDetailSub(null)}
                    onEdit={() => setEditModal(true)}
                />
                {editModal && (
                    <SubscriptionFormModal
                        subscription={detailSub}
                        onClose={() => setEditModal(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div id="subscriptions-page" className="qp-page">
            <SubscriptionListView onOpenDetail={s => setDetailSub(s)} />
        </div>
    );
}
