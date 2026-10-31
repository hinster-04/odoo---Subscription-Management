import React, { useState, useEffect, useCallback } from 'react';
import { plansApi } from '../services/plansApi';
import { AdminIcon } from '../AdminIcons';

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

export function SubscriptionPlansPage({ onNavigate }) {
  // Main state
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, summary: {} });

  // Modals state
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | 'delete'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    product_id: '',
    description: '',
    price: '',
    billing_frequency: 'monthly',
    minimum_quantity: 1,
    available_from: '',
    available_until: '',
    auto_close_on_end: false,
    auto_close_days: 30,
    allow_early_closure: true,
    allow_pause: true,
    allow_renewal: true,
    is_active: true
  });

  // Auto-dismiss success toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Load products list for dropdown
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('http://localhost:5000/api/products?limit=100').then(r => r.json());
        if (res.data) setProducts(res.data);
      } catch (err) {
        console.error('Failed to load products for plans:', err);
      }
    }
    loadProducts();
  }, []);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await plansApi.getPlans({
        search,
        billing_frequency: frequencyFilter,
        is_active: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize
      });
      setPlans(res.data || []);
      setMeta(res.meta || { total: 0, total_pages: 1, summary: {} });
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend database. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, [search, frequencyFilter, statusFilter, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Open Create Modal
  function handleOpenCreate() {
    setModalError(null);
    setSelectedPlan(null);
    setFormData({
      name: '',
      product_id: products[0]?.id || '',
      description: '',
      price: '',
      billing_frequency: 'monthly',
      minimum_quantity: 1,
      available_from: '',
      available_until: '',
      auto_close_on_end: false,
      auto_close_days: 30,
      allow_early_closure: true,
      allow_pause: true,
      allow_renewal: true,
      is_active: true
    });
    setModalMode('create');
  }

  // Open Edit Modal
  function handleOpenEdit(plan) {
    setModalError(null);
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || '',
      product_id: plan.product_id || '',
      description: plan.description || '',
      price: plan.price ?? '',
      billing_frequency: plan.billing_frequency || 'monthly',
      minimum_quantity: plan.minimum_quantity || 1,
      available_from: plan.available_from || '',
      available_until: plan.available_until || '',
      auto_close_on_end: Boolean(plan.auto_close_on_end),
      auto_close_days: plan.auto_close_days || 30,
      allow_early_closure: plan.allow_early_closure !== false,
      allow_pause: plan.allow_pause !== false,
      allow_renewal: plan.allow_renewal !== false,
      is_active: plan.is_active !== false
    });
    setModalMode('edit');
  }

  // Open View Modal
  function handleOpenView(plan) {
    setSelectedPlan(plan);
    setModalMode('view');
  }

  // Handle Save
  async function handleSavePlan(e) {
    e.preventDefault();
    setModalError(null);

    if (!formData.name.trim()) {
      setModalError('Plan name is required.');
      return;
    }
    if (!formData.product_id) {
      setModalError('Please select an associated product.');
      return;
    }
    if (formData.price === '' || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      setModalError('Valid non-negative price is required.');
      return;
    }
    if (formData.available_from && formData.available_until) {
      if (new Date(formData.available_until) < new Date(formData.available_from)) {
        setModalError('Available until date cannot be earlier than available from date.');
        return;
      }
    }
    if (formData.auto_close_on_end && (!formData.auto_close_days || parseInt(formData.auto_close_days, 10) < 1)) {
      setModalError('Please specify a valid auto-close duration (at least 1 day).');
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        product_id: formData.product_id,
        description: formData.description,
        price: parseFloat(formData.price),
        billing_frequency: formData.billing_frequency,
        minimum_quantity: parseInt(formData.minimum_quantity, 10) || 1,
        available_from: formData.available_from || null,
        available_until: formData.available_until || null,
        auto_close_on_end: formData.auto_close_on_end,
        auto_close_days: formData.auto_close_on_end ? parseInt(formData.auto_close_days, 10) : null,
        allow_early_closure: formData.allow_early_closure,
        allow_pause: formData.allow_pause,
        allow_renewal: formData.allow_renewal,
        is_active: formData.is_active
      };

      if (modalMode === 'edit' && selectedPlan) {
        await plansApi.updatePlan(selectedPlan.id, payload);
        setSuccessToast(`Subscription plan "${payload.name}" updated successfully.`);
      } else {
        await plansApi.createPlan(payload);
        setSuccessToast(`Subscription plan "${payload.name}" created successfully.`);
      }

      setModalMode(null);
      fetchPlans();
    } catch (err) {
      setModalError(err.message || 'Failed to save subscription plan.');
    } finally {
      setSaveLoading(false);
    }
  }

  // Handle Toggle Active/Inactive Status
  async function handleToggleStatus(plan) {
    try {
      const nextStatus = !plan.is_active;
      await plansApi.toggleStatus(plan.id, nextStatus);
      setSuccessToast(`Plan "${plan.name}" marked as ${nextStatus ? 'active' : 'inactive'}.`);
      fetchPlans();
    } catch (err) {
      setError(err.message || 'Failed to update plan status.');
    }
  }

  // Handle Delete Plan
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setSaveLoading(true);
    try {
      await plansApi.deletePlan(deleteTarget.id);
      setSuccessToast(`Subscription plan "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      setModalMode(null);
      fetchPlans();
    } catch (err) {
      setError(err.message || 'Failed to delete subscription plan.');
    } finally {
      setSaveLoading(false);
    }
  }

  const summary = meta.summary || {};

  return (
    <div className="people-module-root" id="subscription-plans-module">
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
          <h1 className="products-view-title">Subscription Plans</h1>
          <p className="products-view-subtitle">
            Configure pricing tiers, billing cycles, minimum seat commitments, renewal rules, and availability periods.
          </p>
        </div>

        <div className="header-action-group">
          <button
            type="button"
            className="btn-refresh"
            onClick={fetchPlans}
            title="Refresh plans list"
          >
            <AdminIcon name="subscriptions" size={16} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
            id="create-plan-btn"
          >
            <AdminIcon name="plus" size={16} />
            <span>Add Plan</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="products-metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Plans</div>
          <div className="metric-value">{summary.total_plans ?? meta.total}</div>
          <div className="metric-meta">Defined subscription pricing tiers</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Plans</div>
          <div className="metric-value text-emerald">{summary.active_plans ?? 0}</div>
          <div className="metric-meta text-emerald">Available for customer checkout</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Renewal Enabled</div>
          <div className="metric-value text-blue">{summary.renewal_enabled_plans ?? 0}</div>
          <div className="metric-meta">Supports recurring client renewal</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Inactive / Archived</div>
          <div className="metric-value text-muted">{summary.inactive_plans ?? 0}</div>
          <div className="metric-meta">Archived or paused plans</div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="products-filter-toolbar">
        <div className="search-input-box">
          <span className="search-icon"><AdminIcon name="search" size={16} /></span>
          <input
            type="text"
            placeholder="Search plans by name, description, or product..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="product-search-field"
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="filters-row">
          {/* Frequency Filter */}
          <select
            className="filter-select"
            value={frequencyFilter}
            onChange={(e) => {
              setFrequencyFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Frequencies</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {/* Status Filter */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          {/* Sort By Filter */}
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
            <option value="name:asc">Plan Name (A-Z)</option>
            <option value="name:desc">Plan Name (Z-A)</option>
            <option value="price:asc">Price: Low to High</option>
            <option value="price:desc">Price: High to Low</option>
            <option value="billing_frequency:asc">Frequency (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Plans Data Table Card */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="loading-spinner" />
            <p>Loading subscription plans from Neon PostgreSQL database...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">
              <AdminIcon name="plans" size={48} />
            </div>
            <h3>No subscription plans found</h3>
            <p>
              {search || frequencyFilter !== 'all' || statusFilter !== 'all'
                ? 'No subscription plans matched your search or filter settings.'
                : 'No plans exist in the catalog yet. Click "Add Plan" to create your first pricing tier.'}
            </p>
            {(search || frequencyFilter !== 'all' || statusFilter !== 'all') && (
              <div className="empty-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setFrequencyFilter('all');
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
                  <th>Plan Name</th>
                  <th>Product</th>
                  <th>Billing Frequency</th>
                  <th>Price</th>
                  <th style={{ textAlign: 'center' }}>Min. Qty</th>
                  <th>Availability Period</th>
                  <th>Renewal Status</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => {
                  let availText = 'Ongoing';
                  if (p.available_from && p.available_until) {
                    availText = `${p.available_from} to ${p.available_until}`;
                  } else if (p.available_from) {
                    availText = `From ${p.available_from}`;
                  } else if (p.available_until) {
                    availText = `Until ${p.available_until}`;
                  }

                  return (
                    <tr key={p.id}>
                      <td className="product-cell-name">
                        <div>
                          <span
                            className="product-name-link font-semibold"
                            onClick={() => handleOpenView(p)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenView(p)}
                          >
                            {p.name}
                          </span>
                          {p.description && (
                            <div className="product-cell-desc line-clamp-1" title={p.description}>
                              {p.description}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="admin-badge badge-neutral">
                          {p.product_name || 'Software Suite'}
                        </span>
                      </td>

                      <td>
                        <span className="admin-badge badge-blue capitalize">
                          {p.billing_frequency}
                        </span>
                      </td>

                      <td className="font-semibold text-navy">
                        {formatCurrency(p.price)}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          /{p.billing_frequency === 'yearly' ? 'yr' : p.billing_frequency === 'monthly' ? 'mo' : p.billing_frequency}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {p.minimum_quantity}
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {availText}
                        </span>
                      </td>

                      <td>
                        {p.allow_renewal ? (
                          <span className="admin-badge badge-success" style={{ fontSize: '0.75rem' }}>
                            Auto-Renew
                          </span>
                        ) : (
                          <span className="admin-badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            Fixed Term
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`status-toggle-btn ${p.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleStatus(p)}
                          title={`Click to ${p.is_active ? 'deactivate' : 'activate'} plan`}
                        >
                          <span className={`status-dot ${p.is_active ? 'dot-active' : 'dot-inactive'}`} />
                          <span>{p.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                      </td>

                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="action-btn-icon"
                            onClick={() => handleOpenView(p)}
                            title="View details"
                          >
                            <AdminIcon name="customers" size={15} />
                          </button>
                          <button
                            type="button"
                            className="action-btn-icon"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit plan"
                          >
                            <AdminIcon name="edit" size={15} />
                          </button>
                          <button
                            type="button"
                            className="action-btn-icon text-danger"
                            onClick={() => {
                              setDeleteTarget(p);
                              setModalMode('delete');
                            }}
                            title="Delete plan"
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
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} subscription plans
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

      {/* Create / Edit Plan Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setModalMode(null)}
        >
          <div className="admin-modal-card modal-lg">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2 className="modal-title">
                  {modalMode === 'create' ? 'Create Subscription Plan' : `Edit Plan: ${selectedPlan?.name}`}
                </h2>
                <span className="modal-subtitle">
                  Define pricing, cycle frequency, license limits, and contract lifecycle rules.
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalMode(null)}
              >
                ×
              </button>
            </div>

            {modalError && (
              <div className="product-alert alert-error" style={{ margin: '16px 24px 0' }}>
                <span className="alert-icon">⚠️</span>
                <span className="alert-message">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="modal-form-body">
              {/* Section 1: Basic Information */}
              <div className="form-section-header">
                <h3>1. Basic Information</h3>
                <p>Plan name, product association, pricing, and billing cycle.</p>
              </div>

              <div className="form-grid-2col">
                <div className="form-group required">
                  <label htmlFor="plan-name">Plan Name</label>
                  <input
                    id="plan-name"
                    type="text"
                    required
                    placeholder="e.g. Enterprise Annual License"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group required">
                  <label htmlFor="plan-product">Associated Product</label>
                  <select
                    id="plan-product"
                    required
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.category ? `(${p.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="plan-description">Description</label>
                <textarea
                  id="plan-description"
                  rows={2}
                  placeholder="Summarize included features, user tiers, or service level commitments..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-grid-3col">
                <div className="form-group required">
                  <label htmlFor="plan-frequency">Billing Frequency</label>
                  <select
                    id="plan-frequency"
                    required
                    value={formData.billing_frequency}
                    onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="form-group required">
                  <label htmlFor="plan-price">Plan Price (₹)</label>
                  <input
                    id="plan-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="form-group required">
                  <label htmlFor="plan-min-qty">Minimum Quantity</label>
                  <input
                    id="plan-min-qty"
                    type="number"
                    min="1"
                    required
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 2: Availability */}
              <div className="form-section-header" style={{ marginTop: '20px' }}>
                <h3>2. Availability Period</h3>
                <p>Optional schedule when this plan is available for customer subscriptions.</p>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label htmlFor="plan-avail-from">Available From</label>
                  <input
                    id="plan-avail-from"
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="plan-avail-until">Available Until</label>
                  <input
                    id="plan-avail-until"
                    type="date"
                    min={formData.available_from || undefined}
                    value={formData.available_until}
                    onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 3: Subscription Rules */}
              <div className="form-section-header" style={{ marginTop: '20px' }}>
                <h3>3. Subscription Rules</h3>
                <p>Contract lifecycle controls, renewals, pause policies, and closure triggers.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Auto close checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="rule-auto-close"
                    type="checkbox"
                    checked={formData.auto_close_on_end}
                    onChange={(e) => setFormData({ ...formData, auto_close_on_end: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="rule-auto-close" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>
                    Enable Auto-Close upon expiration
                  </label>
                </div>

                {/* Conditional Auto close days */}
                {formData.auto_close_on_end && (
                  <div className="form-group" style={{ marginLeft: '26px', maxWidth: '300px' }}>
                    <label htmlFor="plan-auto-close-days">Auto-close after (days)</label>
                    <input
                      id="plan-auto-close-days"
                      type="number"
                      min="1"
                      required={formData.auto_close_on_end}
                      value={formData.auto_close_days}
                      onChange={(e) => setFormData({ ...formData, auto_close_days: e.target.value })}
                      placeholder="30"
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Subscription terminates automatically if not renewed within this grace window.
                    </small>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="rule-early-closure"
                    type="checkbox"
                    checked={formData.allow_early_closure}
                    onChange={(e) => setFormData({ ...formData, allow_early_closure: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="rule-early-closure" style={{ margin: 0, cursor: 'pointer' }}>
                    Allow Early Closure (clients may cancel before term completion)
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="rule-pause"
                    type="checkbox"
                    checked={formData.allow_pause}
                    onChange={(e) => setFormData({ ...formData, allow_pause: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="rule-pause" style={{ margin: 0, cursor: 'pointer' }}>
                    Allow Subscription Pause (clients can temporarily suspend billing)
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="rule-renewal"
                    type="checkbox"
                    checked={formData.allow_renewal}
                    onChange={(e) => setFormData({ ...formData, allow_renewal: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="rule-renewal" style={{ margin: 0, cursor: 'pointer' }}>
                    Allow Contract Renewal (automatically roll into subsequent terms)
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    id="rule-active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="rule-active" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>
                    Active (visible and selectable in quotations and store)
                  </label>
                </div>
              </div>

              <div className="modal-form-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalMode(null)}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : (modalMode === 'create' ? 'Create Plan' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Plan Details Modal */}
      {modalMode === 'view' && selectedPlan && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setModalMode(null)}
        >
          <div className="admin-modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2 className="modal-title">{selectedPlan.name}</h2>
                <span className="modal-subtitle">
                  {selectedPlan.product_name} • {selectedPlan.billing_frequency.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalMode(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-form-body">
              <div className="admin-detail-grid">
                <div className="detail-field-group">
                  <label>Plan Price</label>
                  <p className="font-bold text-navy" style={{ fontSize: '1.25rem' }}>
                    {formatCurrency(selectedPlan.price)}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      /{selectedPlan.billing_frequency}
                    </span>
                  </p>
                </div>

                <div className="detail-field-group">
                  <label>Status</label>
                  <p>
                    <span className={`admin-badge ${selectedPlan.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {selectedPlan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>

                <div className="detail-field-group">
                  <label>Minimum Quantity</label>
                  <p>{selectedPlan.minimum_quantity} license(s)</p>
                </div>

                <div className="detail-field-group">
                  <label>Product Suite</label>
                  <p className="font-semibold">{selectedPlan.product_name}</p>
                </div>

                <div className="detail-field-group">
                  <label>Availability Schedule</label>
                  <p>
                    {selectedPlan.available_from ? `From ${selectedPlan.available_from}` : 'Immediate'}
                    {selectedPlan.available_until ? ` until ${selectedPlan.available_until}` : ' (No end date)'}
                  </p>
                </div>

                <div className="detail-field-group">
                  <label>Renewal Policy</label>
                  <p>{selectedPlan.allow_renewal ? 'Contract Renewal Permitted' : 'Fixed Term / Non-Renewable'}</p>
                </div>

                <div className="detail-field-group">
                  <label>Early Cancellation</label>
                  <p>{selectedPlan.allow_early_closure ? 'Allowed' : 'Locked for duration'}</p>
                </div>

                <div className="detail-field-group">
                  <label>Pause Policy</label>
                  <p>{selectedPlan.allow_pause ? 'Pause Allowed' : 'No Pause'}</p>
                </div>

                {selectedPlan.auto_close_on_end && (
                  <div className="detail-field-group">
                    <label>Auto-Close Window</label>
                    <p>{selectedPlan.auto_close_days || 30} days after term end</p>
                  </div>
                )}
              </div>

              {selectedPlan.description && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--admin-bg-subtle)', borderRadius: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{selectedPlan.description}</p>
                </div>
              )}

              <div className="modal-form-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalMode(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() => handleOpenEdit(selectedPlan)}
                >
                  Edit Plan
                </button>
              </div>
            </div>
          </div>
        </div>
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
                <h2 className="modal-title">Delete Subscription Plan</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalMode(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-form-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete the plan <strong>"{deleteTarget.name}"</strong>?
                This action cannot be undone. Plans referenced by active quotations or subscriptions cannot be deleted.
              </p>

              <div className="modal-form-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalMode(null)}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-action"
                  onClick={handleConfirmDelete}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Deleting...' : 'Delete Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
