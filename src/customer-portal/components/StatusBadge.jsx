import React from 'react';

/**
 * Status Badge Component with strictly enforced color mapping:
 * - Draft: grey
 * - Confirmed: orange
 * - Active and Paid: green
 * - Overdue: red
 */
export function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).trim().toLowerCase();

  let modifierClass = 'status-draft';
  if (normalized === 'draft') {
    modifierClass = 'status-draft'; // grey
  } else if (normalized === 'confirmed') {
    modifierClass = 'status-confirmed'; // orange
  } else if (normalized === 'active' || normalized === 'paid') {
    modifierClass = 'status-active'; // green
  } else if (
    normalized === 'overdue' ||
    normalized === 'past due' ||
    normalized === 'past_due' ||
    normalized === 'failed'
  ) {
    modifierClass = 'status-overdue'; // red
  } else if (normalized === 'closed' || normalized === 'expired' || normalized === 'used') {
    modifierClass = 'status-closed'; // neutral grey
  } else if (normalized === 'processing') {
    modifierClass = 'status-confirmed'; // orange
  }

  return (
    <span className={`badge-status ${modifierClass}`}>
      <span className="badge-status-dot" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
