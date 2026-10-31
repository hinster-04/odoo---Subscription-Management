import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionsApi } from '../services/salesApi';
import { peopleApi } from '../services/peopleApi';
import { AdminIcon } from '../AdminIcons';

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let badgeClass = 'badge-neutral';
  if (s === 'active') badgeClass = 'badge-success';
  else if (s === 'paused') badgeClass = 'badge-warning';
  else if (s === 'closed') badgeClass = 'badge-danger';
  else if (s === 'confirmed') badgeClass = 'badge-blue';

  return (
    <span className={`admin-badge ${badgeClass} capitalize`}>
      {s}
    </span>
  );
}

// ─── Subscription Detail View Component ───────────────────────────────────────
function SubscriptionDetailView({ subscriptionId, onBack, onEdit, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'invoices' | 'payments' | 'activity'
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await subscriptionsApi.getSubscriptionById(subscriptionId);
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load subscription.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [subscriptionId]);

  async function handleStatusChange(newStatus) {
    try {
      setActionLoading(true);
      await subscriptionsApi.updateStatus(subscriptionId, newStatus);
      const res = await subscriptionsApi.getSubscriptionById(subscriptionId);
      setData(res.data);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="table-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="table-loading-state">
          <div className="loading-spinner" />
          <p>Loading subscription contract from Neon database...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <button type="button" className="btn-secondary" onClick={onBack} style={{ marginBottom: '16px' }}>
          ← Back to Subscriptions
        </button>
        <div className="product-alert alert-error">
          <span className="alert-message">{error || 'Subscription not found.'}</span>
        </div>
      </div>
    );
  }

  const customerName = [data.customer_first_name, data.customer_last_name].filter(Boolean).join(' ') || data.business_name || 'Client';

  return (
    <div>
      {/* Topbar */}
      <div className="products-view-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button type="button" className="btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <div>
            <h1 className="products-view-title" style={{ fontSize: '1.4rem', margin: 0 }}>
              {data.subscription_number}
            </h1>
            <p className="products-view-subtitle" style={{ margin: 0 }}>
              {customerName} {data.business_name && customerName !== data.business_name ? `(${data.business_name})` : ''}
            </p>
          </div>
        </div>

        <div className="header-action-group">
          {data.status === 'active' && (
            <button
              type="button"
              className="btn-secondary"
              disabled={actionLoading}
              onClick={() => handleStatusChange('paused')}
            >
              Pause Subscription
            </button>
          )}

          {data.status === 'paused' && (
            <button
              type="button"
              className="btn-primary-action"
              disabled={actionLoading}
              onClick={() => handleStatusChange('active')}
            >
              Resume Subscription
            </button>
          )}

          {data.status !== 'closed' && (
            <button
              type="button"
              className="btn-secondary text-danger"
              disabled={actionLoading}
              onClick={() => {
                if (confirm('Close this subscription account?')) {
                  handleStatusChange('closed');
                }
              }}
            >
              Close Subscription
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onEdit(data.id)}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Contract Detail Card */}
      <div className="table-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--admin-navy)' }}>Contract Summary</h3>
          <StatusBadge status={data.status} />
        </div>

        <div className="admin-detail-grid">
          <div className="detail-field-group">
            <label>Start Date</label>
            <p className="font-semibold">{data.start_date}</p>
          </div>

          <div className="detail-field-group">
            <label>Expiry Date</label>
            <p>{data.expiry_date || 'Ongoing (No set expiry)'}</p>
          </div>

          <div className="detail-field-group">
            <label>Billing Cycle</label>
            <p className="capitalize font-semibold">{data.billing_frequency}</p>
          </div>

          <div className="detail-field-group">
            <label>Payment Terms</label>
            <p>{data.payment_terms || 'Net 30'}</p>
          </div>

          <div className="detail-field-group">
            <label>Next Billing Date</label>
            <p className="font-semibold text-blue">{data.next_billing_date || '—'}</p>
          </div>

          <div className="detail-field-group">
            <label>Recurring Total</label>
            <p className="font-bold text-navy" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
              {formatCurrency(data.total_amount)}
            </p>
          </div>

          {data.related_quotation_number && (
            <div className="detail-field-group">
              <label>Source Quotation</label>
              <p className="font-mono font-semibold">{data.related_quotation_number}</p>
            </div>
          )}

          {data.creator_first_name && (
            <div className="detail-field-group">
              <label>Account Manager</label>
              <p>{data.creator_first_name} {data.creator_last_name || ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Section Tabs */}
      <div className="products-tab-nav" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`tab-nav-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          <span>Subscription Items ({data.items?.length || 0})</span>
        </button>

        <button
          type="button"
          className={`tab-nav-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <span>Invoices</span>
        </button>

        <button
          type="button"
          className={`tab-nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <span>Payment Settlements</span>
        </button>

        <button
          type="button"
          className={`tab-nav-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <span>Activity Log</span>
        </button>
      </div>

      {/* Section Content */}
      <div className="table-card">
        {activeTab === 'items' && (
          <div className="table-responsive">
            <table className="products-data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Frequency</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  <th>Unit Price</th>
                  <th>GST Tax</th>
                  <th>Discount</th>
                  <th className="text-right">Total Recurring</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty-state">No items attached.</td></tr>
                ) : (
                  data.items.map((it) => (
                    <tr key={it.id}>
                      <td className="font-semibold text-navy">{it.product_name}</td>
                      <td className="capitalize">{it.billing_frequency || data.billing_frequency}</td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td>{formatCurrency(it.unit_price)}</td>
                      <td>{it.tax_rate}%</td>
                      <td>{formatCurrency(it.discount_amount)}</td>
                      <td className="text-right font-bold text-navy">{formatCurrency(it.total_amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="table-empty-state" style={{ padding: '40px' }}>
            <div className="empty-state-icon">
              <AdminIcon name="invoices" size={40} />
            </div>
            <h3>Invoices Module</h3>
            <p>Cycle billing invoices will appear here once generated in the upcoming Finance & Invoicing release.</p>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="table-empty-state" style={{ padding: '40px' }}>
            <div className="empty-state-icon">
              <AdminIcon name="payments" size={40} />
            </div>
            <h3>Payment Transactions</h3>
            <p>Gateway settlement transactions will sync here as payments occur.</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ padding: '24px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--admin-blue)', marginTop: '5px' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {data.created_at ? new Date(data.created_at).toLocaleString() : data.start_date}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--admin-navy)', fontWeight: 600 }}>
                    Subscription {data.subscription_number} initiated
                    {data.related_quotation_number ? ` (Converted from Quotation ${data.related_quotation_number})` : ''}
                  </div>
                </div>
              </li>
              {data.activated_at && (
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)', marginTop: '5px' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(data.activated_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--admin-navy)', fontWeight: 600 }}>
                      Contract activated with status '{data.status}'
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Subscriptions Page Component ─────────────────────────────────────────
export function SubscriptionsPage({ onNavigate }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedSubId, setSelectedSubId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'delete'
  const [editTargetId, setEditTargetId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionsApi.getSubscriptions({
        search,
        status: statusFilter,
        billing_frequency: frequencyFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize
      });
      setSubscriptions(res.data || []);
      setMeta(res.meta || { total: 0, total_pages: 1, summary: {} });
    } catch (err) {
      setError(err.message || 'Failed to fetch subscriptions from database.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, frequencyFilter, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  async function handleToggleStatus(sub, targetStatus) {
    try {
      await subscriptionsApi.updateStatus(sub.id, targetStatus);
      setSuccessToast(`Subscription status updated to ${targetStatus}.`);
      fetchSubscriptions();
    } catch (err) {
      setError(err.message || 'Failed to update subscription status.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await subscriptionsApi.deleteSubscription(deleteTarget.id);
      setSuccessToast(`Subscription ${deleteTarget.subscription_number} deleted.`);
      setDeleteTarget(null);
      setModalMode(null);
      fetchSubscriptions();
    } catch (err) {
      setError(err.message || 'Failed to delete subscription.');
    }
  }

  if (selectedSubId) {
    return (
      <div className="people-module-root">
        <SubscriptionDetailView
          subscriptionId={selectedSubId}
          onBack={() => setSelectedSubId(null)}
          onEdit={(id) => {
            setEditTargetId(id);
            setModalMode('edit');
          }}
          onRefresh={fetchSubscriptions}
        />
      </div>
    );
  }

  const summary = meta.summary || {};

  return (
    <div className="people-module-root" id="subscriptions-module">
      {/* Toast Alert */}
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

      {/* Header Bar */}
      <div className="products-view-header">
        <div>
          <h1 className="products-view-title">Client Subscriptions</h1>
          <p className="products-view-subtitle">
            Manage active client subscriptions, contract renewals, upgrades, billing cycles, and automated closures.
          </p>
        </div>

        <div className="header-action-group">
          <button
            type="button"
            className="btn-refresh"
            onClick={fetchSubscriptions}
            title="Refresh subscriptions"
          >
            <AdminIcon name="subscriptions" size={16} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={() => {
              setEditTargetId(null);
              setModalMode('create');
            }}
          >
            <AdminIcon name="plus" size={16} />
            <span>New Subscription</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="products-metrics-grid grid-4-cols">
        <div className="metric-card">
          <div className="metric-label">Total Subscriptions</div>
          <div className="metric-value">{summary.total_subscriptions ?? meta.total}</div>
          <div className="metric-meta">Active and historical client accounts</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Subscriptions</div>
          <div className="metric-value text-emerald">{summary.active_count ?? 0}</div>
          <div className="metric-meta text-emerald">Generating recurring ARR/MRR</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Paused Contracts</div>
          <div className="metric-value text-warning">{summary.paused_count ?? 0}</div>
          <div className="metric-meta">Temporarily suspended service</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Contract Value</div>
          <div className="metric-value text-blue">
            {formatCurrency(summary.active_revenue_total || 0)}
          </div>
          <div className="metric-meta">Live active billing volume</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="products-filter-toolbar">
        <div className="search-input-box">
          <span className="search-icon"><AdminIcon name="search" size={16} /></span>
          <input
            type="text"
            placeholder="Search by subscription #, customer name, or business..."
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
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
            <option value="expired">Expired</option>
            <option value="closed">Closed</option>
          </select>

          <select
            className="filter-select"
            value={frequencyFilter}
            onChange={(e) => {
              setFrequencyFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Frequencies</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
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
            <option value="subscription_number:desc">Sub # (Desc)</option>
            <option value="total_amount:desc">Amount: High to Low</option>
            <option value="total_amount:asc">Amount: Low to High</option>
            <option value="expiry_date:asc">Expiry Soonest</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="loading-spinner" />
            <p>Loading subscriptions from Neon PostgreSQL database...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">
              <AdminIcon name="subscriptions" size={48} />
            </div>
            <h3>No subscriptions found</h3>
            <p>No subscription records matched your search or filter settings.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="products-data-table">
              <thead>
                <tr>
                  <th>Subscription No.</th>
                  <th>Customer</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th>Frequency</th>
                  <th>Next Billing</th>
                  <th>Recurring Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => {
                  const customerName = [s.customer_first_name, s.customer_last_name].filter(Boolean).join(' ') || s.business_name || 'Customer';
                  return (
                    <tr key={s.id}>
                      <td className="product-cell-name">
                        <span
                          className="product-name-link font-mono font-semibold"
                          onClick={() => setSelectedSubId(s.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedSubId(s.id)}
                        >
                          {s.subscription_number}
                        </span>
                      </td>

                      <td>
                        <div className="customer-avatar-name">
                          <div className="customer-initials-badge">
                            {(customerName[0] || 'C').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-navy">{customerName}</div>
                            {s.business_name && customerName !== s.business_name && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.business_name}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{s.start_date}</td>
                      <td>{s.expiry_date || '—'}</td>
                      <td><span className="admin-badge badge-neutral capitalize">{s.billing_frequency}</span></td>
                      <td>{s.next_billing_date || '—'}</td>
                      <td className="font-bold text-navy">{formatCurrency(s.total_amount)}</td>
                      <td><StatusBadge status={s.status} /></td>

                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="action-btn-icon"
                            title="View subscription"
                            onClick={() => setSelectedSubId(s.id)}
                          >
                            <AdminIcon name="customers" size={15} />
                          </button>

                          <button
                            type="button"
                            className="action-btn-icon"
                            title="Edit subscription"
                            onClick={() => {
                              setEditTargetId(s.id);
                              setModalMode('edit');
                            }}
                          >
                            <AdminIcon name="edit" size={15} />
                          </button>

                          {s.status === 'active' && (
                            <button
                              type="button"
                              className="action-btn-icon text-warning"
                              title="Pause subscription"
                              onClick={() => handleToggleStatus(s, 'paused')}
                            >
                              <AdminIcon name="subscriptions" size={15} />
                            </button>
                          )}

                          {s.status === 'paused' && (
                            <button
                              type="button"
                              className="action-btn-icon text-emerald"
                              title="Resume subscription"
                              onClick={() => handleToggleStatus(s, 'active')}
                            >
                              <AdminIcon name="check" size={15} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="action-btn-icon text-danger"
                            title="Delete subscription"
                            onClick={() => {
                              setDeleteTarget(s);
                              setModalMode('delete');
                            }}
                          >
                            <AdminIcon name="trash" size={15} />
                          </button>
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
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} subscriptions
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

      {/* Create / Edit Subscription Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <SubscriptionFormModal
          subscriptionId={modalMode === 'edit' ? editTargetId : null}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            setModalMode(null);
            fetchSubscriptions();
            setSuccessToast(modalMode === 'edit' ? 'Subscription updated successfully.' : 'Subscription created successfully.');
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
                <h2 className="modal-title">Delete Subscription</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className="modal-form-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to permanently delete subscription <strong>"{deleteTarget.subscription_number}"</strong>?
                This action cannot be undone.
              </p>

              <div className="modal-form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="button" className="btn-danger-action" onClick={handleDelete}>
                  Delete Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subscription Form Modal ───────────────────────────────────────────────────
function SubscriptionFormModal({ subscriptionId, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [billingFrequency, setBillingFrequency] = useState('monthly');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          peopleApi.getCustomers({ limit: 100 }),
          fetch('http://localhost:5000/api/products?limit=100').then((r) => r.json()).catch(() => ({ data: [] }))
        ]);

        setCustomers(custRes.data || []);
        setProducts(prodRes.data || []);

        if (subscriptionId) {
          const res = await subscriptionsApi.getSubscriptionById(subscriptionId);
          const s = res.data;
          setCustomerId(s.customer_id);
          setStartDate(s.start_date);
          setExpiryDate(s.expiry_date || '');
          setBillingFrequency(s.billing_frequency || 'monthly');
          setPaymentTerms(s.payment_terms || 'Net 30');
          setNotes(s.notes || '');
          setStatus(s.status || 'active');
          setItems(s.items || []);
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
    load();
  }, [subscriptionId]);

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
      billing_frequency: billingFrequency,
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
      setError('Please add at least one subscription item.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        customer_id: customerId,
        start_date: startDate,
        expiry_date: expiryDate || null,
        billing_frequency: billingFrequency,
        payment_terms: paymentTerms,
        notes,
        status,
        items
      };

      if (subscriptionId) {
        await subscriptionsApi.updateSubscription(subscriptionId, payload);
      } else {
        await subscriptionsApi.createSubscription(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save subscription.');
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
            <h2 className="modal-title">{subscriptionId ? 'Edit Subscription' : 'New Subscription'}</h2>
            <span className="modal-subtitle">Provision recurring software access and contract terms.</span>
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
              <label htmlFor="sub-customer">Customer</label>
              <select
                id="sub-customer"
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

            <div className="form-group required">
              <label htmlFor="sub-frequency">Billing Frequency</label>
              <select
                id="sub-frequency"
                required
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3col">
            <div className="form-group required">
              <label htmlFor="sub-start">Start Date</label>
              <input
                id="sub-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sub-expiry">Expiry Date</label>
              <input
                id="sub-expiry"
                type="date"
                min={startDate}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sub-terms">Payment Terms</label>
              <select
                id="sub-terms"
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

          {/* Line Items */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Subscription Items</label>
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

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label htmlFor="sub-notes">Internal Account Notes</label>
            <textarea
              id="sub-notes"
              rows={2}
              placeholder="Terms, operational specifics, client SLA..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-form-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={saving}>
              {saving ? 'Saving...' : (subscriptionId ? 'Save Changes' : 'Create Subscription')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
