import React, { useState, useEffect, useCallback } from 'react';
import { discountsApi } from '../services/financeApi';

/* ─── Shared ───────────────────────────────────────────────────────────────── */
function Pill({ on }) {
    return (
        <span className={`fin-status-pill ${on ? 'fin-status-active' : 'fin-status-inactive'}`}>
            <span className="fin-status-dot" />{on ? 'Active' : 'Inactive'}
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
function Modal({ title, onClose, width, children }) {
    useEffect(() => {
        const h = e => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
        <div className="fin-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div className={`fin-modal-dialog${width === 'lg' ? ' fin-modal-lg' : ''}`}>
                <div className="fin-modal-header">
                    <h3 className="fin-modal-title">{title}</h3>
                    <button className="fin-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="fin-modal-body">{children}</div>
            </div>
        </div>
    );
}
function Field({ label, required, hint, children }) {
    return (
        <div className="fin-form-field">
            <label>{label}{required && <span className="fin-required"> *</span>}</label>
            {children}
            {hint && <span className="fin-field-hint">{hint}</span>}
        </div>
    );
}
function Alert({ type, msg, onClose }) {
    if (!msg) return null;
    return (
        <div className={`fin-alert fin-alert-${type}`}>
            <span>{msg}</span>
            <button className="fin-alert-close" onClick={onClose}>✕</button>
        </div>
    );
}
function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}
function fmtVal(d) {
    return d.discount_type === 'percentage'
        ? `${parseFloat(d.discount_value).toFixed(1)}%`
        : `₹${parseFloat(d.discount_value).toFixed(2)}`;
}

/* ─── Empty form ──────────────────────────────────────────────────────────── */
const EMPTY = {
    name: '', description: '',
    discount_type: 'percentage', discount_value: '',
    min_purchase_amount: '', min_quantity: '1',
    start_date: '', end_date: '',
    usage_limit: '', is_active: true,
};

/* ─── Page ────────────────────────────────────────────────────────────────── */
export function DiscountsPage() {
    const [rows, setRows] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, total_usage: 0 });
    const [pager, setPager] = useState({ page: 1, totalPages: 1, total: 0 });
    const [busy, setBusy] = useState(true);
    const [err, setErr] = useState('');
    const [ok, setOk] = useState('');

    const [q, setQ] = useState('');
    const [fStat, setFStat] = useState('');
    const [fType, setFType] = useState('');
    const [page, setPage] = useState(1);

    const [mode, setMode] = useState(null);
    const [sel, setSel] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState('');

    const load = useCallback(async () => {
        setBusy(true); setErr('');
        try {
            const r = await discountsApi.list({ search: q, status: fStat, type: fType, page, pageSize: 20 });
            setRows(r.items || []);
            setStats(r.stats || { total: 0, active: 0, expired: 0, total_usage: 0 });
            setPager(r.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (e) { setErr(e.message || 'Failed to load. Ensure the backend server is running.'); }
        finally { setBusy(false); }
    }, [q, fStat, fType, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (!ok) return; const t = setTimeout(() => setOk(''), 4500); return () => clearTimeout(t); }, [ok]);

    function startCreate() { setForm(EMPTY); setFormErr(''); setMode('create'); }
    function startEdit(r) {
        setSel(r);
        setForm({
            name: r.name, description: r.description || '',
            discount_type: r.discount_type, discount_value: String(r.discount_value),
            min_purchase_amount: r.min_purchase_amount || '',
            min_quantity: String(r.min_quantity || 1),
            start_date: r.start_date ? r.start_date.split('T')[0] : '',
            end_date: r.end_date ? r.end_date.split('T')[0] : '',
            usage_limit: r.usage_limit || '',
            is_active: r.is_active,
        });
        setFormErr(''); setMode('edit');
    }
    function startView(r) { setSel(r); setMode('view'); }
    function startDelete(r) { setSel(r); setFormErr(''); setMode('delete'); }
    function closeModal() { setMode(null); setSel(null); setSaving(false); setFormErr(''); }

    async function handleSave() {
        setFormErr('');
        if (!form.name.trim()) { setFormErr('Name is required.'); return; }
        if (!form.discount_value) { setFormErr('Discount value is required.'); return; }
        const val = parseFloat(form.discount_value);
        if (isNaN(val) || val <= 0) { setFormErr('Discount value must be a positive number.'); return; }
        if (form.discount_type === 'percentage' && val > 100) { setFormErr('Percentage cannot exceed 100.'); return; }

        setSaving(true);
        try {
            const body = {
                ...form,
                discount_value: val,
                min_purchase_amount: parseFloat(form.min_purchase_amount) || 0,
                min_quantity: parseInt(form.min_quantity, 10) || 1,
                usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
            };
            if (mode === 'create') { await discountsApi.create(body); setOk('Discount created.'); }
            else { await discountsApi.update(sel.id, body); setOk(`"${form.name}" updated.`); }
            closeModal(); load();
        } catch (e) { setFormErr(e.message); setSaving(false); }
    }

    async function handleDelete() {
        setSaving(true); setFormErr('');
        try {
            await discountsApi.remove(sel.id);
            setOk(`"${sel.name}" deleted.`);
            closeModal(); load();
        } catch (e) { setFormErr(e.message); setSaving(false); }
    }

    async function toggleActive(r) {
        try {
            await discountsApi.update(r.id, { is_active: !r.is_active });
            setOk(`"${r.name}" ${r.is_active ? 'deactivated' : 'activated'}.`);
            load();
        } catch (e) { setErr(e.message); }
    }

    /* ── render ─────────────────────────────────────────────────────────────── */
    return (
        <div className="fin-page">

            {/* Header */}
            <div className="fin-page-header">
                <div>
                    <h1 className="fin-page-title">Discounts</h1>
                    <p className="fin-page-subtitle">Create and manage promotional discount rules applied to invoice lines automatically.</p>
                </div>
                <button id="btn-new-discount" className="fin-btn-primary" onClick={startCreate}>
                    + New Discount
                </button>
            </div>

            <Alert type="error" msg={err} onClose={() => setErr('')} />
            <Alert type="success" msg={ok} onClose={() => setOk('')} />

            {/* Stats */}
            <div className="fin-stats-grid fin-stats-4">
                <StatCard label="Total Discounts" value={stats.total} />
                <StatCard label="Active" value={stats.active} accent="blue" />
                <StatCard label="Expired / Off" value={stats.expired} />
                <StatCard label="Total Usage" value={stats.total_usage} accent="emerald" />
            </div>

            {/* Toolbar */}
            <div className="fin-toolbar">
                <div className="fin-search-wrap">
                    <span className="fin-search-icon">🔍</span>
                    <input className="fin-search-input" placeholder="Search discounts…"
                        value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
                    {q && <button className="fin-search-clear" onClick={() => { setQ(''); setPage(1); }}>✕</button>}
                </div>
                <select className="fin-select" value={fStat} onChange={e => { setFStat(e.target.value); setPage(1); }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select className="fin-select" value={fType} onChange={e => { setFType(e.target.value); setPage(1); }}>
                    <option value="">All Types</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                </select>
                <button className="fin-btn-refresh" title="Refresh" onClick={load}>↻</button>
            </div>

            {/* Table */}
            <div className="fin-table-card">
                {busy ? (
                    <div className="fin-empty"><div className="fin-spinner" /><p>Loading…</p></div>
                ) : rows.length === 0 ? (
                    <div className="fin-empty">
                        <div className="fin-empty-icon">🏷️</div>
                        <h3>{q || fStat || fType ? 'No results match your filters' : 'No discounts yet'}</h3>
                        <p>{q || fStat || fType ? 'Adjust filters above.' : 'Click "New Discount" to create your first rule.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="fin-table-wrap">
                            <table className="fin-table">
                                <thead>
                                    <tr>
                                        <th>Discount Name</th>
                                        <th>Type</th>
                                        <th>Value</th>
                                        <th>Valid Period</th>
                                        <th>Usage</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <button className="fin-row-link" onClick={() => startView(r)}>{r.name}</button>
                                                {r.description && <div className="fin-cell-sub">{r.description.slice(0, 55)}{r.description.length > 55 ? '…' : ''}</div>}
                                            </td>
                                            <td>
                                                <span className={`fin-badge ${r.discount_type === 'percentage' ? 'fin-badge-blue' : 'fin-badge-green'}`}>
                                                    {r.discount_type === 'percentage' ? 'Percentage' : 'Fixed ₹'}
                                                </span>
                                            </td>
                                            <td><strong>{fmtVal(r)}</strong></td>
                                            <td className="fin-cell-muted">
                                                {r.start_date || r.end_date
                                                    ? `${fmtDate(r.start_date)} → ${fmtDate(r.end_date)}`
                                                    : 'No limit'}
                                            </td>
                                            <td>
                                                {r.usage_count ?? 0}
                                                {r.usage_limit ? <span className="fin-cell-muted"> / {r.usage_limit}</span> : <span className="fin-cell-muted"> (unlimited)</span>}
                                            </td>
                                            <td><Pill on={r.is_active} /></td>
                                            <td>
                                                <div className="fin-row-actions">
                                                    <button className="fin-action-btn fin-action-edit" onClick={() => startEdit(r)}>Edit</button>
                                                    <button className="fin-action-btn fin-action-toggle" onClick={() => toggleActive(r)}>
                                                        {r.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button className="fin-action-btn fin-action-delete" onClick={() => startDelete(r)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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

            {/* ══ CREATE / EDIT MODAL ══ */}
            {(mode === 'create' || mode === 'edit') && (
                <Modal title={mode === 'create' ? '➕ New Discount' : `✏️ Edit — ${sel?.name}`} onClose={closeModal} width="lg">
                    <div className="fin-form fin-form-grid">

                        <Field label="Discount Name" required>
                            <input autoFocus value={form.name} placeholder="e.g. Summer Sale 20%, New Customer ₹500"
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </Field>

                        <Field label="Discount Type" required>
                            <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </Field>

                        <Field label={form.discount_type === 'percentage' ? 'Percentage (0–100)' : 'Fixed Amount (₹)'} required>
                            <input type="number" min="0" step="0.01"
                                value={form.discount_value}
                                placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                                onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} />
                        </Field>

                        <Field label="Min Purchase Amount (₹)" hint="0 = no minimum">
                            <input type="number" min="0" step="0.01" value={form.min_purchase_amount}
                                placeholder="0" onChange={e => setForm(f => ({ ...f, min_purchase_amount: e.target.value }))} />
                        </Field>

                        <Field label="Min Quantity" hint="Minimum items in the order">
                            <input type="number" min="1" step="1" value={form.min_quantity}
                                placeholder="1" onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))} />
                        </Field>

                        <Field label="Usage Limit" hint="Leave blank for unlimited uses">
                            <input type="number" min="1" value={form.usage_limit}
                                placeholder="Unlimited" onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} />
                        </Field>

                        <Field label="Valid From">
                            <input type="date" value={form.start_date}
                                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                        </Field>

                        <Field label="Valid Until">
                            <input type="date" value={form.end_date}
                                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                        </Field>

                        <div className="fin-form-field fin-full">
                            <label>Description</label>
                            <textarea rows={2} value={form.description} placeholder="Internal notes about this discount"
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>

                        <div className="fin-form-toggle fin-full">
                            <label className="fin-toggle-label">
                                <input type="checkbox" checked={form.is_active}
                                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                <span className="fin-toggle-slider" />
                                <span className="fin-toggle-text">{form.is_active ? '✅ Active — eligible for automatic application' : '⬜ Inactive'}</span>
                            </label>
                        </div>

                        {formErr && <div className="fin-alert fin-alert-error fin-full"><span>{formErr}</span><button className="fin-alert-close" onClick={() => setFormErr('')}>✕</button></div>}
                    </div>
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Cancel</button>
                        <button className="fin-btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : mode === 'create' ? 'Create Discount' : 'Save Changes'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ══ VIEW MODAL ══ */}
            {mode === 'view' && sel && (
                <Modal title={`🏷️ ${sel.name}`} onClose={closeModal}>
                    <div className="fin-detail-grid">
                        <div className="fin-detail-item"><span>Type</span><strong>{sel.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</strong></div>
                        <div className="fin-detail-item"><span>Value</span><strong>{fmtVal(sel)}</strong></div>
                        <div className="fin-detail-item"><span>Min Purchase</span><strong>₹{sel.min_purchase_amount || 0}</strong></div>
                        <div className="fin-detail-item"><span>Min Quantity</span><strong>{sel.min_quantity || 1}</strong></div>
                        <div className="fin-detail-item"><span>Usage</span><strong>{sel.usage_count ?? 0} / {sel.usage_limit ?? '∞'}</strong></div>
                        <div className="fin-detail-item"><span>Status</span><Pill on={sel.is_active} /></div>
                        <div className="fin-detail-item"><span>Valid From</span><strong>{fmtDate(sel.start_date)}</strong></div>
                        <div className="fin-detail-item"><span>Valid Until</span><strong>{fmtDate(sel.end_date)}</strong></div>
                        {sel.description && <div className="fin-detail-item fin-full"><span>Description</span><p>{sel.description}</p></div>}
                    </div>
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Close</button>
                        <button className="fin-btn-primary" onClick={() => startEdit(sel)}>✏️ Edit</button>
                    </div>
                </Modal>
            )}

            {/* ══ DELETE MODAL ══ */}
            {mode === 'delete' && sel && (
                <Modal title="🗑️ Delete Discount" onClose={closeModal}>
                    <p className="fin-confirm-text">Delete <strong>{sel.name}</strong>?</p>
                    <p className="fin-confirm-sub">Discounts already applied to invoice lines cannot be deleted. Deactivate it instead if it's still in use.</p>
                    {formErr && <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />}
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Cancel</button>
                        <button className="fin-btn-danger" onClick={handleDelete} disabled={saving}>
                            {saving ? 'Deleting…' : 'Yes, Delete'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
