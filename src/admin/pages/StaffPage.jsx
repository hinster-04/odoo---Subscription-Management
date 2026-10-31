import React, { useState, useEffect, useCallback } from 'react';
import { peopleApi } from '../services/peopleApi';
import { AdminIcon } from '../AdminIcons';

export function StaffPage({ onNavigate }) {
  // --- Main State ---
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // --- Filtering & Pagination State ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [designationFilter, setDesignationFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // --- Metadata & Summary ---
  const [metadata, setMetadata] = useState({
    designations: [],
    counts: { total: 0, admins: 0, staff: 0, active: 0, inactive: 0 }
  });

  // --- Add Staff Modal State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: 'Support Specialist',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  // --- Edit Staff Modal State ---
  const [editingStaff, setEditingStaff] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // --- Status Toggle Confirmation Modal ---
  const [statusActionStaff, setStatusActionStaff] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Load Metadata
  const loadMetadata = useCallback(async () => {
    try {
      const res = await peopleApi.getStaffMetadata();
      if (res.data) {
        setMetadata(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Fetch Staff List
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await peopleApi.getStaff({
        search,
        status: statusFilter,
        designation: designationFilter,
        role: roleFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize
      });

      if (res.status === 'success') {
        setStaffList(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
      setError(err.message || 'Unable to load staff members from database.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, designationFilter, roleFilter, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Open Add Staff Modal
  const handleOpenAddModal = () => {
    setAddFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      designation: 'Support Specialist',
      password: ''
    });
    setShowPassword(false);
    setAddError(null);
    setIsAddModalOpen(true);
  };

  // Submit Add Staff Form
  const handleSaveNewStaff = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      if (!addFormData.first_name.trim()) {
        throw new Error('First name is required.');
      }
      if (!addFormData.email.trim()) {
        throw new Error('Email is required.');
      }
      if (!addFormData.designation.trim()) {
        throw new Error('Designation is required.');
      }
      if (!addFormData.password || addFormData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const res = await peopleApi.createStaff(addFormData);
      setSuccessToast(`Staff member "${res.data.full_name}" created successfully.`);
      setIsAddModalOpen(false);
      fetchStaff();
      loadMetadata();
    } catch (err) {
      setAddError(err.message || 'Failed to create staff account.');
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Staff Modal
  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setEditFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      designation: staff.designation || '',
      is_active: staff.is_active ?? true
    });
    setEditError(null);
  };

  // Submit Edit Staff Form
  const handleSaveEditStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError(null);
    setEditLoading(true);

    try {
      if (!editFormData.first_name.trim()) {
        throw new Error('First name is required.');
      }
      if (!editFormData.email.trim()) {
        throw new Error('Email is required.');
      }
      if (!editFormData.designation.trim()) {
        throw new Error('Designation is required.');
      }

      const res = await peopleApi.updateStaff(editingStaff.id, editFormData);
      setSuccessToast(`Staff profile for "${res.data.full_name}" updated successfully.`);
      setEditingStaff(null);
      fetchStaff();
      loadMetadata();
    } catch (err) {
      setEditError(err.message || 'Failed to update staff member details.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle status toggle (Activate/Deactivate)
  const handleConfirmStatusToggle = async () => {
    if (!statusActionStaff) return;
    setStatusLoading(true);
    try {
      const nextStatus = !statusActionStaff.is_active;
      const res = await peopleApi.toggleStaffStatus(statusActionStaff.id, nextStatus);
      setSuccessToast(res.message || `Staff account ${nextStatus ? 'activated' : 'deactivated'}.`);
      setStatusActionStaff(null);
      fetchStaff();
      loadMetadata();
    } catch (err) {
      setError(err.message || 'Failed to update staff account status.');
      setStatusActionStaff(null);
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
          <h1 className="products-view-title">Staff Management</h1>
          <p className="products-view-subtitle">
            Manage administrative team members, assign operational designations, provision staff accounts, and control system access.
          </p>
        </div>

        <div className="header-action-group">
          <button
            type="button"
            className="btn-refresh"
            onClick={() => {
              fetchStaff();
              loadMetadata();
            }}
            title="Refresh staff list"
          >
            <AdminIcon name="subscriptions" size={16} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenAddModal}
          >
            <span className="btn-icon">+</span>
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="products-metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Internal Team Members</div>
          <div className="metric-value">{metadata.counts?.total || staffList.length}</div>
          <div className="metric-meta">
            {metadata.counts?.admins || 0} Admins • {metadata.counts?.staff || 0} Staff
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Team Status</div>
          <div className="metric-value text-emerald">
            {metadata.counts?.active ?? staffList.filter((s) => s.is_active).length}
          </div>
          <div className="metric-meta text-emerald">Authorized with active access tokens</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Deactivated Team</div>
          <div className="metric-value text-muted">
            {metadata.counts?.inactive ?? staffList.filter((s) => !s.is_active).length}
          </div>
          <div className="metric-meta">Access currently revoked</div>
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
            placeholder="Search by staff name, email, designation, phone..."
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

          {/* Role Filter */}
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Staff Members</option>
          </select>

          {/* Designation Filter */}
          <select
            className="filter-select"
            value={designationFilter}
            onChange={(e) => {
              setDesignationFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Designations</option>
            {metadata.designations.map((desig) => (
              <option key={desig} value={desig}>
                {desig}
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
            <option value="created_at:desc">Newest Added</option>
            <option value="created_at:asc">Oldest Added</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="designation:asc">Designation (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Staff Data Table */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="loading-spinner" />
            <p>Loading staff records from Neon PostgreSQL database...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">
              <AdminIcon name="staff" size={48} />
            </div>
            <h3>No staff members found</h3>
            <p>
              {search || statusFilter !== 'all' || designationFilter !== 'all' || roleFilter !== 'all'
                ? 'No staff records matched your search or filter settings.'
                : 'No staff accounts exist in the database yet. Click below to add staff.'}
            </p>
            <div className="empty-actions">
              {(search || statusFilter !== 'all' || designationFilter !== 'all' || roleFilter !== 'all') && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setDesignationFilter('all');
                    setRoleFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleOpenAddModal}
              >
                + Add Staff Member
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="products-data-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Email Address</th>
                  <th>Designation</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id}>
                    <td className="product-cell-name">
                      <div className="customer-avatar-name">
                        <div
                          className={`customer-initials-badge ${
                            s.role === 'admin' ? 'admin-badge-color' : ''
                          }`}
                        >
                          {(s.first_name?.[0] || 'S').toUpperCase()}
                          {(s.last_name?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <span
                            className="product-name-link"
                            onClick={() => handleOpenEditModal(s)}
                          >
                            {s.full_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <a href={`mailto:${s.email}`} className="customer-email-link">
                        {s.email}
                      </a>
                    </td>

                    <td>
                      <span className="category-pill">{s.designation || 'Staff'}</span>
                    </td>

                    <td>
                      <span
                        className={`role-pill ${
                          s.role === 'admin' ? 'role-admin' : 'role-staff'
                        }`}
                      >
                        {s.role === 'admin' ? 'Administrator' : 'Staff'}
                      </span>
                    </td>

                    <td className="text-muted">{s.phone || <span className="text-muted">—</span>}</td>

                    <td>
                      <span
                        className={`status-pill ${
                          s.is_active ? 'status-active' : 'status-inactive'
                        }`}
                      >
                        <span className="status-dot" />
                        {s.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="text-muted text-sm">
                      {s.date_added ? new Date(s.date_added).toLocaleDateString() : '—'}
                    </td>

                    <td className="text-right">
                      <div className="table-actions-inline">
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          onClick={() => handleOpenEditModal(s)}
                          title="Edit staff details"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`action-btn ${s.is_active ? 'delete-btn' : 'btn-activate'}`}
                          onClick={() => setStatusActionStaff(s)}
                          title={s.is_active ? 'Deactivate staff account' : 'Activate staff account'}
                        >
                          {s.is_active ? 'Deactivate' : 'Activate'}
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
        {staffList.length > 0 && (
          <div className="table-pagination-footer">
            <div className="pagination-info">
              Showing <b>{(currentPage - 1) * pageSize + 1}</b> to{' '}
              <b>{Math.min(currentPage * pageSize, pagination.total)}</b> of{' '}
              <b>{pagination.total}</b> staff members
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

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !addLoading && setIsAddModalOpen(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Staff Member</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !addLoading && setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff}>
              <div className="modal-body">
                {addError && (
                  <div className="product-alert alert-error">
                    <span>⚠️ {addError}</span>
                  </div>
                )}

                <div className="admin-privilege-notice">
                  <span>🛡️ <b>Admin Access:</b> This form creates internal staff accounts in the <code>auth</code> and <code>admin</code> tables with the <code>staff</code> role automatically assigned.</span>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marcus"
                      value={addFormData.first_name}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, first_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vance"
                      value={addFormData.last_name}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, last_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Work Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="marcus.vance@brightloop.dev"
                      value={addFormData.email}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, email: e.target.value })
                      }
                    />
                    <span className="field-hint">Must be unique across the organization.</span>
                  </div>

                  <div className="form-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 123-4567"
                      value={addFormData.phone}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Designation / Role Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Support Specialist, Customer Success Lead, Operations Analyst"
                      value={addFormData.designation}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, designation: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Temporary Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder="Create a strong password (min 8 characters)"
                        value={addFormData.password}
                        onChange={(e) =>
                          setAddFormData({ ...addFormData, password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <span className="field-hint">
                      Stored securely using bcrypt with 12 salt rounds in the auth table.
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={addLoading}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={addLoading}
                >
                  {addLoading ? 'Creating Account...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div
          className="modal-backdrop"
          onClick={() => !editLoading && setEditingStaff(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Staff Member</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !editLoading && setEditingStaff(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff}>
              <div className="modal-body">
                {editError && (
                  <div className="product-alert alert-error">
                    <span>⚠️ {editError}</span>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.first_name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, first_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Last Name</label>
                    <input
                      type="text"
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
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={editFormData.phone || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Designation *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.designation}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, designation: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-toggle-field" style={{ marginTop: '12px' }}>
                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={editFormData.is_active}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, is_active: e.target.checked })
                      }
                    />
                    <span className="toggle-slider" />
                    <span className="toggle-text">
                      <b>Staff Account Status:</b>{' '}
                      {editFormData.is_active ? 'Active (Authorized to login)' : 'Deactivated'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={editLoading}
                  onClick={() => setEditingStaff(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS TOGGLE CONFIRMATION MODAL */}
      {statusActionStaff && (
        <div
          className="modal-backdrop"
          onClick={() => !statusLoading && setStatusActionStaff(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {statusActionStaff.is_active ? 'Deactivate Staff Member' : 'Activate Staff Member'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !statusLoading && setStatusActionStaff(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="delete-warning-text">
                Are you sure you want to {statusActionStaff.is_active ? 'deactivate' : 'activate'}{' '}
                <b>{statusActionStaff.full_name}</b> ({statusActionStaff.email})?
              </p>
              <p className="delete-subtext">
                {statusActionStaff.is_active
                  ? 'Deactivating this staff member will immediately block their administrative access.'
                  : 'Activating this account will restore administrative login capabilities.'}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                disabled={statusLoading}
                onClick={() => setStatusActionStaff(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={statusActionStaff.is_active ? 'btn-danger' : 'btn-primary-action'}
                disabled={statusLoading}
                onClick={handleConfirmStatusToggle}
              >
                {statusLoading
                  ? 'Updating...'
                  : statusActionStaff.is_active
                  ? 'Yes, Deactivate Staff'
                  : 'Yes, Activate Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
