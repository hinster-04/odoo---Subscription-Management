import React, { useState, useEffect, useCallback, useRef } from 'react';
import { paymentsApi, financeHelpers } from '../services/financeApi';

/* ─── Shared ───────────────────────────────────────────────────────────────── */
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
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function fmtMoney(n) { return n == null ? '—' : `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; }

const METHODS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'other', label: 'Other' },
];
const methodLabel = v => METHODS.find(m => m.value === v)?.label || v;

const EMPTY_FORM = {
    invoice_id: '', invoice_number: '', customer_name: '', balance_due: '',
    payment_method: 'bank_transfer',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
};

/* ─── Main page ────────────────────────────────────────────────────────────── */
export function PaymentsPage() {
    const [rows, setRows] = useState([]);
    const [stats, setStats] = useState({});
    const [pager, setPager] = useState({ page: 1, totalPages: 1, total: 0 });
    const [busy, setBusy] = useState(true);
    const [err, setErr] = useState('');
    const [ok, setOk] = useState('');

    const [q, setQ] = useState('');
    const [fMethod, setFMethod] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);

    const [mode, setMode] = useState(null); // record | detail
    const [selPay, setSelPay] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState('');

    // invoice autocomplete inside record form
    const [invQ, setInvQ] = useState('');
    const [invList, setInvList] = useState([]);
    const [invOpen, setInvOpen] = useState(false);
    const invRef = useRef();

    const load = useCallback(async () => {
        setBusy(true); setErr('');
        try {
            const r = await paymentsApi.list({
                search: q, payment_method: fMethod,
                date_from: dateFrom, date_to: dateTo,
                sortBy: 'payment_date', sortDir, page, pageSize: 20,
            });
            setRows(r.items || []);
            setStats(r.stats || {});
            setPager(r.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (e) { setErr(e.message || 'Failed to load. Ensure the backend server is running.'); }
        finally { setBusy(false); }
    }, [q, fMethod, dateFrom, dateTo, sortDir, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (!ok) return; const t = setTimeout(() => setOk(''), 5000); return () => clearTimeout(t); }, [ok]);

    // Invoice search debounce
    useEffect(() => {
        if (!invQ || invQ.length < 2) { setInvList([]); setInvOpen(false); return; }
        const t = setTimeout(async () => {
            try { const r = await financeHelpers.getOutstandingInvoices(invQ); setInvList(r.data || []); setInvOpen(true); }
            catch { setInvList([]); }
        }, 320);
        return () => clearTimeout(t);
    }, [invQ]);

    // Click outside
    useEffect(() => {
        const h = e => { if (invRef.current && !invRef.current.contains(e.target)) setInvOpen(false); };
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
    }, []);

    function selectInvoice(inv) {
        const bal = parseFloat(inv.balance_due);
        setForm(f => ({
            ...f,
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
            customer_name: inv.business_name || inv.customer_name || '',
            balance_due: bal,
            amount: bal.toFixed(2),
        }));
        setInvQ(inv.invoice_number);
        setInvOpen(false);
    }

    function openRecord() { setForm(EMPTY_FORM); setInvQ(''); setInvList([]); setFormErr(''); setMode('record'); }
    async function openDetail(p) {
        try { const r = await paymentsApi.getById(p.id); setSelPay(r.data); setMode('detail'); }
        catch (e) { setErr(e.message); }
    }
    function closeModal() { setMode(null); setSelPay(null); setSaving(false); setFormErr(''); }

    async function handleRecord() {
        setFormErr('');
        if (!form.invoice_id) { setFormErr('Please select an invoice from the search above.'); return; }
        if (!form.amount || parseFloat(form.amount) <= 0) { setFormErr('Amount must be greater than ₹0.'); return; }
        if (parseFloat(form.amount) > parseFloat(form.balance_due) + 0.01) {
            setFormErr(`Amount exceeds outstanding balance of ${fmtMoney(form.balance_due)}.`); return;
        }
        if (!form.payment_date) { setFormErr('Payment date is required.'); return; }

        setSaving(true);
        try {
            const r = await paymentsApi.record({
                invoice_id: form.invoice_id,
                payment_method: form.payment_method,
                amount: parseFloat(form.amount),
                payment_date: form.payment_date,
                notes: form.notes || null,
            });
            const fullPaid = r.data.new_invoice_status === 'paid';
            setOk(`Payment ${r.data.payment_reference} recorded.${fullPaid ? ' 🎉 Invoice is now fully paid!' : ''}`);
            closeModal(); load();
        } catch (e) { setFormErr(e.message); setSaving(false); }
    }

    /* ─── render ──────────────────────────────────────────────────────────────── */
    return (
        <div className="fin-page">

            {/* Header */}
            <div className="fin-page-header">
                <div>
                    <h1 className="fin-page-title">Payments</h1>
                    <p className="fin-page-subtitle">Record customer payments against invoices. Partial payments are supported. Invoices auto-close once fully paid.</p>
                </div>
                <button id="btn-record-payment" className="fin-btn-primary" onClick={openRecord}>
                    + Record Payment
                </button>
            </div>

            <Alert type="error" msg={err} onClose={() => setErr('')} />
            <Alert type="success" msg={ok} onClose={() => setOk('')} />

            {/* Stats */}
            <div className="fin-stats-grid fin-stats-4">
                <StatCard label="Total Payments" value={stats.total_payments} />
                <StatCard label="Total Received" value={fmtMoney(stats.total_received)} accent="emerald" />
                <StatCard label="This Month" value={stats.payments_this_month} accent="blue" />
                <StatCard label="Outstanding Balance" value={fmtMoney(stats.outstanding_amount)} accent="amber" />
            </div>

            {/* Toolbar */}
            <div className="fin-toolbar fin-toolbar-wrap">
                <div className="fin-search-wrap">
                    <span className="fin-search-icon">🔍</span>
                    <input className="fin-search-input" placeholder="Reference, invoice #, customer…"
                        value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
                    {q && <button className="fin-search-clear" onClick={() => { setQ(''); setPage(1); }}>✕</button>}
                </div>
                <select className="fin-select" value={fMethod} onChange={e => { setFMethod(e.target.value); setPage(1); }}>
                    <option value="">All Methods</option>
                    {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input type="date" className="fin-select" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From" />
                <input type="date" className="fin-select" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} title="To" />
                <button className="fin-btn-icon" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? '↑' : '↓'}</button>
                <button className="fin-btn-refresh" onClick={load}>↻</button>
            </div>

            {/* Table */}
            <div className="fin-table-card">
                {busy ? (
                    <div className="fin-empty"><div className="fin-spinner" /><p>Loading…</p></div>
                ) : rows.length === 0 ? (
                    <div className="fin-empty">
                        <div className="fin-empty-icon">💳</div>
                        <h3>{q || fMethod ? 'No payments match your filters' : 'No payments recorded yet'}</h3>
                        <p>{q || fMethod ? 'Adjust filters.' : 'Click "Record Payment" to register the first payment.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="fin-table-wrap">
                            <table className="fin-table">
                                <thead>
                                    <tr><th>Reference</th><th>Customer</th><th>Invoice</th><th>Method</th><th>Amount</th><th>Date</th><th>Notes</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {rows.map(p => (
                                        <tr key={p.id}>
                                            <td><span className="fin-mono">{p.payment_reference}</span></td>
                                            <td>
                                                <div className="fin-cell-name">{p.customer_name}</div>
                                                {p.business_name && <div className="fin-cell-sub">{p.business_name}</div>}
                                            </td>
                                            <td><span className="fin-mono">{p.invoice_number}</span></td>
                                            <td><span className="fin-badge fin-badge-blue">{methodLabel(p.payment_method)}</span></td>
                                            <td><strong>{fmtMoney(p.amount)}</strong></td>
                                            <td className="fin-cell-muted">{fmtDate(p.payment_date)}</td>
                                            <td className="fin-cell-muted fin-cell-truncate">{p.notes || '—'}</td>
                                            <td>
                                                <button className="fin-action-btn fin-action-edit" onClick={() => openDetail(p)}>View</button>
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

            {/* ══ RECORD PAYMENT MODAL ══ */}
            {mode === 'record' && (
                <Modal title="💳 Record Payment" onClose={closeModal} width="lg">
                    <div className="fin-form fin-form-grid">

                        {/* Invoice search */}
                        <div className="fin-form-field fin-full" ref={invRef} style={{ position: 'relative' }}>
                            <label>Invoice <span className="fin-required">*</span></label>
                            <div className="fin-autocomplete">
                                <input
                                    autoFocus
                                    placeholder="Type invoice # or customer name to search outstanding invoices…"
                                    value={invQ}
                                    autoComplete="off"
                                    onChange={e => {
                                        setInvQ(e.target.value);
                                        setForm(f => ({ ...f, invoice_id: '', invoice_number: '', customer_name: '', balance_due: '' }));
                                    }}
                                />
                                {invOpen && invList.length > 0 && (
                                    <ul className="fin-autocomplete-list">
                                        {invList.map(inv => (
                                            <li key={inv.id} onClick={() => selectInvoice(inv)}>
                                                <strong>{inv.invoice_number}</strong>
                                                <span className="fin-cell-muted"> · {inv.business_name || inv.customer_name}</span>
                                                <span style={{ marginLeft: 8, color: '#d97706', fontWeight: 600 }}>
                                                    Balance: {fmtMoney(inv.balance_due)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {!form.invoice_id && invQ.length > 1 && invList.length === 0 && (
                                <span className="fin-field-hint">No outstanding invoices found. Only Draft/Confirmed invoices with a balance appear here.</span>
                            )}
                            {form.invoice_id && (
                                <div className="fin-selected-inv-info">
                                    ✅ <strong>{form.invoice_number}</strong> — {form.customer_name}
                                    &nbsp;|&nbsp;Outstanding balance: <strong>{fmtMoney(form.balance_due)}</strong>
                                </div>
                            )}
                        </div>

                        <div className="fin-form-field">
                            <label>Payment Method <span className="fin-required">*</span></label>
                            <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>

                        <div className="fin-form-field">
                            <label>Amount (₹) <span className="fin-required">*</span></label>
                            <input type="number" min="0.01" step="0.01"
                                value={form.amount}
                                placeholder={form.balance_due ? `Max: ${fmtMoney(form.balance_due)}` : 'Enter amount'}
                                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                            {form.balance_due && (
                                <span className="fin-field-hint">
                                    Outstanding: {fmtMoney(form.balance_due)}
                                    &nbsp;·&nbsp;
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, padding: 0 }}
                                        onClick={() => setForm(f => ({ ...f, amount: parseFloat(form.balance_due).toFixed(2) }))}>
                                        Pay full balance
                                    </button>
                                </span>
                            )}
                        </div>

                        <div className="fin-form-field">
                            <label>Payment Date <span className="fin-required">*</span></label>
                            <input type="date" value={form.payment_date}
                                onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
                        </div>

                        <div className="fin-form-field fin-full">
                            <label>Notes / Reference</label>
                            <textarea rows={2} value={form.notes}
                                placeholder="e.g. UTR: XXXXX, Cheque #12345, Transaction ID…"
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>

                        {formErr && <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />}
                    </div>
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Cancel</button>
                        <button className="fin-btn-primary" onClick={handleRecord} disabled={saving}>
                            {saving ? 'Recording…' : 'Record Payment'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ══ PAYMENT DETAIL ══ */}
            {mode === 'detail' && selPay && (
                <Modal title={`💳 Payment — ${selPay.payment_reference}`} onClose={closeModal}>
                    <div className="fin-detail-grid">
                        <div className="fin-detail-item"><span>Reference</span><strong className="fin-mono">{selPay.payment_reference}</strong></div>
                        <div className="fin-detail-item"><span>Invoice</span><strong className="fin-mono">{selPay.invoice_number}</strong></div>
                        <div className="fin-detail-item"><span>Customer</span><strong>{selPay.customer_name}{selPay.business_name ? ` (${selPay.business_name})` : ''}</strong></div>
                        <div className="fin-detail-item"><span>Amount Paid</span><strong>{fmtMoney(selPay.amount)}</strong></div>
                        <div className="fin-detail-item"><span>Payment Method</span><span className="fin-badge fin-badge-blue">{methodLabel(selPay.payment_method)}</span></div>
                        <div className="fin-detail-item"><span>Payment Date</span><strong>{fmtDate(selPay.payment_date)}</strong></div>
                        <div className="fin-detail-item"><span>Invoice Total</span><strong>{fmtMoney(selPay.invoice_total)}</strong></div>
                        <div className="fin-detail-item"><span>Invoice Status</span><strong style={{ textTransform: 'capitalize' }}>{selPay.invoice_status}</strong></div>
                        {selPay.notes && <div className="fin-detail-item fin-full"><span>Notes</span><p>{selPay.notes}</p></div>}
                    </div>
                    <Alert type="error" msg={formErr} onClose={() => setFormErr('')} />
                    <div className="fin-modal-footer">
                        <button className="fin-btn-ghost" onClick={closeModal}>Close</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
