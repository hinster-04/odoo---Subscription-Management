import React, { useState } from 'react';
import { CURRENT_CUSTOMER } from '../mockData';
import { AdminIcon } from '../../admin/AdminIcons';

export function MyAccountPage({ onLogout }) {
  // Account details state (grounded in users and auth tables)
  const [userProfile, setUserProfile] = useState(CURRENT_CUSTOMER);
  const [isEditing, setIsEditing] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Password change state with live validation rules
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Live password validation checks
  const ruleLength = newPw.length > 8;
  const ruleUppercase = /[A-Z]/.test(newPw);
  const ruleLowercase = /[a-z]/.test(newPw);
  const ruleSpecial = /[^A-Za-z0-9]/.test(newPw);
  const isPasswordValid = ruleLength && ruleUppercase && ruleLowercase && ruleSpecial;

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setProfileMessage('Account profile information updated successfully in database.');
    setTimeout(() => setProfileMessage(''), 4000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setPasswordMessage({
        type: 'error',
        text: 'Please satisfy all 4 live password complexity rules before continuing.'
      });
      return;
    }
    if (newPw !== confirmPw) {
      setPasswordMessage({
        type: 'error',
        text: 'Confirmation password does not match new password.'
      });
      return;
    }

    setPasswordMessage({
      type: 'success',
      text: 'Password updated successfully. Your new credentials are now active.'
    });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPasswordMessage(null), 5000);
  };

  return (
    <div className="customer-account-page">
      <div className="portal-page-header">
        <div>
          <h2>My Account & Registered Organization</h2>
          <p>
            Manage company registration records, registered billing addresses, and account security credentials.
          </p>
        </div>
      </div>

      {profileMessage && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 20,
            fontSize: 13.5
          }}
        >
          ✓ {profileMessage}
        </div>
      )}

      {/* Grid: Left = Registered Account Details (users table), Right = Change Password */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Section 1: Registered Account Details */}
        <section className="portal-card" style={{ padding: 24, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 17, fontFamily: 'Manrope, sans-serif' }}>
                Customer Profile (Database Records)
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                Registered on {new Date(userProfile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              type="button"
              className="portal-btn portal-btn-secondary portal-btn-sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          <form onSubmit={handleProfileUpdate}>
            <div className="portal-form-grid">
              {/* First Name */}
              <div className="portal-field">
                <label>First Name</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.first_name}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, first_name: e.target.value })}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="portal-field">
                <label>Last Name</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.last_name}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, last_name: e.target.value })}
                  required
                />
              </div>

              {/* Registered Email (auth table) */}
              <div className="portal-field full-width">
                <label>Account Email (Auth Identity)</label>
                <input
                  type="email"
                  className="portal-input"
                  value={userProfile.email}
                  readOnly
                  title="Email is verified and linked to auth UUID"
                />
                <small style={{ color: '#059669', fontSize: 11 }}>
                  ✓ Email verified & active ({userProfile.auth_id})
                </small>
              </div>

              {/* Business Name (users table) */}
              <div className="portal-field full-width">
                <label>Business / Company Legal Name</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.business_name}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, business_name: e.target.value })}
                  required
                />
              </div>

              {/* Business Type */}
              <div className="portal-field">
                <label>Business Type</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.business_type}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, business_type: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="portal-field">
                <label>Primary Contact Phone</label>
                <input
                  type="tel"
                  className="portal-input"
                  value={userProfile.phone}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                />
              </div>

              {/* Address */}
              <div className="portal-field full-width">
                <label>Registered Street Address</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.address}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
                />
              </div>

              {/* City */}
              <div className="portal-field">
                <label>City</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.city}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, city: e.target.value })}
                />
              </div>

              {/* State */}
              <div className="portal-field">
                <label>State / Province</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.state}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, state: e.target.value })}
                />
              </div>

              {/* Country */}
              <div className="portal-field">
                <label>Country</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.country}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, country: e.target.value })}
                />
              </div>

              {/* Postal Code */}
              <div className="portal-field">
                <label>Postal / ZIP Code</label>
                <input
                  type="text"
                  className="portal-input"
                  value={userProfile.postal_code}
                  readOnly={!isEditing}
                  onChange={(e) => setUserProfile({ ...userProfile, postal_code: e.target.value })}
                />
              </div>
            </div>

            {isEditing && (
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="portal-btn portal-btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Discard Changes
                </button>
                <button type="submit" className="portal-btn portal-btn-primary">
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Section 2: Change Password with Live Rules */}
        <section className="portal-card" style={{ padding: 24, marginBottom: 0 }}>
          <div style={{ marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontFamily: 'Manrope, sans-serif' }}>
              Change Password
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
              Enforces real-time password complexity rules
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Current Password */}
              <div className="portal-field">
                <label>Current Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="portal-input"
                  placeholder="Enter current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                />
              </div>

              {/* New Password */}
              <div className="portal-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>New Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', fontSize: 11.5, color: '#376bf4', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? 'Hide password' : 'Show password'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="portal-input"
                  placeholder="Create a strong password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                />
              </div>

              {/* LIVE PASSWORD RULES BOX */}
              <div className="password-rules-box">
                <div className="rules-heading">Live Password Requirements</div>
                <ul className="rules-list">
                  <li className={`rule-item ${ruleLength ? 'is-valid' : ''}`}>
                    <span className="rule-icon">{ruleLength ? '✓' : '•'}</span>
                    <span>More than 8 characters ({newPw.length}/9+)</span>
                  </li>
                  <li className={`rule-item ${ruleUppercase ? 'is-valid' : ''}`}>
                    <span className="rule-icon">{ruleUppercase ? '✓' : '•'}</span>
                    <span>At least one uppercase letter (A-Z)</span>
                  </li>
                  <li className={`rule-item ${ruleLowercase ? 'is-valid' : ''}`}>
                    <span className="rule-icon">{ruleLowercase ? '✓' : '•'}</span>
                    <span>At least one lowercase letter (a-z)</span>
                  </li>
                  <li className={`rule-item ${ruleSpecial ? 'is-valid' : ''}`}>
                    <span className="rule-icon">{ruleSpecial ? '✓' : '•'}</span>
                    <span>At least one special character (!@#$%^&*)</span>
                  </li>
                </ul>
              </div>

              {/* Confirm Password */}
              <div className="portal-field">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="portal-input"
                  placeholder="Re-enter your new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                />
                {confirmPw && confirmPw !== newPw && (
                  <small style={{ color: '#dc2626', fontSize: 11.5 }}>
                    Passwords do not match
                  </small>
                )}
                {confirmPw && confirmPw === newPw && isPasswordValid && (
                  <small style={{ color: '#059669', fontSize: 11.5 }}>
                    ✓ Passwords match
                  </small>
                )}
              </div>

              {passwordMessage && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    backgroundColor: passwordMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: passwordMessage.type === 'success' ? '#065f46' : '#b91c1c',
                    border: `1px solid ${passwordMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                  }}
                >
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="portal-btn portal-btn-primary"
                style={{ marginTop: 6 }}
                disabled={!isPasswordValid || newPw !== confirmPw}
              >
                Update Password
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Logout Card at bottom of My Account */}
      <section
        className="portal-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          backgroundColor: '#fff',
          border: '1px solid #fee2e2'
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 4px', color: '#991b1b', fontSize: 15 }}>
            Sign Out of Customer Workspace
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
            Safely disconnect your active session from this device.
          </p>
        </div>

        <button
          type="button"
          className="portal-btn portal-btn-danger"
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              window.location.href = '/login';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log out</span>
        </button>
      </section>
    </div>
  );
}
