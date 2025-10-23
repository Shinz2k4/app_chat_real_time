import React from 'react';

export default function Navigation({ activeTab, setActiveTab, onLogout }) {
  return (
    <div className="nav-sidebar">
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <i className="fas fa-comments"></i>
          <span>Chat</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <i className="fas fa-users"></i>
          <span>Friends</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i>
          <span>Profile</span>
        </button>
      </div>
      <button className="btn btn-danger logout-btn" onClick={onLogout}>
        <i className="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </div>
  );
}
