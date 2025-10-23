import React from 'react';
import Loading from './Loading';

export default function FriendsTab({
  friends,
  search,
  setSearch,
  searchResults,
  requests,
  sentRequests,
  error,
  loading,
  searchLoading,
  onSearch,
  onAddFriend,
  onCancelFriend,
  onAcceptFriend,
  onDeclineFriend,
  onRemoveFriend,
  getButtonState
}) {
  return (
    <div className="tab-content">
      <div className="friends-layout">
        {/* Left Column - Friends List */}
        <div className="friends-column">
          <h4>My Friends</h4>
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <Loading message="Loading friends..." size="small" />
          ) : (
            <div className="friends-list">
              {friends.map((f, idx) => (
                <div key={idx} className="friend-item">
                  <div className="friend-avatar">
                    {(f.username || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="friend-info">
                    <div className="friend-name">{f.username}</div>
                  </div>
                  <div className="friend-actions">
                    <button 
                      className="btn-remove" 
                      onClick={() => onRemoveFriend(f.username)}
                      title="Remove friend"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Search & Requests */}
        <div className="friends-actions-column">
          {/* Search Section */}
          <div className="search-section">
            <h4>Search Users</h4>
            <div className="search-input">
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by username..." 
              />
              <button className="btn" onClick={onSearch}>Search</button>
            </div>
            <div className="search-results">
              {searchLoading ? (
                <Loading message="Searching..." size="small" />
              ) : (
                searchResults.map(u => {
                  const buttonState = getButtonState(u.username);
                  return (
                    <div key={u._id || u.username} className="search-result-item">
                      <div className="search-result-info">
                        <div className="search-result-username">{u.username}</div>
                      </div>
                      <div className="search-result-actions">
                        {buttonState === 'none' && (
                          <button 
                            className="btn-send-request" 
                            onClick={() => onAddFriend(u.username)}
                          >
                            Add
                          </button>
                        )}
                        {buttonState === 'sent' && (
                          <button 
                            className="btn-cancel-request" 
                            onClick={() => onCancelFriend(u.username)}
                          >
                            Cancel
                          </button>
                        )}
                        {buttonState === 'friend' && (
                          <span className="btn-friend-status">Friends</span>
                        )}
                        {buttonState === 'received' && (
                          <span className="btn-friend-status">Requested you</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sent Requests */}
          <div className="sent-requests">
            <h4>Sent Requests</h4>
            <div>
              {sentRequests.map((r, idx) => (
                <div key={idx} className="request-item">
                  <div className="request-info">
                    <div className="request-username">To: {r.to}</div>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="btn-decline" 
                      onClick={() => onCancelFriend(r.to)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Received Requests */}
          <div className="friend-requests">
            <h4>Friend Requests</h4>
            <div>
              {requests.map((r, idx) => (
                <div key={idx} className="request-item">
                  <div className="request-info">
                    <div className="request-username">From: {r.from}</div>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="btn-accept" 
                      onClick={() => onAcceptFriend(r.from)}
                    >
                      Accept
                    </button>
                    <button 
                      className="btn-decline" 
                      onClick={() => onDeclineFriend(r.from)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
