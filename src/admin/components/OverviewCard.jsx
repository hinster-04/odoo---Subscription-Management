import React from 'react';
import { AdminIcon } from '../AdminIcons';

export function OverviewCard({
  title,
  value,
  subtext,
  change,
  isPositive = true,
  icon,
  badgeText
}) {
  return (
    <div className="admin-overview-card">
      <div className="card-header-row">
        <span className="card-title">{title}</span>
        {icon && (
          <div className="card-icon-pill">
            <AdminIcon name={icon} size={18} />
          </div>
        )}
      </div>

      <div className="card-value-row">
        <span className="card-value">{value}</span>
      </div>

      <div className="card-footer-row">
        {change && (
          <span
            className={`card-trend-badge ${
              isPositive ? 'trend-positive' : 'trend-negative'
            }`}
          >
            <AdminIcon
              name={isPositive ? 'trendUp' : 'trendDown'}
              size={13}
            />
            <span>{change}</span>
          </span>
        )}

        {badgeText && !change && (
          <span className="card-meta-badge">{badgeText}</span>
        )}

        {subtext && <span className="card-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
