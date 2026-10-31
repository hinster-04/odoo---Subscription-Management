import React from 'react';
import { AdminIcon } from '../AdminIcons';

export function EmptyAdminPage({ route }) {
  return (
    <div className="admin-empty-page" data-page={route?.id}>
      <div className="empty-page-canvas">
        <div className="empty-page-inner">
          <div className="empty-icon-wrap">
            <AdminIcon name={route?.icon || 'emptyBox'} size={28} />
          </div>
          <h2 className="empty-title">{route?.label} Module</h2>
          <p className="empty-desc">
            This module route is registered and ready for development in the upcoming step.
          </p>
        </div>
      </div>
    </div>
  );
}
