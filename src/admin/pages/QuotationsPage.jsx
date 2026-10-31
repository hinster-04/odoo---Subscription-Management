import React, { useState, useRef, useEffect } from 'react';
import { AdminIcon } from '../AdminIcons';

// ─── Local icon helpers ────────────────────────────────────────────────────────
function QIcon({ name, size = 16 }) {
    const p = {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8,
        strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true
    };
    const icons = {
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
        filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></>,
        download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
        send: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
        convert: <><path d="M21.5 2-5 5h4a8.5 8.5 0 0 1-17 0H1.5" /><path d="M2.5 22 7.5 17h-4a8.5 8.5 0 0 1 17 0h2" /></>,
        eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
        edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
        trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
        copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
        check: <><polyline points="20 6 9 17 4 12" /></>,
        chevDown: <><polyline points="6 9 12 15 18 9" /></>,
        chevLeft: <><polyline points="15 18 9 12 15 6" /></>,
        chevRight: <><polyline points="9 18 15 12 9 6" /></>,
        x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
        toggle: <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="16" cy="12" r="3" /></>,
        toggleOff: <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="8" cy="12" r="3" /></>,
    };
    return <svg {...p}>{icons[name] ?? null}</svg>;
}

// ─── Status pill ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
    Draft: 'status-neutral',
    Sent: 'status-info',
    Accepted: 'status-success',
    Cancelled: 'status-danger',
    Expired: 'status-warning',
    Active: 'status-success',
    Inactive: 'status-neutral',
};
function StatusPill({ status }) {
    return <span className={`qp-status-pill ${STATUS_MAP[status] || 'status-neutral'}`}>{status}</span>;
}

// ─── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_QUOTATIONS = [
    { id: 'Q-2026-001', customer: 'Acme Corp', date: '2026-10-01', validUntil: '2026-10-31', items: 3, subtotal: '₹12,000', tax: '₹2,160', discount: '₹500', total: '₹13,660', status: 'Draft' },
    { id: 'Q-2026-002', customer: 'BlueStar Ltd', date: '2026-10-05', validUntil: '2026-11-04', items: 5, subtotal: '₹38,500', tax: '₹6,930', discount: '₹0', total: '₹45,430', status: 'Sent' },
    { id: 'Q-2026-003', customer: 'Horizon Media', date: '2026-10-08', validUntil: '2026-11-07', items: 2, subtotal: '₹8,200', tax: '₹1,476', discount: '₹200', total: '₹9,476', status: 'Accepted' },
    { id: 'Q-2026-004', customer: 'Nexora Systems', date: '2026-10-10', validUntil: '2026-11-09', items: 7, subtotal: '₹64,000', tax: '₹11,520', discount: '₹3,000', total: '₹72,520', status: 'Sent' },
    { id: 'Q-2026-005', customer: 'Velocity IO', date: '2026-09-20', validUntil: '2026-10-19', items: 4, subtotal: '₹22,000', tax: '₹3,960', discount: '₹1,000', total: '₹24,960', status: 'Expired' },
    { id: 'Q-2026-006', customer: 'Orbit Finance', date: '2026-09-25', validUntil: '2026-10-24', items: 1, subtotal: '₹4,500', tax: '₹810', discount: '₹0', total: '₹5,310', status: 'Cancelled' },
    { id: 'Q-2026-007', customer: 'GreenLeaf FMCG', date: '2026-10-15', validUntil: '2026-11-14', items: 6, subtotal: '₹51,200', tax: '₹9,216', discount: '₹2,500', total: '₹57,916', status: 'Draft' },
    { id: 'Q-2026-008', customer: 'Starfield Tech', date: '2026-10-18', validUntil: '2026-11-17', items: 3, subtotal: '₹15,000', tax: '₹2,700', discount: '₹500', total: '₹17,200', status: 'Accepted' },
];

