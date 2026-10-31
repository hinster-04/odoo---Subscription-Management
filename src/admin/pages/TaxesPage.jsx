import React, { useState, useEffect, useCallback } from 'react';
import { taxesApi } from '../services/financeApi';

/* ─── Shared tiny components ──────────────────────────────────────────────── */
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

function Modal({ title, onClose, children }) {
    useEffect(() => {
        const h = e => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
        <div className="fin-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div className="fin-modal-dialog">
                <div className="fin-modal-header">
                    <h3 className="fin-modal-title">{title}</h3>
                    <button className="fin-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="fin-modal-body">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div className="fin-form-field">
            <label>{label}{required && <span className="fin-required"> *</span>}</label>
            {children}
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
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Empty form ──────────────────────────────────────────────────────────── */
const EMPTY = { name: '', percentage: '', description: '', is_active: true };

/* ─── Main page ───────────────────────────────────────────────────────────── */
export function TaxesPage() {
    const [rows, setRows] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [pager, setPager] = useState({ page: 1, totalPages: 1, total: 0 });
    const [busy, setBusy] = useState(true);
    const [err, setErr] = useState('');
    const [ok, setOk] = useState('');

    // filters
    const [q, setQ] = useState('');
    const [fStat, setFStat] = useState('');
    const [fSort, setFSort] = useState('created_at');
    const [fDir, setFDir] = useState('desc');
    const [page, setPage] = useState(1);

    // modal
    const [mode, setMode] = useState(null); // create | edit | view | delete
    const [sel, setSel] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState('');

    /* load */
    const load = useCallback(async () => {
        setBusy(true); setErr('');
        try {
            const r = await taxesApi.list({ search: q, status: fStat, sortBy: fSort, sortDir: fDir, page, pageSize: 20 });
            setRows(r.items || []);
            setStats(r.stats || { total: 0, active: 0, inactive: 0 });
            setPager(r.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (e) { setErr(e.message || 'Failed to load tax rates. Check that the backend server is running.'); }
        finally { setBusy(false); }
    }, [q, fStat, fSort, fDir, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (!ok) return; const t = setTimeout(() => setOk(''), 4500); return () => clearTimeout(t); }, [ok]);

    /* open helpers */
    function startCreate() { setForm(EMPTY); setFormErr(''); setMode('create'); }
    function startEdit(r) {
        setSel(r);
        setForm({ name: r.name, percentage: String(r.percentage), description: r.description || '', is_active: r.is_active });
        setFormErr('');
        setMode('edit');
    }
    function startView(r) { setSel(r); setMode('view'); }
    function startDelete(r) { setSel(r); setMode('delete'); setFormErr(''); }
    function closeModal() { setMode(null); setSel(null); setSaving(false); setFormErr(''); }

    /* save */
    async function handleSave() {
        setFormErr('');
        if (!form.name.trim()) { setFormErr('Tax name is required.'); return; }
        if (form.percentage === '') { setFormErr('Percentage is required.'); return; }
        const pct = parseFloat(form.percentage);
        if (isNaN(pct) || pct < 0 || pct > 100) { setFormErr('Percentage must be between 0 and 100.'); return; }

        setSaving(true);
        try {
            if (mode === 'create') {
                await taxesApi.create({ ...form, percentage: pct });
                setOk('Tax rate created successfully.');
            } else {
                await taxesApi.update(sel.id, { ...form, percentage: pct });
                setOk(`"${form.name}" updated successfully.`);
            }
            closeModal(); load();
        } catch (e) { setFormErr(e.message); setSaving(false); }
    }

    /* delete */
    async function handleDelete() {
        setSaving(true); setFormErr('');
        try {
            await taxesApi.remove(sel.id);
            setOk(`"${sel.name}" deleted.`);
            closeModal(); load();
        } catch (e) { setFormErr(e.message); setSaving(false); }
    }

    /* toggle active */
    async function toggleActive(r) {
        try {
            await taxesApi.update(r.id, { is_active: !r.is_active });
            setOk(`"${r.name}" ${r.is_active ? 'deactivated' : 'activated'}.`);
            load();
        } catch (e) { setErr(e.message); }
    }

    /* ── render ─────────────────────────────────────────────────────────────── */
    return (
        <div className="fin-page">

            {/* ── Header ── */}
            <div className="fin-page-header">
                <div>
                    <h1 className="fin-page-title">Tax Rates</h1>
                    <p className="fin-page-subtitle">Define tax rules applied to invoice lines. Active taxes are applied automatically during invoicing.</p>
                </div>
                <button id="btn-new-tax" className="fin-btn-primary" onClick={startCreate}>
                    + New Tax Rate
                </button>
            </div>

            <Alert type="error" msg={err} onClose={() => setErr('')} />
            <Alert type="success" msg={ok} onClose={() => setOk('')} />

            {/* ── Stats ── */}
            <div className="fin-stats-grid">
                <StatCard label="Total Tax Rules" value={stats.total} />
                <StatCard label="Active Rules" value={stats.active} accent="blue" />
                <StatCard label="Inactive Rules" value={stats.inactive} />
            </div>

            {/* ── Toolbar ── */}
            <div className="fin-toolbar">
                <div className="fin-search-wrap">
                    <span className="fin-search-icon">🔍</span>
                    <input className="fin-search-input" placeholder="Search by name or description…"
                        value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
                    {q && <button className="fin-search-clear" onClick={() => { setQ(''); setPage(1); }}>✕</button>}
                </div>
                <select className="fin-select" value={fStat} onChange={e => { setFStat(e.target.value); setPage(1); }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select className="fin-select" value={fSort} onChange={e => setFSort(e.target.value)}>
                    <option value="created_at">Date Added</option>
                    <option value="name">Name A–Z</option>
                    <option value="percentage">Percentage</option>
                </select>
                <button className="fin-btn-icon" title="Toggle sort direction" onClick={() => setFDir(d => d === 'asc' ? 'desc' : 'asc')}>
                    {fDir === 'asc' ? '↑' : '↓'}
                </button>
                <button className="fin-btn-refresh" title="Refresh" onClick={load}>↻</button>
            </div>

            {/* ── Table card ── */}
            <div className="fin-table-card">
                {busy ? (
                    <div className="fin-empty"><div className="fin-spinner" /><p>Loading…</p></div>
                ) : rows.length === 0 ? (
                    <div className="fin-empty">
                        <div className="fin-empty-icon">📋</div>
                        <h3>{q || fStat ? 'No results match your filters' : 'No tax rates yet'}</h3>
                        <p>{q || fStat ? 'Adjust the search or filters above.' : 'Click "New Tax Rate" above to add your first rule.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="fin-table-wrap">
                            <table className="fin-table">
                                <thead>
                                    <tr>
                                        <th>Tax Name</th>
                                        <th>Rate (%)</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <button className="fin-row-link" onClick={() => startView(r)}>{r.name}</button>
                                            </td>
                                            <td><strong>{parseFloat(r.percentage).toFixed(2)}%</strong></td>
                                            <td className="fin-cell-muted fin-cell-truncate">{r.description || '—'}</td>
                                            <td><Pill on={r.is_active} /></td>
                                            <td className="fin-cell-muted">{fmtDate(r.created_at)}</td>
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
                        {/* Pagination */}
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
                <Modal title={mode === 'create' ? '➕ New Tax Rate' : `✏️ Edit — ${sel?.name}`} onClose={closeModal}>
                    <div className="fin-form">
                        <Field label="Tax Name" required>
                            <input id="tax-name" autoFocus value={form.name}
                                placeholder="e.g. GST 18%, VAT 5%"
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </Field>
                        <Field label="Tax Percentage (%)" required>
                            <input id="tax-pct" type="number" min="0" max="100" step="0.001"
                                value={form.percentage} placeholder="e.g. 18"
                                onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))} />
                        </Field>
                        <Field label="Description">
                            <textarea rows={3} value={form.description} placeholder="Optional notes about when this tax applies"
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </Field>
                        <div className="fin-form-toggle">
                            <label className="fin-toggle-label">
                                <input type="checkbox" checked={form.is_active}
                                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                <span className="fin-toggle-slider" />
                                <span className="fin-toggle-text">{form.is_active ? '✅ Active — will be applied to new invoices' : '⬜ Inactive — will not be applied'}</span>
                            </label>
                        </div>
                        <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />
                    </div>
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Cancel</button>
                        <button className="fin-btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : mode === 'create' ? 'Create Tax Rate' : 'Save Changes'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ══ VIEW MODAL ══ */}
            {mode === 'view' && sel && (
                <Modal title={`📋 ${sel.name}`} onClose={closeModal}>
                    <div className="fin-detail-grid">
                        <div className="fin-detail-item"><span>Name</span><strong>{sel.name}</strong></div>
                        <div className="fin-detail-item"><span>Percentage</span><strong>{parseFloat(sel.percentage).toFixed(3)}%</strong></div>
                        <div className="fin-detail-item"><span>Status</span><Pill on={sel.is_active} /></div>
                        <div className="fin-detail-item"><span>Created</span><strong>{fmtDate(sel.created_at)}</strong></div>
                        <div className="fin-detail-item"><span>Last Updated</span><strong>{fmtDate(sel.updated_at)}</strong></div>
                        <div className="fin-detail-item fin-full"><span>Description</span><p>{sel.description || '(none)'}</p></div>
                    </div>
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Close</button>
                        <button className="fin-btn-primary" onClick={() => startEdit(sel)}>✏️ Edit</button>
                    </div>
                </Modal>
            )}

            {/* ══ DELETE MODAL ══ */}
            {mode === 'delete' && sel && (
                <Modal title="🗑️ Delete Tax Rate" onClose={closeModal}>
                    <p className="fin-confirm-text">Delete <strong>{sel.name} ({parseFloat(sel.percentage).toFixed(2)}%)</strong>?</p>
                    <p className="fin-confirm-sub">
                        Tax rates that are already used on invoice lines cannot be deleted — you'll see an error if that's the case.
                        To stop using a tax without deleting it, deactivate it instead.
                    </p>
                    <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />
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
