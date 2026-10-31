import React, { useState, useEffect, useCallback } from 'react';
import { AdminIcon } from '../AdminIcons';
import { quotationsApi, quotationTemplatesApi } from '../services/salesApi';
import { peopleApi } from '../services/peopleApi';

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let badgeClass = 'badge-neutral';
  if (s === 'accepted' || s === 'converted' || s === 'active') badgeClass = 'badge-success';
  else if (s === 'sent') badgeClass = 'badge-blue';
  else if (s === 'rejected') badgeClass = 'badge-danger';
  else if (s === 'expired') badgeClass = 'badge-warning';

  return (
    <span className={`admin-badge ${badgeClass} capitalize`}>
      {s}
    </span>
  );
}

// ─── All Quotations Tab ───────────────────────────────────────────────────────
function AllQuotationsTab({ onNavigate, setSuccessToast, setError }) {
  const [quotations, setQuotations] = useState([]);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, summary: {} });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [modalMode, setModalMode] = useState(null); // 'view' | 'create' | 'edit' | 'delete'
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationsApi.getQuotations({
        search,
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize
      });
      setQuotations(res.data || []);
      setMeta(res.meta || { total: 0, total_pages: 1, summary: {} });
    } catch (err) {
      setError(err.message || 'Failed to fetch quotations from database.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, currentPage, pageSize, setError]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  async function handleSend(id) {
    try {
      await quotationsApi.updateStatus(id, 'sent');
      setSuccessToast('Quotation marked as Sent.');
      fetchQuotations();
    } catch (err) {
      setError(err.message || 'Failed to update quotation status.');
    }
  }

  async function handleConvert(id) {
    if (!confirm('Convert this quotation to an active client subscription?')) return;
    try {
      const res = await quotationsApi.convertToSubscription(id);
      setSuccessToast(`Quotation converted to Subscription ${res.data.subscription_number}!`);
      fetchQuotations();
      if (onNavigate) onNavigate('/admin/subscriptions');
    } catch (err) {
      setError(err.message || 'Failed to convert quotation.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await quotationsApi.deleteQuotation(deleteTarget.id);
      setSuccessToast(`Quotation ${deleteTarget.quotation_number} deleted successfully.`);
      setDeleteTarget(null);
      setModalMode(null);
      fetchQuotations();
    } catch (err) {
      setError(err.message || 'Failed to delete quotation.');
    }
  }

  const summary = meta.summary || {};

  return (
    <>
      {/* Metrics Row */}
      <div className="products-metrics-grid grid-4-cols">
        <div className="metric-card">
          <div className="metric-label">Total Quotations</div>
          <div className="metric-value">{summary.total_quotations ?? meta.total}</div>
          <div className="metric-meta">Client proposals created</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Draft Proposals</div>
          <div className="metric-value text-muted">{summary.draft_count ?? 0}</div>
          <div className="metric-meta">Pending sales team review</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Sent to Clients</div>
          <div className="metric-value text-blue">{summary.sent_count ?? 0}</div>
          <div className="metric-meta">Active quotes awaiting acceptance</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Accepted / Converted</div>
          <div className="metric-value text-emerald">
            {(parseInt(summary.accepted_count, 10) || 0) + (parseInt(summary.converted_count, 10) || 0)}
          </div>
          <div className="metric-meta text-emerald">Ready or converted to active contract</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="products-filter-toolbar">
        <div className="search-input-box">
          <span className="search-icon"><AdminIcon name="search" size={16} /></span>
          <input
            type="text"
            placeholder="Search by quotation number, customer name, business..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="product-search-field"
          />
          {search && (
            <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="filters-row">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>

          <select
            className="filter-select"
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split(':');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="created_at:desc">Newest Added</option>
            <option value="created_at:asc">Oldest Added</option>
            <option value="quotation_number:desc">Quote # (Desc)</option>
            <option value="total_amount:desc">Amount: High to Low</option>
            <option value="total_amount:asc">Amount: Low to High</option>
            <option value="valid_until:asc">Expiry Soonest</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="loading-spinner" />
            <p>Loading quotations from Neon PostgreSQL database...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">
              <AdminIcon name="quotations" size={48} />
            </div>
            <h3>No quotations found</h3>
            <p>No quotation records matched your search or filter settings.</p>
            {(search || statusFilter !== 'all') && (
              <div className="empty-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="products-data-table">
              <thead>
                <tr>
                  <th>Quotation No.</th>
                  <th>Customer</th>
                  <th>Quotation Date</th>
                  <th>Valid Until</th>
                  <th style={{ textAlign: 'center' }}>Items</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => {
                  const customerName = [q.customer_first_name, q.customer_last_name].filter(Boolean).join(' ') || q.business_name || 'Customer';
                  return (
                    <tr key={q.id}>
                      <td className="product-cell-name">
                        <span
                          className="product-name-link font-mono font-semibold"
                          onClick={() => {
                            setSelectedQuoteId(q.id);
                            setModalMode('view');
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedQuoteId(q.id)}
                        >
                          {q.quotation_number}
                        </span>
                      </td>

                      <td>
                        <div className="customer-avatar-name">
                          <div className="customer-initials-badge">
                            {(customerName[0] || 'C').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-navy">{customerName}</div>
                            {q.business_name && customerName !== q.business_name && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.business_name}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{q.quotation_date}</td>
                      <td>{q.valid_until}</td>
                      <td style={{ textAlign: 'center' }}>{q.item_count}</td>
                      <td>{formatCurrency(q.subtotal)}</td>
                      <td>{formatCurrency(q.tax_amount)}</td>
                      <td className="font-bold text-navy">{formatCurrency(q.total_amount)}</td>
                      <td><StatusBadge status={q.status} /></td>

                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="action-btn-icon"
                            title="View quote details"
                            onClick={() => {
                              setSelectedQuoteId(q.id);
                              setModalMode('view');
                            }}
                          >
                            <AdminIcon name="customers" size={15} />
                          </button>

                          {q.status !== 'converted' && (
                            <button
                              type="button"
                              className="action-btn-icon"
                              title="Edit quotation"
                              onClick={() => {
                                setSelectedQuoteId(q.id);
                                setModalMode('edit');
                              }}
                            >
                              <AdminIcon name="edit" size={15} />
                            </button>
                          )}

                          {q.status === 'draft' && (
                            <button
                              type="button"
                              className="action-btn-icon text-blue"
                              title="Send to customer"
                              onClick={() => handleSend(q.id)}
                            >
                              <AdminIcon name="plans" size={15} />
                            </button>
                          )}

                          {q.status === 'accepted' && (
                            <button
                              type="button"
                              className="action-btn-icon text-emerald"
                              title="Convert to Subscription"
                              onClick={() => handleConvert(q.id)}
                            >
                              <AdminIcon name="subscriptions" size={15} />
                            </button>
                          )}

                          {q.status !== 'converted' && (
                            <button
                              type="button"
                              className="action-btn-icon text-danger"
                              title="Delete quotation"
                              onClick={() => {
                                setDeleteTarget(q);
                                setModalMode('delete');
                              }}
                            >
                              <AdminIcon name="trash" size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.total_pages > 1 && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing {(meta.page - 1) * meta.limit + 1} to{' '}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} quotations
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>

              <div className="page-numbers">
                {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === meta.total_pages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Quotation Modal */}
      {modalMode === 'view' && selectedQuoteId && (
        <QuotationViewModal
          quotationId={selectedQuoteId}
          onClose={() => setModalMode(null)}
          onRefresh={fetchQuotations}
          onNavigate={onNavigate}
        />
      )}

      {/* Create / Edit Quotation Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <QuotationFormModal
          quotationId={modalMode === 'edit' ? selectedQuoteId : null}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            setModalMode(null);
            fetchQuotations();
            setSuccessToast(modalMode === 'edit' ? 'Quotation updated successfully.' : 'Quotation created successfully.');
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && deleteTarget && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setModalMode(null)}
        >
          <div className="admin-modal-card modal-sm">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2 className="modal-title">Delete Quotation</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className="modal-form-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to permanently delete quotation <strong>"{deleteTarget.quotation_number}"</strong>?
                This action cannot be undone.
              </p>

              <div className="modal-form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="button" className="btn-danger-action" onClick={handleDelete}>
                  Delete Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Quotation View Modal ─────────────────────────────────────────────────────
function QuotationViewModal({ quotationId, onClose, onRefresh, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await quotationsApi.getQuotationById(quotationId);
        setData(res.data);
      } catch (err) {
        alert(err.message || 'Failed to load quotation.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quotationId]);

  async function handleStatusChange(newStatus) {
    try {
      setActionLoading(true);
      await quotationsApi.updateStatus(quotationId, newStatus);
      const res = await quotationsApi.getQuotationById(quotationId);
      setData(res.data);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConvert() {
    if (!confirm('Convert this quotation to an active subscription?')) return;
    try {
      setActionLoading(true);
      const res = await quotationsApi.convertToSubscription(quotationId);
      alert('Converted to Subscription ' + res.data.subscription_number + '!');
      if (onRefresh) onRefresh();
      if (onNavigate) onNavigate('/admin/subscriptions');
      else onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal-card modal-lg">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 className="modal-title">
              {data ? `Quotation ${data.quotation_number}` : 'Quotation Details'}
            </h2>
            <span className="modal-subtitle">
              {data ? `${data.customer_first_name} ${data.customer_last_name || ''} • Created on ${data.quotation_date}` : 'Loading...'}
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-form-body">
          {loading || !data ? (
            <div className="table-loading-state">
              <div className="loading-spinner" />
              <p>Loading quotation details...</p>
            </div>
          ) : (
            <>
              <div className="admin-detail-grid">
                <div className="detail-field-group">
                  <label>Quotation Number</label>
                  <p className="font-mono font-bold text-navy">{data.quotation_number}</p>
                </div>

                <div className="detail-field-group">
                  <label>Status</label>
                  <p><StatusBadge status={data.status} /></p>
                </div>

                <div className="detail-field-group">
                  <label>Valid Until</label>
                  <p className="font-semibold">{data.valid_until}</p>
                </div>

                <div className="detail-field-group">
                  <label>Payment Terms</label>
                  <p>{data.payment_terms || 'Net 30'}</p>
                </div>

                <div className="detail-field-group">
                  <label>Subtotal</label>
                  <p>{formatCurrency(data.subtotal)}</p>
                </div>

                <div className="detail-field-group">
                  <label>Tax Amount</label>
                  <p>+{formatCurrency(data.tax_amount)}</p>
                </div>

                <div className="detail-field-group">
                  <label>Discount</label>
                  <p className="text-danger">-{formatCurrency(data.discount_amount)}</p>
                </div>

                <div className="detail-field-group">
                  <label>Total Amount</label>
                  <p className="font-bold text-navy" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                    {formatCurrency(data.total_amount)}
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
                  Line Items ({data.items?.length || 0})
                </h4>
                <div className="table-responsive" style={{ border: '1px solid var(--admin-border-subtle)', borderRadius: '6px' }}>
                  <table className="products-data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Cycle</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th>Unit Price</th>
                        <th>Tax</th>
                        <th>Discount</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items?.map((it) => (
                        <tr key={it.id}>
                          <td className="font-semibold">{it.product_name}</td>
                          <td className="capitalize">{it.billing_frequency || 'monthly'}</td>
                          <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                          <td>{formatCurrency(it.unit_price)}</td>
                          <td>{it.tax_rate}%</td>
                          <td>{formatCurrency(it.discount_amount)}</td>
                          <td className="text-right font-semibold">{formatCurrency(it.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(data.customer_notes || data.internal_notes) && (
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {data.customer_notes && (
                    <div style={{ padding: '10px 14px', background: 'var(--admin-bg-subtle)', borderRadius: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Customer Notes</label>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{data.customer_notes}</p>
                    </div>
                  )}
                  {data.internal_notes && (
                    <div style={{ padding: '10px 14px', background: 'var(--admin-bg-subtle)', borderRadius: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Internal Notes</label>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{data.internal_notes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-form-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={onClose}>Close</button>

                {data.status === 'draft' && (
                  <button
                    type="button"
                    className="btn-primary-action"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('sent')}
                  >
                    Mark as Sent
                  </button>
                )}

                {data.status === 'sent' && (
                  <button
                    type="button"
                    className="btn-primary-action"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('accepted')}
                  >
                    Mark as Accepted
                  </button>
                )}

                {data.status === 'accepted' && (
                  <button
                    type="button"
                    className="btn-primary-action"
                    disabled={actionLoading}
                    onClick={handleConvert}
                  >
                    Convert to Subscription
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quotation Form Modal (Create / Edit) ─────────────────────────────────────
function QuotationFormModal({ quotationId, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [customerId, setCustomerId] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [custRes, prodRes, tmplRes] = await Promise.all([
          peopleApi.getCustomers({ limit: 100 }),
          fetch('http://localhost:5000/api/products?limit=100').then((r) => r.json()).catch(() => ({ data: [] })),
          quotationTemplatesApi.getTemplates({ limit: 100 })
        ]);

        setCustomers(custRes.data || []);
        setProducts(prodRes.data || []);
        setTemplates(tmplRes.data || []);

        if (quotationId) {
          const res = await quotationsApi.getQuotationById(quotationId);
          const q = res.data;
          setCustomerId(q.customer_id);
          setQuotationDate(q.quotation_date);
          setValidUntil(q.valid_until);
          setPaymentTerms(q.payment_terms || 'Net 30');
          setCustomerNotes(q.customer_notes || '');
          setInternalNotes(q.internal_notes || '');
          setItems(q.items || []);
        } else {
          if (prodRes.data && prodRes.data.length > 0) {
            const p0 = prodRes.data[0];
            setItems([{
              product_id: p0.id,
              product_name: p0.name,
              billing_frequency: 'monthly',
              quantity: 1,
              unit_price: p0.sales_price || 0,
              tax_rate: 18,
              discount_type: 'fixed',
              discount_value: 0
            }]);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load options.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [quotationId]);

  function handleProductChange(idx, prodId) {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      product_id: p.id,
      product_name: p.name,
      unit_price: p.sales_price || 0
    };
    setItems(newItems);
  }

  function handleItemChange(idx, field, val) {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);
  }

  function addItem() {
    const p0 = products[0] || {};
    setItems([...items, {
      product_id: p0.id || null,
      product_name: p0.name || 'Product',
      billing_frequency: 'monthly',
      quantity: 1,
      unit_price: p0.sales_price || 0,
      tax_rate: 18,
      discount_type: 'fixed',
      discount_value: 0
    }]);
  }

  function removeItem(idx) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  const calculatedSubtotal = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0);
  const calculatedDiscount = items.reduce((sum, it) => {
    const base = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
    const dVal = parseFloat(it.discount_value) || 0;
    return sum + (it.discount_type === 'percentage' ? (base * Math.min(100, dVal)) / 100 : Math.min(base, dVal));
  }, 0);
  const calculatedTax = items.reduce((sum, it) => {
    const base = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
    const dVal = parseFloat(it.discount_value) || 0;
    const disc = it.discount_type === 'percentage' ? (base * Math.min(100, dVal)) / 100 : Math.min(base, dVal);
    const rate = parseFloat(it.tax_rate) || 0;
    return sum + ((Math.max(0, base - disc) * rate) / 100);
  }, 0);
  const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount + calculatedTax);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        customer_id: customerId,
        quotation_date: quotationDate,
        valid_until: validUntil,
        payment_terms: paymentTerms,
        customer_notes: customerNotes,
        internal_notes: internalNotes,
        items
      };

      if (quotationId) {
        await quotationsApi.updateQuotation(quotationId, payload);
      } else {
        await quotationsApi.createQuotation(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save quotation.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal-card modal-lg">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 className="modal-title">{quotationId ? 'Edit Quotation' : 'Create Quotation'}</h2>
            <span className="modal-subtitle">Generate custom sales proposals with live pricing and GST taxes.</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="product-alert alert-error" style={{ margin: '16px 24px 0' }}>
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form-body">
          <div className="form-grid-2col">
            <div className="form-group required">
              <label htmlFor="quote-customer">Customer</label>
              <select
                id="quote-customer"
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select customer...</option>
                {customers.map((c) => {
                  const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.business_name;
                  return (
                    <option key={c.id} value={c.id}>
                      {name} {c.business_name && name !== c.business_name ? `(${c.business_name})` : ''} — {c.email}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quote-terms">Payment Terms</label>
              <select
                id="quote-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 15">Net 15</option>
                <option value="Advance">Advance</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group required">
              <label htmlFor="quote-date">Quotation Date</label>
              <input
                id="quote-date"
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
              />
            </div>
            <div className="form-group required">
              <label htmlFor="quote-valid">Valid Until</label>
              <input
                id="quote-valid"
                type="date"
                required
                min={quotationDate}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Line Items</label>
              <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={addItem}>
                + Add Item
              </button>
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--admin-border-subtle)', borderRadius: '6px' }}>
              <table className="products-data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '80px' }}>Qty</th>
                    <th style={{ width: '110px' }}>Price (₹)</th>
                    <th style={{ width: '75px' }}>Tax (%)</th>
                    <th style={{ width: '90px' }}>Disc Value</th>
                    <th style={{ width: '90px' }}>Disc Type</th>
                    <th style={{ width: '35px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          value={it.product_id || ''}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}
                        >
                          <option value="">Select product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} (₹{p.sales_price})</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={it.tax_rate}
                          onChange={(e) => handleItemChange(idx, 'tax_rate', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.discount_value}
                          onChange={(e) => handleItemChange(idx, 'discount_value', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <select
                          value={it.discount_type || 'fixed'}
                          onChange={(e) => handleItemChange(idx, 'discount_type', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}
                        >
                          <option value="fixed">Fixed</option>
                          <option value="percentage">%</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Totals Box */}
          <div style={{
            background: 'var(--admin-bg-subtle)',
            borderRadius: '6px',
            padding: '12px 16px',
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '20px',
            fontSize: '0.85rem'
          }}>
            <div>Subtotal: <strong>{formatCurrency(calculatedSubtotal)}</strong></div>
            <div>Discount: <strong className="text-danger">-{formatCurrency(calculatedDiscount)}</strong></div>
            <div>Tax (GST): <strong>+{formatCurrency(calculatedTax)}</strong></div>
            <div style={{ fontSize: '1rem', color: 'var(--admin-blue)', fontWeight: 700 }}>
              Total: {formatCurrency(calculatedTotal)}
            </div>
          </div>

          <div className="form-grid-2col" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label htmlFor="quote-cnotes">Customer Notes</label>
              <textarea
                id="quote-cnotes"
                rows={2}
                placeholder="Included on client proposal PDF..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="quote-inotes">Internal Notes</label>
              <textarea
                id="quote-inotes"
                rows={2}
                placeholder="Internal sales guidance..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-form-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={saving}>
              {saving ? 'Saving...' : (quotationId ? 'Save Changes' : 'Create Quotation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Quotation Templates Tab ──────────────────────────────────────────────────
function TemplatesTab({ setSuccessToast, setError }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'delete'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await quotationTemplatesApi.getTemplates({ search });
      setTemplates(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, [search, setError]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleToggleStatus(tmpl) {
    try {
      await quotationTemplatesApi.toggleStatus(tmpl.id, !tmpl.is_active);
      setSuccessToast(`Template "${tmpl.template_name}" status updated.`);
      fetchTemplates();
    } catch (err) {
      setError(err.message || 'Failed to toggle status.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await quotationTemplatesApi.deleteTemplate(deleteTarget.id);
      setSuccessToast(`Template "${deleteTarget.template_name}" deleted.`);
      setDeleteTarget(null);
      setModalMode(null);
      fetchTemplates();
    } catch (err) {
      setError(err.message || 'Failed to delete template.');
    }
  }

  return (
    <>
      <div className="products-filter-toolbar">
        <div className="search-input-box">
          <span className="search-icon"><AdminIcon name="search" size={16} /></span>
          <input
            type="text"
            placeholder="Search templates by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="product-search-field"
          />
          {search && (
            <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="header-action-group">
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => {
              setSelectedTemplate(null);
              setModalMode('create');
            }}
          >
            <AdminIcon name="plus" size={16} />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="loading-spinner" />
            <p>Loading quotation templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">
              <AdminIcon name="quotations" size={48} />
            </div>
            <h3>No quotation templates found</h3>
            <p>Create reusable templates to quickly build customer proposals.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="products-data-table">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Description</th>
                  <th>Products Included</th>
                  <th style={{ textAlign: 'center' }}>Validity</th>
                  <th>Estimated Price</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold text-navy">{t.template_name}</td>
                    <td className="product-cell-desc line-clamp-1">{t.description || '—'}</td>
                    <td>{t.product_names || `${t.item_count} product(s)`}</td>
                    <td style={{ textAlign: 'center' }}>{t.validity_days} days</td>
                    <td className="font-semibold">{formatCurrency(t.total_price)}</td>
                    <td>
                      <button
                        type="button"
                        className={`status-toggle-btn ${t.is_active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(t)}
                      >
                        <span className={`status-dot ${t.is_active ? 'dot-active' : 'dot-inactive'}`} />
                        <span>{t.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-btn-icon text-danger"
                          title="Delete template"
                          onClick={() => {
                            setDeleteTarget(t);
                            setModalMode('delete');
                          }}
                        >
                          <AdminIcon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode === 'delete' && deleteTarget && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setModalMode(null)}
        >
          <div className="admin-modal-card modal-sm">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2 className="modal-title">Delete Template</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-form-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Delete template <strong>"{deleteTarget.template_name}"</strong>?
              </p>
              <div className="modal-form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
                <button type="button" className="btn-danger-action" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page Export ──────────────────────────────────────────────────────────
export function QuotationsPage({ initialTab = 'quotations', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [successToast, setSuccessToast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  return (
    <div className="people-module-root" id="quotations-module">
      {successToast && (
        <div className="product-alert alert-success" role="alert">
          <span className="alert-icon"><AdminIcon name="check" size={16} /></span>
          <span className="alert-message">{successToast}</span>
          <button type="button" className="alert-close-btn" onClick={() => setSuccessToast(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="product-alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span className="alert-message">{error}</span>
          <button type="button" className="alert-close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="products-view-header">
        <div>
          <h1 className="products-view-title">Quotations & Proposals</h1>
          <p className="products-view-subtitle">
            Manage sales quotations, customer proposals, pricing approvals, and conversion to active client subscriptions.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="products-tab-nav" style={{ margin: '16px 0 20px' }}>
        <button
          type="button"
          className={`tab-nav-btn ${activeTab === 'quotations' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotations')}
        >
          <AdminIcon name="quotations" size={16} />
          <span>All Quotations</span>
        </button>

        <button
          type="button"
          className={`tab-nav-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <AdminIcon name="plans" size={16} />
          <span>Quotation Templates</span>
        </button>
      </div>

      {activeTab === 'quotations' ? (
        <AllQuotationsTab
          onNavigate={onNavigate}
          setSuccessToast={setSuccessToast}
          setError={setError}
        />
      ) : (
        <TemplatesTab
          setSuccessToast={setSuccessToast}
          setError={setError}
        />
      )}
    </div>
  );
}
