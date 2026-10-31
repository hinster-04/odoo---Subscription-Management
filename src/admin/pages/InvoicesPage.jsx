import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoicesApi, financeHelpers } from '../services/financeApi';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const STATUS_CLASS = { draft: 'fin-status-draft', confirmed: 'fin-status-confirmed', paid: 'fin-status-paid', cancelled: 'fin-status-cancelled' };
function StatusPill({ status }) {
    return (
        <span className={`fin-status-pill ${STATUS_CLASS[status] || ''}`}>
            <span className="fin-status-dot" />{status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
function StatCard({ label, value, accent }) {
    return (
        <div className={`fin-stat-card${accent ? ` fin-stat-${accent}` : ''}`}>
            <div className="fin-stat-label">{label}</div>
            <div className="fin-stat-value">{value ?? 0}</div>
        </div>
    );
}
function Alert({ type, msg, onClose }) {
    if (!msg) return null;
    return (
        <div className={`fin-alert fin-alert-${type}`}>
            <span>{msg}</span>
            {onClose && <button className="fin-alert-close" onClick={onClose}>✕</button>}
        </div>
    );
}
function Modal({ title, onClose, width, children }) {
    useEffect(() => {
        const h = e => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
        <div className="fin-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div className={`fin-modal-dialog${width === 'xl' ? ' fin-modal-xl' : width === 'lg' ? ' fin-modal-lg' : ''}`}>
                <div className="fin-modal-header">
                    <h3 className="fin-modal-title">{title}</h3>
                    <button className="fin-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="fin-modal-body">{children}</div>
            </div>
        </div>
    );
}
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function fmtMoney(n) { return n == null ? '—' : `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; }

/* ─── Line item component ──────────────────────────────────────────────────── */
const EMPTY_LINE = { description: '', quantity: 1, unit_price: '', tax_rate_id: '', tax_percentage: 0, discount_amount: 0 };

function LineItem({ line, idx, taxes, onChange, onRemove, isOnly }) {
    function up(field, val) { onChange(idx, { ...line, [field]: val }); }
    function onTaxChange(e) {
        const t = taxes.find(x => x.id === e.target.value);
        up('tax_rate_id', e.target.value);
        up('tax_percentage', t ? parseFloat(t.percentage) : 0);
    }
    const gross = (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0);
    const disc = parseFloat(line.discount_amount) || 0;
    const tax = ((gross - disc) * (parseFloat(line.tax_percentage) || 0)) / 100;
    const total = gross - disc + tax;

    return (
        <tr>
            <td>
                <input className="fin-line-input fin-line-desc" placeholder="Description *"
                    value={line.description} onChange={e => up('description', e.target.value)} />
            </td>
            <td>
                <input type="number" className="fin-line-input fin-line-num" min="0.01" step="0.01"
                    value={line.quantity} onChange={e => up('quantity', e.target.value)} />
            </td>
            <td>
                <input type="number" className="fin-line-input fin-line-num" min="0" step="0.01"
                    placeholder="0.00" value={line.unit_price} onChange={e => up('unit_price', e.target.value)} />
            </td>
            <td>
                <select className="fin-line-select" value={line.tax_rate_id} onChange={onTaxChange}>
                    <option value="">No Tax</option>
                    {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({parseFloat(t.percentage)}%)</option>)}
                </select>
            </td>
            <td>
                <input type="number" className="fin-line-input fin-line-num" min="0" step="0.01"
                    placeholder="0.00" value={line.discount_amount} onChange={e => up('discount_amount', e.target.value)} />
            </td>
            <td className="fin-line-total">{fmtMoney(isNaN(total) ? 0 : total.toFixed(2))}</td>
            <td>
                <button className="fin-line-remove" disabled={isOnly} title="Remove line" onClick={() => onRemove(idx)}>✕</button>
            </td>
        </tr>
    );
}

/* ─── Invoice form ─────────────────────────────────────────────────────────── */
function InvoiceForm({ initial, onSave, onCancel, saving, formErr, setFormErr }) {
    const [taxes, setTaxes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [custQ, setCustQ] = useState(initial?.customer_name || '');
    const [custOpen, setCustOpen] = useState(false);
    const dropRef = useRef();

    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState(initial || {
        customer_id: '', customer_name: '',
        invoice_date: today, due_date: '',
        billing_period_start: '', billing_period_end: '',
        notes: '',
        lines: [{ ...EMPTY_LINE }],
    });

    useEffect(() => {
        financeHelpers.getActiveTaxes().then(r => setTaxes(r.data || [])).catch(() => { });
    }, []);

    // Debounce customer search
    useEffect(() => {
        if (!custQ || form.customer_id) return;
        const t = setTimeout(async () => {
            try { const r = await financeHelpers.getCustomers(custQ); setCustomers(r.data || []); setCustOpen(true); }
            catch { setCustomers([]); }
        }, 320);
        return () => clearTimeout(t);
    }, [custQ, form.customer_id]);

    // Click outside to close
    useEffect(() => {
        const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setCustOpen(false); };
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
    }, []);

    function field(k, v) { setForm(f => ({ ...f, [k]: v })); }
    function addLine() { setForm(f => ({ ...f, lines: [...f.lines, { ...EMPTY_LINE }] })); }
    function rmLine(i) { setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) })); }
    function upLine(i, l) { setForm(f => ({ ...f, lines: f.lines.map((x, idx) => idx === i ? l : x) })); }

    // Computed totals
    let subtotal = 0, taxTot = 0, discTot = 0;
    (form.lines || []).forEach(l => {
        const g = (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0);
        const d = parseFloat(l.discount_amount) || 0;
        const t = ((g - d) * (parseFloat(l.tax_percentage) || 0)) / 100;
        subtotal += g; taxTot += t; discTot += d;
    });
    const grandTotal = subtotal - discTot + taxTot;

    return (
        <div className="fin-invoice-form">
            {/* ── Header fields ── */}
            <div className="fin-form fin-form-grid">
                {/* Customer */}
                <div className="fin-form-field fin-full" ref={dropRef}>
                    <label>Customer <span className="fin-required">*</span></label>
                    <div className="fin-autocomplete">
                        <input placeholder="Type to search customers…"
                            value={custQ}
                            onChange={e => { setCustQ(e.target.value); field('customer_id', ''); field('customer_name', e.target.value); setCustOpen(true); }}
                            onFocus={() => custQ && setCustOpen(true)}
                        />
                        {custOpen && customers.length > 0 && (
                            <ul className="fin-autocomplete-list">
                                {customers.map(c => {
                                    const name = c.business_name || `${c.first_name} ${c.last_name || ''}`.trim();
                                    return (
                                        <li key={c.id} onClick={() => {
                                            field('customer_id', c.id); field('customer_name', name);
                                            setCustQ(name); setCustOpen(false);
                                        }}>
                                            <strong>{name}</strong>{c.email && <span className="fin-cell-muted"> · {c.email}</span>}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    {form.customer_id && <div className="fin-selected-inv-info">✅ Customer selected: <strong>{form.customer_name}</strong></div>}
                </div>

                <div className="fin-form-field">
                    <label>Invoice Date <span className="fin-required">*</span></label>
                    <input type="date" value={form.invoice_date} onChange={e => field('invoice_date', e.target.value)} />
                </div>
                <div className="fin-form-field">
                    <label>Due Date <span className="fin-required">*</span></label>
                    <input type="date" value={form.due_date} onChange={e => field('due_date', e.target.value)} />
                </div>
                <div className="fin-form-field">
                    <label>Billing Period — Start</label>
                    <input type="date" value={form.billing_period_start} onChange={e => field('billing_period_start', e.target.value)} />
                </div>
                <div className="fin-form-field">
                    <label>Billing Period — End</label>
                    <input type="date" value={form.billing_period_end} onChange={e => field('billing_period_end', e.target.value)} />
                </div>
                <div className="fin-form-field fin-full">
                    <label>Notes / Payment Terms</label>
                    <textarea rows={2} value={form.notes} placeholder="e.g. Payment due within 30 days via bank transfer"
                        onChange={e => field('notes', e.target.value)} />
                </div>
            </div>

            {/* ── Line items ── */}
            <div className="fin-lines-section">
                <div className="fin-lines-header">
                    <h4>📄 Invoice Lines</h4>
                    <button className="fin-btn-ghost-sm" onClick={addLine}>+ Add Line</button>
                </div>
                <div className="fin-table-wrap">
                    <table className="fin-table fin-lines-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: 200 }}>Description</th>
                                <th style={{ width: 80 }}>Qty</th>
                                <th style={{ width: 110 }}>Unit Price (₹)</th>
                                <th style={{ width: 160 }}>Tax</th>
                                <th style={{ width: 110 }}>Discount (₹)</th>
                                <th style={{ width: 120 }}>Line Total</th>
                                <th style={{ width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {form.lines.map((l, i) => (
                                <LineItem key={i} line={l} idx={i} taxes={taxes}
                                    onChange={upLine} onRemove={rmLine}
                                    isOnly={form.lines.length === 1} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="fin-totals-box fin-totals-right">
                    <div className="fin-total-row"><span>Subtotal</span><span>{fmtMoney(subtotal.toFixed(2))}</span></div>
                    <div className="fin-total-row"><span>Discount</span><span>− {fmtMoney(discTot.toFixed(2))}</span></div>
                    <div className="fin-total-row"><span>Tax</span><span>+ {fmtMoney(taxTot.toFixed(2))}</span></div>
                    <div className="fin-total-row fin-total-grand"><span>Grand Total</span><span>{fmtMoney(grandTotal.toFixed(2))}</span></div>
                </div>
            </div>

            {formErr && <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />}

            <div className="fin-modal-footer">
                <button className="fin-btn-ghost" onClick={onCancel}>Cancel</button>
                <button className="fin-btn-primary" onClick={() => onSave(form)} disabled={saving}>
                    {saving ? 'Saving…' : 'Save as Draft'}
                </button>
            </div>
        </div>
    );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */
export function InvoicesPage() {
    const [rows, setRows] = useState([]);
    const [stats, setStats] = useState({});
    const [pager, setPager] = useState({ page: 1, totalPages: 1, total: 0 });
    const [busy, setBusy] = useState(true);
    const [err, setErr] = useState('');
    const [ok, setOk] = useState('');

    const [q, setQ] = useState('');
    const [fStat, setFStat] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [overdue, setOverdue] = useState(false);
    const [page, setPage] = useState(1);

    const [mode, setMode] = useState(null); // create | edit | detail | confirm | cancel
    const [sel, setSel] = useState(null);
    const [detail, setDetail] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState('');

    const load = useCallback(async () => {
        setBusy(true); setErr('');
        try {
            const r = await invoicesApi.list({
                search: q, status: fStat,
                date_from: dateFrom, date_to: dateTo,
                overdue: overdue || undefined,
                page, pageSize: 20,
            });
            setRows(r.items || []);
            setStats(r.stats || {});
            setPager(r.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (e) { setErr(e.message || 'Failed to load. Ensure the backend server is running.'); }
        finally { setBusy(false); }
    }, [q, fStat, dateFrom, dateTo, overdue, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (!ok) return; const t = setTimeout(() => setOk(''), 5000); return () => clearTimeout(t); }, [ok]);

    const closeModal = () => { setMode(null); setSel(null); setDetail(null); setSaving(false); setFormErr(''); };

    async function openDetail(inv) {
        try { const r = await invoicesApi.getById(inv.id); setDetail(r.data); setMode('detail'); }
        catch (e) { setErr(e.message); }
    }

    /* ── Create ── */
    async function handleCreate(form) {
        setFormErr('');
        if (!form.customer_id) { setFormErr('Please select a customer.'); return; }
        if (!form.invoice_date) { setFormErr('Invoice date is required.'); return; }
        if (!form.due_date) { setFormErr('Due date is required.'); return; }
        const emptyLine = form.lines.find(l => !l.description.trim());
        if (emptyLine) { setFormErr('All invoice lines must have a description.'); return; }

        setSaving(true);
        try {
            await invoicesApi.create({
                customer_id: form.customer_id,
                invoice_date: form.invoice_date,
                due_date: form.due_date,
                notes: form.notes,
                billing_period_start: form.billing_period_start || null,
                billing_period_end: form.billing_period_end || null,
                lines: form.lines.map((l, i) => ({
                    description: l.description,
                    quantity: parseFloat(l.quantity) || 1,
                    unit_price: parseFloat(l.unit_price) || 0,
                    tax_rate_id: l.tax_rate_id || null,
                    tax_percentage: parseFloat(l.tax_percentage) || 0,
                    discount_amount: parseFloat(l.discount_amount) || 0,
                    sort_order: i,
                })),
            });
            setOk('Invoice created as Draft.'); closeModal(); load();
        } catch (e) { setFormErr(e.message); setSaving(false); }
    }

    /* ── Edit draft ── */
    async function handleEdit(form) {
        setFormErr('');
        if (!form.customer_id) { setFormErr('Please select a customer.'); return; }
        if (!form.due_date) { setFormErr('Due date is required.'); return; }
        setSaving(true);
        try {
            await invoicesApi.update(sel.id, {
                due_date: form.due_date,
                notes: form.notes,
                billing_period_start: form.billing_period_start || null,
                billing_period_end: form.billing_period_end || null,
                lines: form.lines.map((l, i) => ({
                    description: l.description,
                    quantity: parseFloat(l.quantity) || 1,
                    unit_price: parseFloat(l.unit_price) || 0,
                    tax_rate_id: l.tax_rate_id || null,
                    tax_percentage: parseFloat(l.tax_percentage) || 0,
                    discount_amount: parseFloat(l.discount_amount) || 0,
                    sort_order: i,
                })),
            });
            setOk(`Invoice ${sel.invoice_number} updated.`); closeModal(); load();
        } catch (e) { setFormErr(e.message); setSaving(false); }
    }

    /* ── Confirm ── */
    async function handleConfirm() {
        setSaving(true); setFormErr('');
        try { await invoicesApi.confirm(sel.id); setOk(`Invoice ${sel.invoice_number} confirmed.`); closeModal(); load(); }
        catch (e) { setFormErr(e.message); setSaving(false); }
    }

    /* ── Cancel ── */
    async function handleCancel() {
        setSaving(true); setFormErr('');
        try { await invoicesApi.cancel(sel.id); setOk(`Invoice ${sel.invoice_number} cancelled.`); closeModal(); load(); }
        catch (e) { setFormErr(e.message); setSaving(false); }
    }

    /* ── build edit initial from a row ── */
    function buildEditInitial(inv) {
        return {
            customer_id: inv.customer_id, customer_name: inv.customer_name || inv.business_name || '',
            invoice_date: inv.invoice_date ? inv.invoice_date.split('T')[0] : '',
            due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
            billing_period_start: inv.billing_period_start ? inv.billing_period_start.split('T')[0] : '',
            billing_period_end: inv.billing_period_end ? inv.billing_period_end.split('T')[0] : '',
            notes: inv.notes || '',
            lines: (inv.lines || []).map(l => ({
                description: l.description || '',
                quantity: l.quantity, unit_price: l.unit_price,
                tax_rate_id: l.tax_rate_id || '', tax_percentage: l.tax_percentage || 0,
                discount_amount: l.discount_amount || 0,
            })),
        };
    }

    /* ── render ─────────────────────────────────────────────────────────────── */
    return (
        <div className="fin-page">
            {/* Header */}
            <div className="fin-page-header">
                <div>
                    <h1 className="fin-page-title">Invoices</h1>
                    <p className="fin-page-subtitle">Create and manage customer invoices. Draft invoices are editable; confirmed invoices lock the amounts.</p>
                </div>
                <button id="btn-new-invoice" className="fin-btn-primary" onClick={() => { setFormErr(''); setMode('create'); }}>
                    + New Invoice
                </button>
            </div>

            <Alert type="error" msg={err} onClose={() => setErr('')} />
            <Alert type="success" msg={ok} onClose={() => setOk('')} />

            {/* Stats */}
            <div className="fin-stats-grid fin-stats-5">
                <StatCard label="Total Invoices" value={stats.total} />
                <StatCard label="Paid" value={stats.paid} accent="emerald" />
                <StatCard label="Outstanding" value={stats.outstanding} accent="blue" />
                <StatCard label="Overdue" value={stats.overdue} accent="rose" />
                <StatCard label="Balance Due" value={fmtMoney(stats.total_outstanding)} accent="amber" />
            </div>

            {/* Toolbar */}
            <div className="fin-toolbar fin-toolbar-wrap">
                <div className="fin-search-wrap">
                    <span className="fin-search-icon">🔍</span>
                    <input className="fin-search-input" placeholder="Invoice #, customer…"
                        value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
                    {q && <button className="fin-search-clear" onClick={() => { setQ(''); setPage(1); }}>✕</button>}
                </div>
                <select className="fin-select" value={fStat} onChange={e => { setFStat(e.target.value); setPage(1); }}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <input type="date" className="fin-select" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From" />
                <input type="date" className="fin-select" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} title="To" />
                <label className="fin-overdue-check">
                    <input type="checkbox" checked={overdue} onChange={e => { setOverdue(e.target.checked); setPage(1); }} />
                    &nbsp;Overdue only
                </label>
                <button className="fin-btn-refresh" onClick={load}>↻</button>
            </div>

            {/* Table */}
            <div className="fin-table-card">
                {busy ? (
                    <div className="fin-empty"><div className="fin-spinner" /><p>Loading…</p></div>
                ) : rows.length === 0 ? (
                    <div className="fin-empty">
                        <div className="fin-empty-icon">🧾</div>
                        <h3>{q || fStat ? 'No invoices match your filters' : 'No invoices yet'}</h3>
                        <p>{q || fStat ? 'Adjust the filters.' : 'Click "New Invoice" to create the first one.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="fin-table-wrap">
                            <table className="fin-table">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th><th>Customer</th><th>Date</th><th>Due</th>
                                        <th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(inv => {
                                        const past = !['paid', 'cancelled'].includes(inv.status) && new Date(inv.due_date) < new Date();
                                        return (
                                            <tr key={inv.id} className={past ? 'fin-row-overdue' : ''}>
                                                <td><button className="fin-row-link" onClick={() => openDetail(inv)}>{inv.invoice_number}</button></td>
                                                <td>
                                                    <div className="fin-cell-name">{inv.customer_name}</div>
                                                    {inv.business_name && <div className="fin-cell-sub">{inv.business_name}</div>}
                                                </td>
                                                <td className="fin-cell-muted">{fmtDate(inv.invoice_date)}</td>
                                                <td className={`fin-cell-muted${past ? ' fin-overdue-text' : ''}`}>
                                                    {fmtDate(inv.due_date)}{past && <span className="fin-overdue-badge">Overdue</span>}
                                                </td>
                                                <td><strong>{fmtMoney(inv.total_amount)}</strong></td>
                                                <td>{fmtMoney(inv.amount_paid)}</td>
                                                <td className={parseFloat(inv.balance_due) > 0 && !['paid', 'cancelled'].includes(inv.status) ? 'fin-balance-due' : ''}>
                                                    {fmtMoney(inv.balance_due)}
                                                </td>
                                                <td><StatusPill status={inv.status} /></td>
                                                <td>
                                                    <div className="fin-row-actions">
                                                        <button className="fin-action-btn fin-action-edit" onClick={() => openDetail(inv)}>View</button>
                                                        {inv.status === 'draft' && (
                                                            <>
                                                                <button className="fin-action-btn fin-action-toggle"
                                                                    onClick={async () => {
                                                                        try { const r = await invoicesApi.getById(inv.id); setSel({ ...r.data, ...inv }); setFormErr(''); setMode('edit'); }
                                                                        catch (e) { setErr(e.message); }
                                                                    }}>Edit</button>
                                                                <button className="fin-action-btn fin-action-confirm"
                                                                    onClick={() => { setSel(inv); setFormErr(''); setMode('confirm'); }}>Confirm</button>
                                                            </>
                                                        )}
                                                        {['draft', 'confirmed'].includes(inv.status) && (
                                                            <button className="fin-action-btn fin-action-delete"
                                                                onClick={() => { setSel(inv); setFormErr(''); setMode('cancel'); }}>Cancel</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="fin-pagination">
                            <span className="fin-pagination-info">{rows.length} of {pager.total} records</span>
                            <div className="fin-pagination-btns">
                                <button className="fin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <span className="fin-page-indicator">Page {pager.page} of {pager.totalPages}</span>
                                <button className="fin-page-btn" disabled={page >= pager.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ══ CREATE MODAL ══ */}
            {mode === 'create' && (
                <Modal title="➕ New Invoice" onClose={closeModal} width="xl">
                    <InvoiceForm onSave={handleCreate} onCancel={closeModal} saving={saving} formErr={formErr} setFormErr={setFormErr} />
                </Modal>
            )}

            {/* ══ EDIT DRAFT MODAL ══ */}
            {mode === 'edit' && sel && (
                <Modal title={`✏️ Edit Draft — ${sel.invoice_number}`} onClose={closeModal} width="xl">
                    <div className="fin-alert fin-alert-info" style={{ background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a', marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                        ℹ️ Only <strong>Draft</strong> invoices can be edited. Once confirmed, you must cancel and re-create.
                    </div>
                    <InvoiceForm
                        initial={buildEditInitial(sel)}
                        onSave={handleEdit}
                        onCancel={closeModal}
                        saving={saving}
                        formErr={formErr}
                        setFormErr={setFormErr}
                    />
                </Modal>
            )}

            {/* ══ DETAIL MODAL ══ */}
            {mode === 'detail' && detail && (
                <Modal title={`🧾 Invoice ${detail.invoice_number}`} onClose={closeModal} width="xl">
                    <div className="fin-invoice-detail">
                        <div className="fin-detail-topbar">
                            <StatusPill status={detail.status} />
                            <div className="fin-detail-actions">
                                {detail.status === 'draft' && (
                                    <>
                                        <button className="fin-btn-ghost" onClick={async () => {
                                            const r = await invoicesApi.getById(detail.id).catch(() => null);
                                            if (r) { setSel({ ...r.data, ...detail }); setMode('edit'); }
                                        }}>✏️ Edit Draft</button>
                                        <button className="fin-btn-primary" onClick={() => { setSel(detail); setMode('confirm'); }}>✅ Confirm</button>
                                    </>
                                )}
                                {['draft', 'confirmed'].includes(detail.status) && (
                                    <button className="fin-btn-danger-outline" onClick={() => { setSel(detail); setMode('cancel'); }}>Cancel Invoice</button>
                                )}
                            </div>
                        </div>

                        <div className="fin-detail-grid">
                            <div className="fin-detail-item"><span>Customer</span><strong>{detail.customer_name}</strong></div>
                            {detail.business_name && <div className="fin-detail-item"><span>Business</span><strong>{detail.business_name}</strong></div>}
                            {detail.customer_email && <div className="fin-detail-item"><span>Email</span><strong>{detail.customer_email}</strong></div>}
                            <div className="fin-detail-item"><span>Invoice Date</span><strong>{fmtDate(detail.invoice_date)}</strong></div>
                            <div className="fin-detail-item"><span>Due Date</span><strong>{fmtDate(detail.due_date)}</strong></div>
                            {detail.billing_period_start && (
                                <div className="fin-detail-item fin-full">
                                    <span>Billing Period</span>
                                    <strong>{fmtDate(detail.billing_period_start)} → {fmtDate(detail.billing_period_end)}</strong>
                                </div>
                            )}
                        </div>

                        <div className="fin-table-wrap fin-mt">
                            <table className="fin-table">
                                <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Tax</th><th>Discount</th><th>Total</th></tr></thead>
                                <tbody>
                                    {(detail.lines || []).map((l, i) => (
                                        <tr key={i}>
                                            <td>{l.description}</td>
                                            <td>{l.quantity}</td>
                                            <td>{fmtMoney(l.unit_price)}</td>
                                            <td>{l.tax_percentage}%</td>
                                            <td>{fmtMoney(l.discount_amount)}</td>
                                            <td><strong>{fmtMoney(l.line_total)}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="fin-totals-box fin-totals-right">
                            <div className="fin-total-row"><span>Subtotal</span><span>{fmtMoney(detail.subtotal)}</span></div>
                            <div className="fin-total-row"><span>Discount</span><span>− {fmtMoney(detail.discount_amount)}</span></div>
                            <div className="fin-total-row"><span>Tax</span><span>+ {fmtMoney(detail.tax_amount)}</span></div>
                            <div className="fin-total-row fin-total-grand"><span>Grand Total</span><span>{fmtMoney(detail.total_amount)}</span></div>
                            <div className="fin-total-row"><span>Amount Paid</span><span>{fmtMoney(detail.amount_paid)}</span></div>
                            <div className="fin-total-row fin-balance-row"><span>Balance Due</span><span>{fmtMoney(detail.balance_due)}</span></div>
                        </div>

                        {detail.payments && detail.payments.length > 0 && (
                            <div className="fin-section-sub">
                                <h4 className="fin-section-sub-title">💳 Payment History</h4>
                                <div className="fin-table-wrap">
                                    <table className="fin-table">
                                        <thead><tr><th>Reference</th><th>Date</th><th>Method</th><th>Amount</th><th>Notes</th></tr></thead>
                                        <tbody>
                                            {detail.payments.map(p => (
                                                <tr key={p.id}>
                                                    <td className="fin-mono">{p.payment_reference}</td>
                                                    <td>{fmtDate(p.payment_date)}</td>
                                                    <td><span className="fin-badge fin-badge-blue">{p.payment_method.replace(/_/g, ' ')}</span></td>
                                                    <td><strong>{fmtMoney(p.amount)}</strong></td>
                                                    <td className="fin-cell-muted">{p.notes || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {detail.notes && <div className="fin-notes-box fin-mt">📝 {detail.notes}</div>}
                    </div>
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Close</button>
                    </div>
                </Modal>
            )}

            {/* ══ CONFIRM DIALOG ══ */}
            {mode === 'confirm' && sel && (
                <Modal title="✅ Confirm Invoice" onClose={closeModal}>
                    <p className="fin-confirm-text">Confirm invoice <strong>{sel.invoice_number}</strong>?</p>
                    <p className="fin-confirm-sub">Once confirmed the invoice is <strong>locked</strong> — lines and amounts cannot be changed. To correct it, cancel and create a new invoice.</p>
                    <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Back</button>
                        <button className="fin-btn-primary" onClick={handleConfirm} disabled={saving}>
                            {saving ? 'Confirming…' : 'Yes, Confirm Invoice'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ══ CANCEL DIALOG ══ */}
            {mode === 'cancel' && sel && (
                <Modal title="🚫 Cancel Invoice" onClose={closeModal}>
                    <p className="fin-confirm-text">Cancel invoice <strong>{sel.invoice_number}</strong>?</p>
                    <p className="fin-confirm-sub">Fully paid invoices cannot be cancelled. For partial payments, the balance will be written off.</p>
                    <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Keep Invoice</button>
                        <button className="fin-btn-danger" onClick={handleCancel} disabled={saving}>
                            {saving ? 'Cancelling…' : 'Yes, Cancel Invoice'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
