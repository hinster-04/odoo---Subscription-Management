import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { peopleApi } from '../services/peopleApi';
import { AdminIcon } from '../AdminIcons';

export function CustomersPage({ onNavigate }) {
  // --- Main State ---
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // --- Filtering & Pagination State ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // --- Metadata & Counts ---
  const [metadata, setMetadata] = useState({ business_types: [], counts: { total: 0, active: 0, inactive: 0 } });

  // --- Details / Edit Modal State ---
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsTab, setDetailsTab] = useState('personal'); // 'personal' | 'business' | 'account'
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // --- Status Toggle Confirmation ---
  const [statusActionCustomer, setStatusActionCustomer] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Load Metadata
  const loadMetadata = useCallback(async () => {
    try {
      const res = await peopleApi.getCustomerMetadata();
      if (res.data) {
        setMetadata(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Fetch Customers List
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await peopleApi.getCustomers({
        search,
        status: statusFilter,
        business_type: businessTypeFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize
      });

      if (res.status === 'success') {
        setCustomers(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err.message || 'Unable to connect to the backend database. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, businessTypeFilter, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle open customer details
  const handleOpenDetails = (customer, editMode = false) => {
    setSelectedCustomer(customer);
    setDetailsTab('personal');
    setIsEditing(editMode);
    setEditFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      business_name: customer.business_name || '',
      business_type: customer.business_type || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      postal_code: customer.postal_code || '',
      is_active: customer.is_active ?? true
    });
    setModalError(null);
  };

  // Handle save customer edit
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSaveLoading(true);
    setModalError(null);

    try {
      if (!editFormData.first_name.trim()) {
        throw new Error('First name is required.');
      }
      if (!editFormData.email.trim()) {
        throw new Error('Email is required.');
      }

      const res = await peopleApi.updateCustomer(selectedCustomer.id, editFormData);
      setSuccessToast(`Customer "${res.data.full_name}" updated successfully.`);
      setSelectedCustomer(res.data);
      setIsEditing(false);
      fetchCustomers();
      loadMetadata();
    } catch (err) {
      setModalError(err.message || 'Failed to update customer details.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle status toggle (Activate/Deactivate)
  const handleConfirmStatusToggle = async () => {
    if (!statusActionCustomer) return;
    setStatusLoading(true);
    try {
      const nextStatus = !statusActionCustomer.is_active;
      const res = await peopleApi.toggleCustomerStatus(statusActionCustomer.id, nextStatus);
      setSuccessToast(res.message || `Customer account ${nextStatus ? 'activated' : 'deactivated'}.`);
      setStatusActionCustomer(null);
      if (selectedCustomer && selectedCustomer.id === statusActionCustomer.id) {
        setSelectedCustomer((prev) => ({ ...prev, is_active: nextStatus }));
      }
      fetchCustomers();
      loadMetadata();
    } catch (err) {
      setError(err.message || 'Failed to update customer account status.');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="people-module-root">
      {/* Toast Alert */}
      {successToast && (
        <div className="product-alert alert-success" role="alert">
          <span className="alert-icon">
            <AdminIcon name="check" size={16} />
          </span>
          <span className="alert-message">{successToast}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setSuccessToast(null)}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="product-alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span className="alert-message">{error}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="products-view-header">
        <div>
          <h1 className="products-view-title">Customers Directory</h1>
          <p className="products-view-subtitle">
            Manage client business accounts, personal contacts, billing profiles, and account access status.
          </p>
        </div>

        <div className="header-action-group">
          <button
            type="button"
            className="btn-refresh"
            onClick={() => {
              fetchCustomers();
              loadMetadata();
            }}
            title="Refresh customers list"
          >
            <AdminIcon name="subscriptions" size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="products-metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Registered Customers</div>
          <div className="metric-value">{metadata.counts?.total || pagination.total || customers.length}</div>
          <div className="metric-meta">Client accounts in Neon database</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Accounts</div>
          <div className="metric-value text-emerald">
            {metadata.counts?.active ?? customers.filter((c) => c.is_active).length}
          </div>
          <div className="metric-meta text-emerald">Authorized for customer portal access</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Deactivated / Suspended</div>
          <div className="metric-value text-muted">
            {metadata.counts?.inactive ?? customers.filter((c) => !c.is_active).length}
          </div>
          <div className="metric-meta">Access currently paused</div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="products-filter-toolbar">
        <div className="search-input-box">
          <span className="search-icon">
            <AdminIcon name="search" size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by customer name, business, email, phone, city..."
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

          {/* Business Type Filter */}
          <select
            className="filter-select"
            value={businessTypeFilter}
            onChange={(e) => {
              setBusinessTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Business Types</option>
            {metadata.business_types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
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
            <option value="created_at:desc">Newest Registered</option>
            <option value="created_at:asc">Oldest Registered</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="business_name:asc">Business Name (A-Z)</option>
            <option value="city:asc">City (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="loading-spinner" />
            <p>Loading customers from Neon PostgreSQL database...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">
              <AdminIcon name="customers" size={48} />
            </div>
            <h3>No customers found</h3>
            <p>
              {search || statusFilter !== 'all' || businessTypeFilter !== 'all'
                ? 'No customer records matched your search or filter settings.'
                : 'No customer accounts exist in the database yet.'}
            </p>
            {(search || statusFilter !== 'all' || businessTypeFilter !== 'all') && (
              <div className="empty-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setBusinessTypeFilter('all');
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
                  <th>Customer Name</th>
                  <th>Business Name</th>
                  <th>Business Type</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="product-cell-name">
                      <div className="customer-avatar-name">
                        <div className="customer-initials-badge">
                          {(c.first_name?.[0] || 'C').toUpperCase()}
                          {(c.last_name?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <span
                            className="product-name-link"
                            onClick={() => handleOpenDetails(c, false)}
                          >
                            {c.full_name || 'Unnamed Client'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="font-semibold text-navy">
                      {c.business_name || <span className="text-muted">—</span>}
                    </td>

                    <td>
                      {c.business_type ? (
                        <span className="category-pill">{c.business_type}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td>
                      <a href={`mailto:${c.email}`} className="customer-email-link">
                        {c.email}
                      </a>
                    </td>

                    <td className="text-muted">
                      {c.phone || <span className="text-muted">—</span>}
                    </td>

                    <td className="text-muted">
                      {c.city || <span className="text-muted">—</span>}
                    </td>

                    <td>
                      <span
                        className={`status-pill ${
                          c.is_active ? 'status-active' : 'status-inactive'
                        }`}
                      >
                        <span className="status-dot" />
                        {c.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="text-muted text-sm">
                      {c.registration_date
                        ? new Date(c.registration_date).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="text-right">
                      <div className="table-actions-inline">
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          onClick={() => handleOpenDetails(c, false)}
                          title="View customer details"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          onClick={() => handleOpenDetails(c, true)}
                          title="Edit customer details"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`action-btn ${c.is_active ? 'delete-btn' : 'btn-activate'}`}
                          onClick={() => setStatusActionCustomer(c)}
                          title={c.is_active ? 'Deactivate customer account' : 'Activate customer account'}
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {customers.length > 0 && (
          <div className="table-pagination-footer">
            <div className="pagination-info">
              Showing <b>{(currentPage - 1) * pageSize + 1}</b> to{' '}
              <b>{Math.min(currentPage * pageSize, pagination.total)}</b> of{' '}
              <b>{pagination.total}</b> customers
            </div>

            <div className="pagination-controls">
              <div className="page-size-selector">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Previous
                </button>
                <span className="page-indicator">
                  Page {currentPage} of {pagination.totalPages || 1}
                </span>
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage >= (pagination.totalPages || 1)}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOMER DETAILS & EDIT MODAL */}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => !saveLoading && setSelectedCustomer(null)}>
          <div className="modal-dialog modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="details-modal-title-group">
                <h3 className="modal-title">
                  {selectedCustomer.full_name || 'Customer Account'}
                </h3>
                <span
                  className={`status-pill ${
                    selectedCustomer.is_active ? 'status-active' : 'status-inactive'
                  }`}
                >
                  <span className="status-dot" />
                  {selectedCustomer.is_active ? 'Active Account' : 'Deactivated'}
                </span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saveLoading && setSelectedCustomer(null)}
              >
                ×
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="modal-tabs-nav">
              <button
                type="button"
                className={`modal-tab-btn ${detailsTab === 'personal' ? 'is-active' : ''}`}
                onClick={() => setDetailsTab('personal')}
              >
                1. Personal Information
              </button>
              <button
                type="button"
                className={`modal-tab-btn ${detailsTab === 'business' ? 'is-active' : ''}`}
                onClick={() => setDetailsTab('business')}
              >
                2. Business Information
              </button>
              <button
                type="button"
                className={`modal-tab-btn ${detailsTab === 'account' ? 'is-active' : ''}`}
                onClick={() => setDetailsTab('account')}
              >
                3. Account Information
              </button>
            </div>

            {modalError && (
              <div className="product-alert alert-error" style={{ margin: '16px 20px 0' }}>
                <span>⚠️ {modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                {/* TAB 1: PERSONAL INFORMATION */}
                {detailsTab === 'personal' && (
                  <div className="modal-tab-pane">
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>First Name *</label>
                        <input
                          type="text"
                          required
                          disabled={!isEditing}
                          value={editFormData.first_name || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, first_name: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Last Name</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={editFormData.last_name || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, last_name: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          required
                          disabled={!isEditing}
                          value={editFormData.email || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, email: e.target.value })
                          }
                        />
                        <span className="field-hint">Primary login credential in the auth table.</span>
                      </div>

                      <div className="form-field">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          placeholder="+1 (555) 000-0000"
                          value={editFormData.phone || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BUSINESS INFORMATION */}
                {detailsTab === 'business' && (
                  <div className="modal-tab-pane">
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>Business Name</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          placeholder="e.g. Acme Corporation Ltd."
                          value={editFormData.business_name || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, business_name: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Business Type</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          placeholder="e.g. Enterprise, Startup, SMB, Retail"
                          value={editFormData.business_type || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, business_type: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field full-width">
                        <label>Street Address</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          placeholder="Suite, Building, Street address"
                          value={editFormData.address || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, address: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>City</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={editFormData.city || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, city: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>State / Province</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={editFormData.state || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, state: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Country</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={editFormData.country || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, country: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Postal Code</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={editFormData.postal_code || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, postal_code: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ACCOUNT INFORMATION */}
                {detailsTab === 'account' && (
                  <div className="modal-tab-pane">
                    <div className="account-details-grid">
                      <div className="account-info-row">
                        <span className="info-row-label">User Profile UUID:</span>
                        <code className="info-row-code">{selectedCustomer.id}</code>
                      </div>

                      <div className="account-info-row">
                        <span className="info-row-label">Auth Identity UUID:</span>
                        <code className="info-row-code">{selectedCustomer.auth_id}</code>
                      </div>

                      <div className="account-info-row">
                        <span className="info-row-label">Registration Date:</span>
                        <span className="info-row-value">
                          {selectedCustomer.registration_date
                            ? new Date(selectedCustomer.registration_date).toLocaleString()
                            : '—'}
                        </span>
                      </div>

                      <div className="account-info-row">
                        <span className="info-row-label">Last Profile Update:</span>
                        <span className="info-row-value">
                          {selectedCustomer.last_updated_date
                            ? new Date(selectedCustomer.last_updated_date).toLocaleString()
                            : '—'}
                        </span>
                      </div>

                      <div className="account-info-row">
                        <span className="info-row-label">Email Verified:</span>
                        <span className="info-row-value">
                          {selectedCustomer.email_verified ? 'Yes (Verified)' : 'No (Pending)'}
                        </span>
                      </div>
                    </div>

                    <div className="form-toggle-field" style={{ marginTop: '16px' }}>
                      <label className="toggle-switch-label">
                        <input
                          type="checkbox"
                          disabled={!isEditing}
                          checked={editFormData.is_active}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, is_active: e.target.checked })
                          }
                        />
                        <span className="toggle-slider" />
                        <span className="toggle-text">
                          <b>Account Status:</b>{' '}
                          {editFormData.is_active
                            ? 'Active (Authorized to log in)'
                            : 'Deactivated (Login blocked)'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn-primary-action"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Customer Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={saveLoading}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-action"
                      disabled={saveLoading}
                    >
                      {saveLoading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS TOGGLE CONFIRMATION MODAL */}
      {statusActionCustomer && (
        <div
          className="modal-backdrop"
          onClick={() => !statusLoading && setStatusActionCustomer(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {statusActionCustomer.is_active ? 'Deactivate Customer' : 'Activate Customer'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !statusLoading && setStatusActionCustomer(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="delete-warning-text">
                Are you sure you want to {statusActionCustomer.is_active ? 'deactivate' : 'activate'} the customer account for{' '}
                <b>{statusActionCustomer.full_name || statusActionCustomer.email}</b>?
              </p>
              <p className="delete-subtext">
                {statusActionCustomer.is_active
                  ? 'Deactivating this account will immediately revoke portal access and prevent this customer from logging in.'
                  : 'Activating this account will restore full portal access and permit login.'}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                disabled={statusLoading}
                onClick={() => setStatusActionCustomer(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={statusActionCustomer.is_active ? 'btn-danger' : 'btn-primary-action'}
                disabled={statusLoading}
                onClick={handleConfirmStatusToggle}
              >
                {statusLoading
                  ? 'Updating...'
                  : statusActionCustomer.is_active
                  ? 'Yes, Deactivate Account'
                  : 'Yes, Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
