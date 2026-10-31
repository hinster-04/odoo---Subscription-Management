import React, { useState } from 'react';
import { PRODUCTS_CATALOG } from '../mockData';
import { AdminIcon } from '../../admin/AdminIcons';

export function ProductsPage({ onNavigate }) {
  // Store selected variant ID per product
  const [selectedVariants, setSelectedVariants] = useState({
    flow: 'odoo-brand', // default with Odoo to show the +560 feature
    books: 'standard',
    people: 'standard',
    core: 'odoo-brand',
    stock: 'standard',
    projects: 'standard'
  });

  const [notification, setNotification] = useState('');

  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId
    }));
  };

  const handleSelectProduct = (product, finalPrice, variantName) => {
    setNotification(
      `Selected ${product.name} with "${variantName}" for ₹${finalPrice}/mo. Quotation request generated.`
    );
    setTimeout(() => setNotification(''), 5000);
  };

  return (
    <div className="customer-products-page">
      <div className="portal-page-header">
        <div>
          <h2>Available Software Products</h2>
          <p>
            Configure product editions, customize certified deployment variants, and view transparent pricing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#376bf4', backgroundColor: '#eef3ff', padding: '6px 12px', borderRadius: 20, fontWeight: 700, border: '1px solid #d4e1fd' }}>
            ✦ Odoo Certified Integration Available (+₹560)
          </span>
        </div>
      </div>

      {notification && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13.5
          }}
        >
          <span>✓ {notification}</span>
          <button
            type="button"
            onClick={() => setNotification('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="products-portal-grid">
        {PRODUCTS_CATALOG.map((product) => {
          const selectedVarId = selectedVariants[product.id] || product.variants[0].id;
          const currentVariant =
            product.variants.find((v) => v.id === selectedVarId) || product.variants[0];
          const totalMonthlyPrice = product.basePrice + currentVariant.extraPrice;

          return (
            <article key={product.id} className="product-portal-card">
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#eef3ff',
                      color: '#376bf4'
                    }}
                  >
                    <AdminIcon name={product.icon} size={22} />
                  </span>
                  {product.tag && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        padding: '3px 8px',
                        borderRadius: 6
                      }}
                    >
                      {product.tag}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                  {product.category}
                </div>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 19, fontWeight: 800, margin: '0 0 8px', color: '#14213d' }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {product.description}
                </p>

                {/* Variant Selector */}
                <div className="product-variant-selector">
                  <label htmlFor={`variant-${product.id}`}>Deployment Variant</label>
                  <select
                    id={`variant-${product.id}`}
                    className="variant-select-dropdown"
                    value={selectedVarId}
                    onChange={(e) => handleVariantChange(product.id, e.target.value)}
                  >
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.extraPrice > 0 ? `(+₹${v.extraPrice}/mo)` : '(Included)'}
                      </option>
                    ))}
                  </select>

                  {currentVariant.id === 'odoo-brand' && (
                    <div style={{ marginTop: 8, fontSize: 11.5, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>ℹ</span>
                      <span>Selecting the Odoo brand adds ₹560/mo for certified data bridge.</span>
                    </div>
                  )}
                </div>

                {/* Features list */}
                <div style={{ margin: '16px 0' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                    Included Features
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {product.features.map((feature, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#10b981', display: 'flex' }}>
                          <AdminIcon name="check" size={13} />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Price Calculation and Action */}
              <div>
                <div className="price-breakdown-row">
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                      Calculated Price
                    </span>
                    <div className="price-calculation-total">
                      ₹{totalMonthlyPrice.toLocaleString('en-IN')}
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}> / month</span>
                    </div>
                    {currentVariant.extraPrice > 0 && (
                      <small style={{ color: '#64748b', fontSize: 11 }}>
                        Base ₹{product.basePrice} + ₹{currentVariant.extraPrice} {currentVariant.name}
                      </small>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    className="portal-btn portal-btn-secondary portal-btn-sm"
                    onClick={() => onNavigate && onNavigate('/portal/my-quotations')}
                  >
                    View Quotes
                  </button>
                  <button
                    type="button"
                    className="portal-btn portal-btn-primary portal-btn-sm"
                    onClick={() => handleSelectProduct(product, totalMonthlyPrice, currentVariant.name)}
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
