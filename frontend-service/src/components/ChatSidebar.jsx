import React from 'react';

export default function ChatSidebar({ friends, activeFriend, onSelectFriend, unreadCount }) {
  return (
    <div className="chat-sidebar">
      <div className="friends-list">
        <div className="friends-list-header">
          <h4>Friends</h4>
          {unreadCount > 0 && (
            <span className="total-unread-badge">{unreadCount}</span>
          )}
        </div>
        {friends.map((f, idx) => (
          <div 
            key={idx} 
            className={`friend-item ${activeFriend === f.username ? 'active' : ''}`} 
            onClick={() => onSelectFriend(f)}
          >
            <div className="friend-avatar">
              {f.avatar ? (
                <img src={f.avatar} alt={f.fullName || f.username} className="avatar-image" />
              ) : (
                <div className="avatar-fallback">
                  {(f.fullName || f.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="friend-info">
              <div className="friend-name">{f.fullName || f.username}</div>
              <div className="friend-username">@{f.username}</div>
            </div>
            {f.unreadCount > 0 && (
              <span className="unread-badge">{f.unreadCount}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
