import React from 'react';
import { AdminIcon } from '../AdminIcons';

export function Breadcrumbs({ items = [], onNavigate }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="breadcrumb-item">
              {index > 0 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  <AdminIcon name="chevronRight" size={13} />
                </span>
              )}

              {isLast || !item.path ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.path}
                  className="breadcrumb-link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate(item.path);
                  }}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
