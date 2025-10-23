import React from 'react';
import Loading from './Loading';

export default function ProfileTab({
  profileData,
  setProfileData,
  auth,
  error,
  loading,
  saving,
  onUpdateProfile,
  onLoadProfile,
  onAvatarChange
}) {
  return (
    <div className="tab-content">
      <div className="profile-layout">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-header-icon">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="profile-header-text">
              <h2>My Profile</h2>
              <p>Let be your self</p>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <Loading message="Loading profile..." />
          ) : (
            <div className="profile-form">
            <div className="profile-avatar-section">
              <div className="current-avatar">
                {profileData.avatar ? (
                  <img 
                    src={profileData.avatar} 
                    alt="Current Avatar" 
                    className="avatar-preview"
                    onError={(e) => {
                      console.error('Avatar load error:', profileData.avatar);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="avatar-fallback">
                    {(profileData.username || profileData.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="avatar-upload">
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/*" 
                  onChange={onAvatarChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-upload" className="btn btn-secondary">
                  <i className="fas fa-camera"></i> Change Avatar
                </label>
              </div>
            </div>
            
            <div className="profile-fields">
              <div className="form-group">
                <label>Username:</label>
                <input 
                  type="text" 
                  value={profileData.username || ''} 
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  disabled
                  className="form-control"
                />
                <small>Username cannot be changed</small>
              </div>
              
              <div className="form-group">
                <label>Full Name:</label>
                <input 
                  type="text" 
                  value={profileData.fullName || ''} 
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input 
                  type="email" 
                  value={profileData.email || ''} 
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Date of Birth:</label>
                <input 
                  type="date" 
                  value={profileData.dateOfBirth || ''} 
                  onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  className="form-control"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={onUpdateProfile}
                  disabled={saving}
                >
                  <i className="fas fa-save"></i> 
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={onLoadProfile}
                  disabled={loading || saving}
                >
                  <i className="fas fa-refresh"></i> Reset
                </button>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
