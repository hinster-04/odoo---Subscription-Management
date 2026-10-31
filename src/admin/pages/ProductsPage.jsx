import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { productApi } from '../services/productApi';
import { AdminIcon } from '../AdminIcons';

// Available categories and product types for suggestions
const DEFAULT_CATEGORIES = [
  'ERP',
  'CRM',
  'HRM',
  'Accounting & Invoicing',
  'Inventory Management',
  'Customer Support',
  'Project Management',
  'Business Intelligence',
  'Security & Compliance'
];

const DEFAULT_PRODUCT_TYPES = [
  'Cloud SaaS',
  'On-Premise Enterprise',
  'Hybrid Deployment',
  'Desktop License',
  'API Microservice'
];

export function ProductsPage({ onNavigate, initialTab }) {
  // --- Main State ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // --- Filter & Pagination State ---
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // --- Dynamic Filter Metadata ---
  const [filterMeta, setFilterMeta] = useState({ categories: [], product_types: [] });

  // --- Details / Edit / Create View State ---
  // viewMode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState('list');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'general'); // 'general' | 'variants' | 'addons'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // --- Delete Modal State ---
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Sub-Modals for Variants & Add-ons ---
  const [variantModal, setVariantModal] = useState({ isOpen: false, isEditing: false, data: null });
  const [addonModal, setAddonModal] = useState({ isOpen: false, isEditing: false, data: null });
  const [subModalError, setSubModalError] = useState(null);
  const [subModalLoading, setSubModalLoading] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Load Filter Metadata once
  useEffect(() => {
    productApi
      .getFilterMetadata()
      .then((res) => {
        if (res.data) {
          setFilterMeta(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load filter metadata:', err);
      });
  }, []);

  // Fetch Products List
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.getProducts({
        search,
        category: selectedCategory,
        product_type: selectedType,
        is_active: selectedStatus,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize
      });

      if (res.status === 'success') {
        setProducts(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Unable to connect to the backend server. Please verify the database connection.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedType, selectedStatus, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchProducts();
    }
  }, [fetchProducts, viewMode]);

  // Fetch Single Product Details
  const fetchProductDetails = useCallback(async (id) => {
    setDetailsLoading(true);
    try {
      const res = await productApi.getProductById(id);
      if (res.data) {
        setSelectedProduct(res.data);
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError(err.message || 'Failed to load product details.');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // Handle switching to Edit Mode
  const handleEditProduct = (product, targetTab = 'general') => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);
    setActiveTab(targetTab);
    setViewMode('edit');
    fetchProductDetails(product.id);
  };

  // Handle Create Product Click
  const handleStartCreate = () => {
    setSelectedProductId(null);
    setSelectedProduct({
      name: '',
      slug: '',
      category: 'ERP',
      product_type: 'Cloud SaaS',
      description: '',
      sales_price: 99.00,
      cost_price: 25.00,
      notes: '',
      image_url: '',
      is_active: true,
      variants: [],
      addons: []
    });
    setActiveTab('general');
    setViewMode('create');
  };

  // Handle Back to List
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProductId(null);
    setSelectedProduct(null);
    fetchProducts();
  };

  // Delete Product Handler
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await productApi.deleteProduct(productToDelete.id);
      setSuccessToast(`Product "${productToDelete.name}" deleted successfully.`);
      setProductToDelete(null);
      if (viewMode !== 'list') {
        handleBackToList();
      } else {
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Combined Category List
  const allCategories = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...(filterMeta.categories || [])]);
    return Array.from(set);
  }, [filterMeta.categories]);

  // Combined Product Types List
  const allProductTypes = useMemo(() => {
    const set = new Set([...DEFAULT_PRODUCT_TYPES, ...(filterMeta.product_types || [])]);
    return Array.from(set);
  }, [filterMeta.product_types]);

  return (
    <div className="products-module-root">
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

      {/* VIEW MODE 1: PRODUCTS LIST VIEW */}
      {viewMode === 'list' && (
        <div className="products-list-view">
          {/* Header Action Bar */}
          <div className="products-view-header">
            <div>
              <h1 className="products-view-title">Products & Catalog</h1>
              <p className="products-view-subtitle">
                Manage your software products, licensing tiers, deployment variants, and optional add-ons.
              </p>
            </div>

            <div className="header-action-group">
              <button
                type="button"
                className="btn-refresh"
                onClick={fetchProducts}
                title="Refresh products list"
                aria-label="Refresh products"
              >
                <AdminIcon name="subscriptions" size={16} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                className="btn-primary-action"
                onClick={handleStartCreate}
              >
                <span className="btn-icon">+</span>
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="products-metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Catalog Products</div>
              <div className="metric-value">{pagination.total || products.length}</div>
              <div className="metric-meta">Across {allCategories.length} product suites</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Active For Sale</div>
              <div className="metric-value">
                {products.filter((p) => p.is_active).length}
                <span className="metric-sub-val">/ {products.length} on page</span>
              </div>
              <div className="metric-meta text-emerald">Available for customer subscriptions</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Average Sales Price</div>
              <div className="metric-value">
                $
                {products.length > 0
                  ? (
                      products.reduce((acc, p) => acc + (p.sales_price || 0), 0) / products.length
                    ).toFixed(2)
                  : '0.00'}
              </div>
              <div className="metric-meta">Standard base price tier</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="products-filter-toolbar">
            <div className="search-input-box">
              <span className="search-icon">
                <AdminIcon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder="Search products by name, slug, description..."
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
              {/* Category Filter */}
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Product Type Filter */}
              <select
                className="filter-select"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Product Types</option>
                {allProductTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              {/* Sorting Filter */}
              <select
                className="filter-select"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="created_at:desc">Newest First</option>
                <option value="created_at:asc">Oldest First</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="sales_price:desc">Price (High to Low)</option>
                <option value="sales_price:asc">Price (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Products Table Container */}
          <div className="table-card">
            {loading ? (
              <div className="table-loading-state">
                <div className="loading-spinner" />
                <p>Loading products catalog from Neon PostgreSQL...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="table-empty-state">
                <div className="empty-state-icon">
                  <AdminIcon name="emptyBox" size={48} />
                </div>
                <h3>No products found</h3>
                <p>
                  {search || selectedCategory !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
                    ? 'No products matched your active filters. Try resetting search or filter criteria.'
                    : 'Your software catalog is currently empty. Create your first product to get started.'}
                </p>
                <div className="empty-actions">
                  {(search || selectedCategory !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setSearch('');
                        setSelectedCategory('all');
                        setSelectedType('all');
                        setSelectedStatus('all');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={handleStartCreate}
                  >
                    + Create Product
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="products-data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Sales Price</th>
                      <th>Cost Price</th>
                      <th>Variants</th>
                      <th>Add-ons</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="product-row">
                        <td className="product-cell-name">
                          <div className="product-title-row">
                            <span className="product-name-link" onClick={() => handleEditProduct(p)}>
                              {p.name}
                            </span>
                            <span className="product-slug-pill">{p.slug}</span>
                          </div>
                          {p.description && (
                            <div className="product-desc-truncate">{p.description}</div>
                          )}
                        </td>

                        <td>
                          <span className="category-pill">{p.category || 'General'}</span>
                        </td>

                        <td>
                          <span className="type-badge">{p.product_type || 'Software'}</span>
                        </td>

                        <td className="font-semibold text-navy">
                          ${parseFloat(p.sales_price || 0).toFixed(2)}
                        </td>

                        <td className="text-muted">
                          ${parseFloat(p.cost_price || 0).toFixed(2)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="badge-link"
                            onClick={() => handleEditProduct(p, 'variants')}
                            title="Manage Variants"
                          >
                            <AdminIcon name="variants" size={13} />
                            <span>{p.variants_count || 0} variants</span>
                          </button>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="badge-link"
                            onClick={() => handleEditProduct(p, 'addons')}
                            title="Manage Add-ons"
                          >
                            <AdminIcon name="addons" size={13} />
                            <span>{p.addons_count || 0} add-ons</span>
                          </button>
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              p.is_active ? 'status-active' : 'status-inactive'
                            }`}
                          >
                            <span className="status-dot" />
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="text-muted text-sm">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                        </td>

                        <td className="text-right">
                          <div className="table-actions-inline">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => handleEditProduct(p)}
                              title="Edit product, variants & add-ons"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => setProductToDelete(p)}
                              title="Delete product"
                            >
                              Delete
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
            {products.length > 0 && (
              <div className="table-pagination-footer">
                <div className="pagination-info">
                  Showing <b>{(currentPage - 1) * pageSize + 1}</b> to{' '}
                  <b>{Math.min(currentPage * pageSize, pagination.total)}</b> of{' '}
                  <b>{pagination.total}</b> products
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
        </div>
      )}

      {/* VIEW MODE 2 & 3: CREATE / EDIT PRODUCT WITH TABS */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <ProductDetailTabsView
          viewMode={viewMode}
          product={selectedProduct}
          detailsLoading={detailsLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={handleBackToList}
          onProductUpdated={(updated) => {
            setSelectedProduct(updated);
            setSuccessToast('Product details saved successfully.');
          }}
          onDelete={() => setProductToDelete(selectedProduct)}
          onRefreshDetails={() => fetchProductDetails(selectedProduct.id)}
          allCategories={allCategories}
          allProductTypes={allProductTypes}
          variantModal={variantModal}
          setVariantModal={setVariantModal}
          addonModal={addonModal}
          setAddonModal={setAddonModal}
          subModalError={subModalError}
          setSubModalError={setSubModalError}
          subModalLoading={subModalLoading}
          setSubModalLoading={setSubModalLoading}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setProductToDelete(null)}>
          <div className="modal-dialog delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Product</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !isDeleting && setProductToDelete(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="delete-warning-text">
                Are you sure you want to delete product <b>"{productToDelete.name}"</b>?
              </p>
              <div className="delete-impact-box">
                <div className="impact-item">
                  <span className="impact-bullet">•</span>
                  <span>
                    Product Slug: <code>{productToDelete.slug}</code>
                  </span>
                </div>
                {(productToDelete.variants_count > 0 || (productToDelete.variants && productToDelete.variants.length > 0)) && (
                  <div className="impact-item text-amber">
                    <span className="impact-bullet">•</span>
                    <span>
                      Contains {productToDelete.variants_count || productToDelete.variants.length} associated product variants.
                    </span>
                  </div>
                )}
                {(productToDelete.addons_count > 0 || (productToDelete.addons && productToDelete.addons.length > 0)) && (
                  <div className="impact-item text-amber">
                    <span className="impact-bullet">•</span>
                    <span>
                      Contains {productToDelete.addons_count || productToDelete.addons.length} associated product add-ons.
                    </span>
                  </div>
                )}
              </div>
              <p className="delete-subtext">
                This action is permanent and will safely remove the product and all associated variants and add-ons from the database.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isDeleting}
                onClick={confirmDeleteProduct}
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: PRODUCT DETAILS TABS VIEW (GENERAL, VARIANTS, ADD-ONS)
// =============================================================================
function ProductDetailTabsView({
  viewMode,
  product,
  detailsLoading,
  activeTab,
  setActiveTab,
  onBack,
  onProductUpdated,
  onDelete,
  onRefreshDetails,
  allCategories,
  allProductTypes,
  variantModal,
  setVariantModal,
  addonModal,
  setAddonModal,
  subModalError,
  setSubModalError,
  subModalLoading,
  setSubModalLoading
}) {
  const isCreate = viewMode === 'create';

  // Form State for General Info
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    category: product?.category || 'ERP',
    product_type: product?.product_type || 'Cloud SaaS',
    description: product?.description || '',
    sales_price: product?.sales_price ?? 99.00,
    cost_price: product?.cost_price ?? 25.00,
    notes: product?.notes || '',
    image_url: product?.image_url || '',
    is_active: product?.is_active ?? true
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        category: product.category || 'ERP',
        product_type: product.product_type || 'Cloud SaaS',
        description: product.description || '',
        sales_price: product.sales_price ?? 0,
        cost_price: product.cost_price ?? 0,
        notes: product.notes || '',
        image_url: product.image_url || '',
        is_active: product.is_active ?? true
      });
    }
  }, [product]);

  // Auto-generate slug on name change in create mode
  const handleNameChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, name: val };
      if (isCreate && (!prev.slug || prev.slug === slugify(prev.name))) {
        updated.slug = slugify(val);
      }
      return updated;
    });
  };

  const slugify = (text) =>
    (text || '')
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // Submit General Information Form
  const handleSaveGeneralInfo = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Product name is required.');
      }
      if (!formData.slug.trim()) {
        throw new Error('Product slug is required.');
      }
      if (parseFloat(formData.sales_price) < 0) {
        throw new Error('Sales price must be a non-negative number.');
      }
      if (parseFloat(formData.cost_price) < 0) {
        throw new Error('Cost price must be a non-negative number.');
      }

      if (isCreate) {
        const res = await productApi.createProduct(formData);
        if (res.data) {
          onProductUpdated(res.data);
        }
      } else {
        const res = await productApi.updateProduct(product.id, formData);
        if (res.data) {
          onProductUpdated({ ...product, ...res.data });
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save product general information.');
    } finally {
      setSaving(false);
    }
  };

  // Variant Modal Handlers
  const handleOpenAddVariant = () => {
    setSubModalError(null);
    setVariantModal({
      isOpen: true,
      isEditing: false,
      data: {
        variant_name: '',
        variant_value: '',
        price_adjustment: 0,
        is_active: true
      }
    });
  };

  const handleOpenEditVariant = (variant) => {
    setSubModalError(null);
    setVariantModal({
      isOpen: true,
      isEditing: true,
      data: { ...variant }
    });
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    setSubModalError(null);
    setSubModalLoading(true);

    try {
      const { variant_name, variant_value, price_adjustment, is_active } = variantModal.data;
      if (!variant_name.trim()) throw new Error('Variant name is required.');
      if (!variant_value.trim()) throw new Error('Variant value is required.');

      const adj = parseFloat(price_adjustment);
      if (isNaN(adj)) throw new Error('Price adjustment must be a valid number.');

      const currentSalesPrice = parseFloat(product.sales_price || 0);
      const effectivePrice = currentSalesPrice + adj;
      if (effectivePrice < 0) {
        throw new Error(
          `Effective price cannot be negative ($${currentSalesPrice.toFixed(2)} + $${adj.toFixed(2)} = $${effectivePrice.toFixed(2)} < 0).`
        );
      }

      if (variantModal.isEditing) {
        await productApi.updateVariant(product.id, variantModal.data.id, {
          variant_name,
          variant_value,
          price_adjustment: adj,
          is_active
        });
      } else {
        await productApi.createVariant(product.id, {
          variant_name,
          variant_value,
          price_adjustment: adj,
          is_active
        });
      }

      setVariantModal({ isOpen: false, isEditing: false, data: null });
      onRefreshDetails();
    } catch (err) {
      setSubModalError(err.message || 'Failed to save variant.');
    } finally {
      setSubModalLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    try {
      await productApi.deleteVariant(product.id, variantId);
      onRefreshDetails();
    } catch (err) {
      alert(err.message || 'Failed to delete variant.');
    }
  };

  // Add-on Modal Handlers
  const handleOpenAddAddon = () => {
    setSubModalError(null);
    setAddonModal({
      isOpen: true,
      isEditing: false,
      data: {
        name: '',
        description: '',
        price: 29.00,
        cost_price: 5.00,
        is_active: true
      }
    });
  };

  const handleOpenEditAddon = (addon) => {
    setSubModalError(null);
    setAddonModal({
      isOpen: true,
      isEditing: true,
      data: { ...addon }
    });
  };

  const handleSaveAddon = async (e) => {
    e.preventDefault();
    setSubModalError(null);
    setSubModalLoading(true);

    try {
      const { name, description, price, cost_price, is_active } = addonModal.data;
      if (!name.trim()) throw new Error('Add-on name is required.');
      const p = parseFloat(price);
      if (isNaN(p) || p < 0) throw new Error('Price must be a non-negative number.');
      const cp = parseFloat(cost_price);
      if (isNaN(cp) || cp < 0) throw new Error('Cost price must be a non-negative number.');

      if (addonModal.isEditing) {
        await productApi.updateAddon(product.id, addonModal.data.id, {
          name,
          description,
          price: p,
          cost_price: cp,
          is_active
        });
      } else {
        await productApi.createAddon(product.id, {
          name,
          description,
          price: p,
          cost_price: cp,
          is_active
        });
      }

      setAddonModal({ isOpen: false, isEditing: false, data: null });
      onRefreshDetails();
    } catch (err) {
      setSubModalError(err.message || 'Failed to save add-on.');
    } finally {
      setSubModalLoading(false);
    }
  };

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm('Are you sure you want to delete this add-on?')) return;
    try {
      await productApi.deleteAddon(product.id, addonId);
      onRefreshDetails();
    } catch (err) {
      alert(err.message || 'Failed to delete add-on.');
    }
  };

  const variantsList = product?.variants || [];
  const addonsList = product?.addons || [];

  return (
    <div className="product-details-view">
      {/* Top Navigation & Title Bar */}
      <div className="details-header-bar">
        <div className="details-header-left">
          <button type="button" className="btn-back" onClick={onBack}>
            ← Back to Products
          </button>
          <div className="details-title-group">
            <h1 className="details-title">
              {isCreate ? 'Create New Product' : product?.name || 'Product Details'}
            </h1>
            {!isCreate && product?.slug && (
              <span className="product-slug-pill">{product.slug}</span>
            )}
          </div>
        </div>

        {!isCreate && (
          <div className="details-header-actions">
            <button
              type="button"
              className="btn-delete-product"
              onClick={onDelete}
              title="Delete entire product"
            >
              Delete Product
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="product-tabs-container">
        <div className="product-tabs-nav" role="tablist">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'general' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('general')}
            role="tab"
            aria-selected={activeTab === 'general'}
          >
            <span className="tab-icon">
              <AdminIcon name="products" size={16} />
            </span>
            <span>1. General Information</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'variants' ? 'is-active' : ''}`}
            onClick={() => {
              if (isCreate) {
                alert('Please save the product general information first before adding variants.');
                return;
              }
              setActiveTab('variants');
            }}
            role="tab"
            aria-selected={activeTab === 'variants'}
          >
            <span className="tab-icon">
              <AdminIcon name="variants" size={16} />
            </span>
            <span>2. Variants</span>
            {!isCreate && (
              <span className="tab-badge">{variantsList.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'addons' ? 'is-active' : ''}`}
            onClick={() => {
              if (isCreate) {
                alert('Please save the product general information first before adding add-ons.');
                return;
              }
              setActiveTab('addons');
            }}
            role="tab"
            aria-selected={activeTab === 'addons'}
          >
            <span className="tab-icon">
              <AdminIcon name="addons" size={16} />
            </span>
            <span>3. Add-ons</span>
            {!isCreate && (
              <span className="tab-badge">{addonsList.length}</span>
            )}
          </button>
        </div>

        {/* Tab 1: General Information */}
        {activeTab === 'general' && (
          <div className="tab-pane-card" role="tabpanel">
            <div className="tab-pane-header">
              <div>
                <h3 className="tab-pane-title">General Information</h3>
                <p className="tab-pane-subtitle">
                  Configure fundamental product properties, sales pricing, category, and catalog visibility.
                </p>
              </div>
            </div>

            {formError && (
              <div className="product-alert alert-error">
                <span>⚠️ {formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGeneralInfo} className="product-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="prod-name">Product Name *</label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    placeholder="e.g. Brightloop ERP Cloud"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  <span className="field-hint">The commercial display name of this software product.</span>
                </div>

                <div className="form-field">
                  <label htmlFor="prod-slug">Unique Slug *</label>
                  <input
                    id="prod-slug"
                    type="text"
                    required
                    placeholder="e.g. brightloop-erp-cloud"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: slugify(e.target.value) })
                    }
                  />
                  <span className="field-hint">Unique identifier used for URLs and checkout endpoints.</span>
                </div>

                <div className="form-field">
                  <label htmlFor="prod-category">Category</label>
                  <select
                    id="prod-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="prod-type">Product Type</label>
                  <select
                    id="prod-type"
                    value={formData.product_type}
                    onChange={(e) =>
                      setFormData({ ...formData, product_type: e.target.value })
                    }
                  >
                    {allProductTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="prod-sales-price">Sales Price ($) *</label>
                  <div className="currency-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input
                      id="prod-sales-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formData.sales_price}
                      onChange={(e) =>
                        setFormData({ ...formData, sales_price: e.target.value })
                      }
                    />
                  </div>
                  <span className="field-hint">Standard base subscription price before variant adjustments.</span>
                </div>

                <div className="form-field">
                  <label htmlFor="prod-cost-price">Cost Price ($) *</label>
                  <div className="currency-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input
                      id="prod-cost-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formData.cost_price}
                      onChange={(e) =>
                        setFormData({ ...formData, cost_price: e.target.value })
                      }
                    />
                  </div>
                  <span className="field-hint">Internal infrastructure or license unit cost.</span>
                </div>
              </div>

              <div className="form-field full-width">
                <label htmlFor="prod-desc">Description</label>
                <textarea
                  id="prod-desc"
                  rows="3"
                  placeholder="Comprehensive description of the product capabilities, target industries, and key modules..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="prod-notes">Internal Admin Notes</label>
                <textarea
                  id="prod-notes"
                  rows="2"
                  placeholder="Private internal notes for sales reps and admins..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="prod-image">Product Image URL</label>
                <input
                  id="prod-image"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>

              <div className="form-toggle-field">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                  <span className="toggle-text">
                    <b>Product Status:</b> {formData.is_active ? 'Active (Live in Catalog)' : 'Inactive (Draft / Hidden)'}
                  </span>
                </label>
              </div>

              <div className="form-action-bar">
                <button type="submit" className="btn-primary-action" disabled={saving}>
                  {saving ? 'Saving...' : isCreate ? 'Create Product & Continue' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Variants */}
        {activeTab === 'variants' && (
          <div className="tab-pane-card" role="tabpanel">
            <div className="tab-pane-header">
              <div>
                <h3 className="tab-pane-title">Product Variants</h3>
                <p className="tab-pane-subtitle">
                  Configure software editions (e.g. Starter, Pro, Enterprise), cloud regions, and billing tiers. Each variant adjusts the base price (${parseFloat(product.sales_price || 0).toFixed(2)}).
                </p>
              </div>

              <button
                type="button"
                className="btn-primary-action"
                onClick={handleOpenAddVariant}
              >
                + Add Variant
              </button>
            </div>

            {/* Base Price Callout */}
            <div className="pricing-callout-banner">
              <div className="callout-item">
                <span className="callout-label">Base Product Price:</span>
                <span className="callout-value">${parseFloat(product.sales_price || 0).toFixed(2)}</span>
              </div>
              <div className="callout-item">
                <span className="callout-label">Configured Variants:</span>
                <span className="callout-value">{variantsList.length}</span>
              </div>
              <div className="callout-rule">
                Rule: Effective price = Base Price + Price Adjustment. Effective price cannot be negative.
              </div>
            </div>

            {variantsList.length === 0 ? (
              <div className="tab-empty-state">
                <p>No variants configured for this product yet.</p>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={handleOpenAddVariant}
                >
                  + Add First Variant
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="products-data-table sub-table">
                  <thead>
                    <tr>
                      <th>Variant Name</th>
                      <th>Variant Value</th>
                      <th>Price Adjustment</th>
                      <th>Effective Price</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantsList.map((v) => {
                      const adj = parseFloat(v.price_adjustment || 0);
                      const effective = v.effective_price !== undefined ? v.effective_price : (parseFloat(product.sales_price || 0) + adj);

                      return (
                        <tr key={v.id}>
                          <td className="font-semibold text-navy">{v.variant_name}</td>
                          <td>
                            <span className="variant-pill">{v.variant_value}</span>
                          </td>
                          <td className={adj > 0 ? 'text-emerald' : adj < 0 ? 'text-amber' : 'text-muted'}>
                            {adj > 0 ? `+$${adj.toFixed(2)}` : adj < 0 ? `-$${Math.abs(adj).toFixed(2)}` : '$0.00'}
                          </td>
                          <td className="font-semibold text-navy">
                            ${effective.toFixed(2)}
                          </td>
                          <td>
                            <span className={`status-pill ${v.is_active ? 'status-active' : 'status-inactive'}`}>
                              <span className="status-dot" />
                              {v.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="table-actions-inline">
                              <button
                                type="button"
                                className="action-btn edit-btn"
                                onClick={() => handleOpenEditVariant(v)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteVariant(v.id)}
                              >
                                Delete
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
          </div>
        )}

        {/* Tab 3: Add-ons */}
        {activeTab === 'addons' && (
          <div className="tab-pane-card" role="tabpanel">
            <div className="tab-pane-header">
              <div>
                <h3 className="tab-pane-title">Product Add-ons</h3>
                <p className="tab-pane-subtitle">
                  Manage optional add-on licenses, capacity boosts, dedicated SLA packages, and enterprise integrations.
                </p>
              </div>

              <button
                type="button"
                className="btn-primary-action"
                onClick={handleOpenAddAddon}
              >
                + Add Add-on
              </button>
            </div>

            {addonsList.length === 0 ? (
              <div className="tab-empty-state">
                <p>No add-ons associated with this product yet.</p>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={handleOpenAddAddon}
                >
                  + Add First Add-on
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="products-data-table sub-table">
                  <thead>
                    <tr>
                      <th>Add-on Name</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Cost Price</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addonsList.map((a) => (
                      <tr key={a.id}>
                        <td className="font-semibold text-navy">{a.name}</td>
                        <td className="text-muted text-sm">{a.description || '—'}</td>
                        <td className="font-semibold text-navy">${parseFloat(a.price || 0).toFixed(2)}</td>
                        <td className="text-muted">${parseFloat(a.cost_price || 0).toFixed(2)}</td>
                        <td>
                          <span className={`status-pill ${a.is_active ? 'status-active' : 'status-inactive'}`}>
                            <span className="status-dot" />
                            {a.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="table-actions-inline">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => handleOpenEditAddon(a)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteAddon(a.id)}
                            >
                              Delete
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
        )}
      </div>

      {/* MODAL: ADD / EDIT VARIANT */}
      {variantModal.isOpen && (
        <div className="modal-backdrop" onClick={() => !subModalLoading && setVariantModal({ ...variantModal, isOpen: false })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {variantModal.isEditing ? 'Edit Product Variant' : 'Add Product Variant'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setVariantModal({ ...variantModal, isOpen: false })}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveVariant}>
              <div className="modal-body">
                {subModalError && (
                  <div className="product-alert alert-error">
                    <span>⚠️ {subModalError}</span>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="var-name">Variant Name *</label>
                  <input
                    id="var-name"
                    type="text"
                    required
                    placeholder="e.g. License Tier, Cloud Region, Edition"
                    value={variantModal.data.variant_name}
                    onChange={(e) =>
                      setVariantModal({
                        ...variantModal,
                        data: { ...variantModal.data, variant_name: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="var-val">Variant Value *</label>
                  <input
                    id="var-val"
                    type="text"
                    required
                    placeholder="e.g. Enterprise, US-East, Pro"
                    value={variantModal.data.variant_value}
                    onChange={(e) =>
                      setVariantModal({
                        ...variantModal,
                        data: { ...variantModal.data, variant_value: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="var-adj">Price Adjustment ($)</label>
                  <input
                    id="var-adj"
                    type="number"
                    step="0.01"
                    placeholder="0.00 (Positive, Zero, or Negative)"
                    value={variantModal.data.price_adjustment}
                    onChange={(e) =>
                      setVariantModal({
                        ...variantModal,
                        data: { ...variantModal.data, price_adjustment: e.target.value }
                      })
                    }
                  />
                  <span className="field-hint">
                    Supports positive (+50), zero (0), or negative (-20) adjustments.
                  </span>
                </div>

                {/* Live Effective Price preview */}
                <div className="live-effective-price-box">
                  <div className="calc-row">
                    <span>Base Sales Price:</span>
                    <span>${parseFloat(product.sales_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="calc-row">
                    <span>Adjustment:</span>
                    <span>
                      {parseFloat(variantModal.data.price_adjustment || 0) >= 0 ? '+' : ''}
                      ${parseFloat(variantModal.data.price_adjustment || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="calc-divider" />
                  <div className="calc-row calc-total">
                    <span>Effective Price:</span>
                    <span
                      className={
                        parseFloat(product.sales_price || 0) + parseFloat(variantModal.data.price_adjustment || 0) < 0
                          ? 'text-rose font-bold'
                          : 'text-navy font-bold'
                      }
                    >
                      $
                      {(
                        parseFloat(product.sales_price || 0) + parseFloat(variantModal.data.price_adjustment || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(product.sales_price || 0) + parseFloat(variantModal.data.price_adjustment || 0) < 0 && (
                    <div className="calc-error-warning">
                      ⚠️ Effective price cannot be negative! Please adjust price or adjustment amount.
                    </div>
                  )}
                </div>

                <div className="form-toggle-field">
                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={variantModal.data.is_active}
                      onChange={(e) =>
                        setVariantModal({
                          ...variantModal,
                          data: { ...variantModal.data, is_active: e.target.checked }
                        })
                      }
                    />
                    <span className="toggle-slider" />
                    <span className="toggle-text">Active Variant</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={subModalLoading}
                  onClick={() => setVariantModal({ ...variantModal, isOpen: false })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={
                    subModalLoading ||
                    parseFloat(product.sales_price || 0) + parseFloat(variantModal.data.price_adjustment || 0) < 0
                  }
                >
                  {subModalLoading ? 'Saving...' : 'Save Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ADD-ON */}
      {addonModal.isOpen && (
        <div className="modal-backdrop" onClick={() => !subModalLoading && setAddonModal({ ...addonModal, isOpen: false })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {addonModal.isEditing ? 'Edit Product Add-on' : 'Add Product Add-on'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setAddonModal({ ...addonModal, isOpen: false })}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveAddon}>
              <div className="modal-body">
                {subModalError && (
                  <div className="product-alert alert-error">
                    <span>⚠️ {subModalError}</span>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="addon-name">Add-on Name *</label>
                  <input
                    id="addon-name"
                    type="text"
                    required
                    placeholder="e.g. Dedicated Account Manager, 24/7 SLA"
                    value={addonModal.data.name}
                    onChange={(e) =>
                      setAddonModal({
                        ...addonModal,
                        data: { ...addonModal.data, name: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="addon-desc">Description</label>
                  <textarea
                    id="addon-desc"
                    rows="2"
                    placeholder="Explain what this add-on includes..."
                    value={addonModal.data.description}
                    onChange={(e) =>
                      setAddonModal({
                        ...addonModal,
                        data: { ...addonModal.data, description: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="addon-price">Add-on Price ($) *</label>
                    <input
                      id="addon-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={addonModal.data.price}
                      onChange={(e) =>
                        setAddonModal({
                          ...addonModal,
                          data: { ...addonModal.data, price: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="addon-cost">Cost Price ($)</label>
                    <input
                      id="addon-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={addonModal.data.cost_price}
                      onChange={(e) =>
                        setAddonModal({
                          ...addonModal,
                          data: { ...addonModal.data, cost_price: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-toggle-field">
                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={addonModal.data.is_active}
                      onChange={(e) =>
                        setAddonModal({
                          ...addonModal,
                          data: { ...addonModal.data, is_active: e.target.checked }
                        })
                      }
                    />
                    <span className="toggle-slider" />
                    <span className="toggle-text">Active Add-on</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={subModalLoading}
                  onClick={() => setAddonModal({ ...addonModal, isOpen: false })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={subModalLoading}
                >
                  {subModalLoading ? 'Saving...' : 'Save Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