const SAMPLE_TEMPLATES = [
    { id: 'T-001', name: 'Enterprise SaaS Bundle', description: 'Full suite for enterprise clients', products: 'Flow + Books + Core', qty: 1, price: '₹5,297', tax: '18% GST', validity: 30, status: 'Active' },
    { id: 'T-002', name: 'Starter Pack', description: 'Essential tools for SMBs', products: 'Flow + Books', qty: 1, price: '₹1,998', tax: '18% GST', validity: 15, status: 'Active' },
    { id: 'T-003', name: 'HR & Payroll Bundle', description: 'People module with core HR', products: 'People', qty: 5, price: '₹4,495', tax: '18% GST', validity: 30, status: 'Active' },
    { id: 'T-004', name: 'Inventory Starter', description: 'Warehouse and stock management', products: 'Stock', qty: 1, price: '₹999', tax: '18% GST', validity: 14, status: 'Inactive' },
    { id: 'T-005', name: 'Project & Collaboration', description: 'Team project tracking', products: 'Projects', qty: 3, price: '₹4,497', tax: '18% GST', validity: 30, status: 'Active' },
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
            <button className="qp-action-btn" onClick={() => setOpen(o => !o)} aria-label="Actions" type="button">
                ···
            </button>
            {open && (
                <ul className="qp-action-menu" role="menu">
                    {items.map(item => (
                        <li key={item.label} role="menuitem">
                            <button
                                className={`qp-action-item${item.danger ? ' danger' : ''}`}
                                onClick={() => { item.onClick?.(); setOpen(false); }}
                                type="button"
                            >
                                <QIcon name={item.icon} size={14} />
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{message}</span>
        </div>
    );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);
    return (
        <div className="qp-modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div className="qp-modal" role="dialog" aria-modal="true" aria-labelledby="qp-modal-title">
                <div className="qp-modal-header">
                    <h3 id="qp-modal-title" className="qp-modal-title">{title}</h3>
                    <button className="qp-modal-close" onClick={onClose} aria-label="Close" type="button">
                        <QIcon name="x" size={18} />
                    </button>
                </div>
                <div className="qp-modal-body">{children}</div>
            </div>
        </div>
    );
}

// ─── Quotation detail view ─────────────────────────────────────────────────────
function QuotationDetailModal({ quotation, onClose }) {
    if (!quotation) return null;
    return (
        <Modal title={`Quotation ${quotation.id}`} onClose={onClose}>
            <BackendNotice message="Quotation detail view is ready. Connect the GET /api/quotations/:id endpoint to load live data." />
            <div className="qp-detail-grid">
                <div className="qp-detail-section">
                    <h4 className="qp-detail-section-title">Quotation Information</h4>
                    <dl className="qp-detail-dl">
                        <dt>Quotation Number</dt><dd className="font-mono">{quotation.id}</dd>
                        <dt>Customer</dt><dd>{quotation.customer}</dd>
                        <dt>Quotation Date</dt><dd>{quotation.date}</dd>
                        <dt>Valid Until</dt><dd>{quotation.validUntil}</dd>
                        <dt>Status</dt><dd><StatusPill status={quotation.status} /></dd>
                    </dl>
                </div>
                <div className="qp-detail-section">
                    <h4 className="qp-detail-section-title">Pricing Summary</h4>
                    <dl className="qp-detail-dl">
                        <dt>Subtotal</dt><dd>{quotation.subtotal}</dd>
                        <dt>Tax</dt><dd>{quotation.tax}</dd>
                        <dt>Discount</dt><dd>{quotation.discount}</dd>
                        <dt className="total-key">Total Amount</dt><dd className="total-val">{quotation.total}</dd>
                    </dl>
                </div>
            </div>
            <div className="qp-detail-section">
                <h4 className="qp-detail-section-title">Quotation Items</h4>
                <BackendNotice message="Connect GET /api/quotations/:id/items to load line items." />
                <div className="qp-placeholder-block">Line items will load from the backend API.</div>
            </div>
            <div className="qp-modal-footer">
                <button className="qp-btn qp-btn-ghost" onClick={onClose} type="button">Close</button>
                {quotation.status === 'Accepted' && (
                    <button className="qp-btn qp-btn-primary" type="button">
                        <QIcon name="convert" size={14} /> Convert to Subscription
                    </button>
                )}
            </div>
        </Modal>
    );
}

// ─── Create / Edit Quotation modal ────────────────────────────────────────────
function QuotationFormModal({ quotation, onClose }) {
    return (
        <Modal title={quotation ? `Edit Quotation ${quotation.id}` : 'Create Quotation'} onClose={onClose}>
            <BackendNotice message={quotation ? 'Connect PUT /api/quotations/:id to save edits.' : 'Connect POST /api/quotations to create a new quotation.'} />
            <form className="qp-form" onSubmit={e => e.preventDefault()}>
                <div className="qp-form-row">
                    <div className="qp-field">
                        <label htmlFor="qf-customer">Customer</label>
                        <input id="qf-customer" type="text" placeholder="Search or select customer…" defaultValue={quotation?.customer || ''} />
                    </div>
                    <div className="qp-field">
                        <label htmlFor="qf-valid">Valid Until</label>
                        <input id="qf-valid" type="date" defaultValue={quotation?.validUntil || ''} />
                    </div>
                </div>
                <div className="qp-field">
                    <label>Quotation Items</label>
                    <BackendNotice message="Load products from GET /api/products to populate the item selector." />
                    <div className="qp-placeholder-block">Item rows will be editable once product API is connected.</div>
                </div>
                <div className="qp-form-row">
                    <div className="qp-field">
                        <label htmlFor="qf-discount">Discount</label>
                        <input id="qf-discount" type="text" placeholder="₹ 0.00" defaultValue={quotation?.discount || ''} />
                    </div>
                    <div className="qp-field">
                        <label htmlFor="qf-notes">Notes</label>
                        <input id="qf-notes" type="text" placeholder="Optional internal notes" />
                    </div>
                </div>
                <div className="qp-modal-footer">
                    <button className="qp-btn qp-btn-ghost" onClick={onClose} type="button">Cancel</button>
                    <button className="qp-btn qp-btn-primary" type="submit">
                        {quotation ? 'Save Changes' : 'Create Quotation'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Template form modal ───────────────────────────────────────────────────────
function TemplateFormModal({ template, onClose }) {
    return (
        <Modal title={template ? `Edit Template — ${template.name}` : 'Create Quotation Template'} onClose={onClose}>
            <BackendNotice message={template ? 'Connect PUT /api/quotation-templates/:id to save.' : 'Connect POST /api/quotation-templates to create.'} />
            <form className="qp-form" onSubmit={e => e.preventDefault()}>
                <div className="qp-field">
                    <label htmlFor="tf-name">Template Name</label>
                    <input id="tf-name" type="text" placeholder="e.g. Enterprise SaaS Bundle" defaultValue={template?.name || ''} />
                </div>
                <div className="qp-field">
                    <label htmlFor="tf-desc">Description</label>
                    <input id="tf-desc" type="text" placeholder="Brief description of this template" defaultValue={template?.description || ''} />
                </div>
                <div className="qp-form-row">
                    <div className="qp-field">
                        <label htmlFor="tf-validity">Validity Period (days)</label>
                        <input id="tf-validity" type="number" min="1" placeholder="30" defaultValue={template?.validity || ''} />
                    </div>
                    <div className="qp-field">
                        <label htmlFor="tf-tax">Applicable Tax</label>
                        <input id="tf-tax" type="text" placeholder="e.g. 18% GST" defaultValue={template?.tax || ''} />
                    </div>
                </div>
                <div className="qp-field">
                    <label>Products & Plans</label>
                    <BackendNotice message="Load products from GET /api/products and plans from GET /api/subscription-plans." />
                    <div className="qp-placeholder-block">Product/plan line items will be configurable once APIs are connected.</div>
                </div>
                <div className="qp-modal-footer">
                    <button className="qp-btn qp-btn-ghost" onClick={onClose} type="button">Cancel</button>
                    <button className="qp-btn qp-btn-primary" type="submit">
                        {template ? 'Save Changes' : 'Create Template'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Confirm delete modal ──────────────────────────────────────────────────────
function DeleteModal({ entityLabel, onClose }) {
    return (
        <Modal title="Confirm Delete" onClose={onClose}>
            <BackendNotice message={`Connect DELETE /api/${entityLabel.toLowerCase().replace(/\s/g, '-')}s/:id to enable deletion.`} />
            <p className="qp-delete-text">This action cannot be undone. Are you sure you want to delete this {entityLabel.toLowerCase()}?</p>
            <div className="qp-modal-footer">
                <button className="qp-btn qp-btn-ghost" onClick={onClose} type="button">Cancel</button>
                <button className="qp-btn qp-btn-danger" type="button" onClick={onClose}>Delete</button>
            </div>
        </Modal>
    );
}

// ─── All Quotations tab ───────────────────────────────────────────────────────
function AllQuotationsTab() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null); // { type, data }
    const PER_PAGE = 5;

    const statuses = ['All', 'Draft', 'Sent', 'Accepted', 'Expired', 'Cancelled'];

    const filtered = SAMPLE_QUOTATIONS.filter(q => {
        const matchSearch = q.id.toLowerCase().includes(search.toLowerCase()) ||
            q.customer.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || q.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    function openModal(type, data = null) { setModal({ type, data }); }
    function closeModal() { setModal(null); }

    return (
        <div className="qp-tab-content">
            <BackendNotice message="All quotations data is static for UI demonstration. Connect GET /api/quotations to load live records." />

            {/* Toolbar */}
            <div className="qp-toolbar">
                <div className="qp-toolbar-left">
                    <div className="qp-search-wrap">
                        <QIcon name="search" size={15} />
                        <input
                            id="quotations-search"
                            className="qp-search-input"
                            type="search"
                            placeholder="Search by ID or customer…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            aria-label="Search quotations"
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
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    id="create-quotation-btn"
                    className="qp-btn qp-btn-primary"
                    type="button"
                    onClick={() => openModal('create')}
                >
                    <QIcon name="plus" size={15} /> Create Quotation
                </button>
            </div>

            {/* Table */}
            <div className="qp-table-wrap">
                <table className="qp-table" aria-label="Quotations list">
                    <thead>
                        <tr>
                            <th>Quotation No.</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Valid Until</th>
                            <th style={{ textAlign: 'center' }}>Items</th>
                            <th>Subtotal</th>
                            <th>Tax</th>
                            <th>Discount</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="qp-empty-row">No quotations match your search.</td>
                            </tr>
                        ) : paged.map(q => (
                            <tr key={q.id}>
                                <td><span className="font-mono qp-id-link" onClick={() => openModal('view', q)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && openModal('view', q)}>{q.id}</span></td>
                                <td className="qp-customer-cell">{q.customer}</td>
                                <td>{q.date}</td>
                                <td>{q.validUntil}</td>
                                <td style={{ textAlign: 'center' }}>{q.items}</td>
                                <td>{q.subtotal}</td>
                                <td>{q.tax}</td>
                                <td>{q.discount}</td>
                                <td className="qp-total-cell">{q.total}</td>
                                <td><StatusPill status={q.status} /></td>
                                <td style={{ textAlign: 'center' }}>
                                    <ActionMenu items={[
                                        { label: 'View', icon: 'eye', onClick: () => openModal('view', q) },
                                        { label: 'Edit', icon: 'edit', onClick: () => openModal('edit', q) },
                                        { label: 'Download PDF', icon: 'download', onClick: () => { } },
                                        { label: 'Send to Customer', icon: 'send', onClick: () => { } },
                                        ...(q.status === 'Accepted' ? [{ label: 'Convert to Subscription', icon: 'convert', onClick: () => { } }] : []),
                                        { label: 'Delete', icon: 'trash', danger: true, onClick: () => openModal('delete', q) },
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
                            <QIcon name="chevLeft" size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button
                                key={n}
                                className={`qp-page-btn${n === page ? ' active' : ''}`}
                                onClick={() => setPage(n)}
                                aria-current={n === page ? 'page' : undefined}
                                type="button"
                            >
                                {n}
                            </button>
                        ))}
                        <button className="qp-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page" type="button">
                            <QIcon name="chevRight" size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {modal?.type === 'view' && <QuotationDetailModal quotation={modal.data} onClose={closeModal} />}
            {modal?.type === 'create' && <QuotationFormModal quotation={null} onClose={closeModal} />}
            {modal?.type === 'edit' && <QuotationFormModal quotation={modal.data} onClose={closeModal} />}
            {modal?.type === 'delete' && <DeleteModal entityLabel="Quotation" onClose={closeModal} />}
        </div>
    );
}

// ─── Quotation templates tab ──────────────────────────────────────────────────
function TemplatesTab() {
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);

    const filtered = SAMPLE_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    );

    function openModal(type, data = null) { setModal({ type, data }); }
    function closeModal() { setModal(null); }

    return (
        <div className="qp-tab-content">
            <BackendNotice message="Quotation templates data is static for UI demonstration. Connect GET /api/quotation-templates to load live records." />

            <div className="qp-toolbar">
                <div className="qp-toolbar-left">
                    <div className="qp-search-wrap">
                        <QIcon name="search" size={15} />
                        <input
                            id="templates-search"
                            className="qp-search-input"
                            type="search"
                            placeholder="Search templates…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            aria-label="Search templates"
                        />
                    </div>
                </div>
                <button
                    id="create-template-btn"
                    className="qp-btn qp-btn-primary"
                    type="button"
                    onClick={() => openModal('create')}
                >
                    <QIcon name="plus" size={15} /> Create Template
                </button>
            </div>

            <div className="qp-table-wrap">
                <table className="qp-table" aria-label="Quotation templates list">
                    <thead>
                        <tr>
                            <th>Template Name</th>
                            <th>Description</th>
                            <th>Products & Plans</th>
                            <th style={{ textAlign: 'center' }}>Default Qty</th>
                            <th>Unit Price</th>
                            <th>Tax</th>
                            <th style={{ textAlign: 'center' }}>Validity (days)</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="qp-empty-row">No templates match your search.</td>
                            </tr>
                        ) : filtered.map(t => (
                            <tr key={t.id}>
                                <td>
                                    <span className="qp-template-name">{t.name}</span>
                                    <span className="qp-template-id font-mono">{t.id}</span>
                                </td>
                                <td className="qp-desc-cell">{t.description}</td>
                                <td>{t.products}</td>
                                <td style={{ textAlign: 'center' }}>{t.qty}</td>
                                <td>{t.price}</td>
                                <td>{t.tax}</td>
                                <td style={{ textAlign: 'center' }}>{t.validity}</td>
                                <td><StatusPill status={t.status} /></td>
                                <td style={{ textAlign: 'center' }}>
                                    <ActionMenu items={[
                                        { label: 'View', icon: 'eye', onClick: () => openModal('view', t) },
                                        { label: 'Edit', icon: 'edit', onClick: () => openModal('edit', t) },
                                        { label: 'Duplicate', icon: 'copy', onClick: () => { } },
                                        { label: t.status === 'Active' ? 'Deactivate' : 'Activate', icon: t.status === 'Active' ? 'toggleOff' : 'toggle', onClick: () => { } },
                                        { label: 'Delete', icon: 'trash', danger: true, onClick: () => openModal('delete', t) },
                                    ]} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal?.type === 'view' && <TemplateFormModal template={modal.data} onClose={closeModal} />}
            {modal?.type === 'create' && <TemplateFormModal template={null} onClose={closeModal} />}
            {modal?.type === 'edit' && <TemplateFormModal template={modal.data} onClose={closeModal} />}
            {modal?.type === 'delete' && <DeleteModal entityLabel="Template" onClose={closeModal} />}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function QuotationsPage() {
    const [activeTab, setActiveTab] = useState('quotations');

    return (
        <div className="qp-page" id="quotations-page">
            {/* Page tabs */}
            <div className="qp-tabs-bar" role="tablist" aria-label="Quotations sections">
                <button
                    id="tab-all-quotations"
                    role="tab"
                    aria-selected={activeTab === 'quotations'}
                    className={`qp-tab${activeTab === 'quotations' ? ' active' : ''}`}
                    onClick={() => setActiveTab('quotations')}
                    type="button"
                >
                    <AdminIcon name="quotations" size={16} />
                    All Quotations
                    <span className="qp-tab-count">{SAMPLE_QUOTATIONS.length}</span>
                </button>
                <button
                    id="tab-templates"
                    role="tab"
                    aria-selected={activeTab === 'templates'}
                    className={`qp-tab${activeTab === 'templates' ? ' active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                    type="button"
                >
                    <AdminIcon name="quotationTemplates" size={16} />
                    Quotation Templates
                    <span className="qp-tab-count">{SAMPLE_TEMPLATES.length}</span>
                </button>
            </div>

            {/* Tab panels */}
            <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
                {activeTab === 'quotations' ? <AllQuotationsTab /> : <TemplatesTab />}
            </div>
        </div>
    );
}
