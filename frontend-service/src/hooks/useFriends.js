import { useState, useEffect } from 'react';
import { api, authHeaders } from '../api';

export function useFriends(jwtToken) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api.userBase}/friends`, { 
        headers: { ...authHeaders(jwtToken) } 
      });
      const data = await res.json();
      if (data.success) {
        setFriends(data.data || []);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch friends');
      }
    } catch (e) {
      console.error('Failed to fetch friends:', e);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${api.userBase}/friend-requests`, { 
        headers: { ...authHeaders(jwtToken) } 
      });
      const data = await res.json();
      if (data.success) setRequests(data.data || []);
    } catch (e) {
      console.error('Failed to fetch requests:', e);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await fetch(`${api.userBase}/sent-requests`, { 
        headers: { ...authHeaders(jwtToken) } 
      });
      const data = await res.json();
      if (data.success) setSentRequests(data.data || []);
    } catch (e) {
      console.error('Failed to fetch sent requests:', e);
    }
  };

  const addFriend = async (username) => {
    setError('');
    try {
      const res = await fetch(`${api.userBase}/add-friend`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...authHeaders(jwtToken) 
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!data.success) setError(data.message || 'Failed to send request');
      await fetchRequests();
      await fetchSentRequests();
    } catch (e) {
      setError('Connection error');
    }
  };

  const cancelFriend = async (username) => {
    setError('');
    try {
      const res = await fetch(`${api.userBase}/cancel-friend-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...authHeaders(jwtToken) 
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!data.success) setError(data.message || 'Failed to cancel');
      await fetchRequests();
      await fetchSentRequests();
    } catch (e) {
      setError('Connection error');
    }
  };

  const acceptFriend = async (username) => {
    setError('');
    try {
      const res = await fetch(`${api.userBase}/accept-friend`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...authHeaders(jwtToken) 
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!data.success) setError(data.message || 'Failed to accept');
      await fetchFriends();
      await fetchRequests();
    } catch (e) {
      setError('Connection error');
    }
  };

  const declineFriend = async (username) => {
    setError('');
    try {
      const res = await fetch(`${api.userBase}/decline-friend-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...authHeaders(jwtToken) 
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!data.success) setError(data.message || 'Failed to decline');
      await fetchRequests();
    } catch (e) {
      setError('Connection error');
    }
  };

  const removeFriend = async (username) => {
    setError('');
    if (!confirm(`Are you sure you want to remove ${username} from your friends?`)) return;
    
    try {
      const res = await fetch(`${api.userBase}/remove-friend`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...authHeaders(jwtToken) 
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!data.success) setError(data.message || 'Failed to remove friend');
      await fetchFriends();
    } catch (e) {
      setError('Connection error');
    }
  };

  const searchUsers = async (search) => {
    if (!search) return setSearchResults([]);
    setSearchLoading(true);
    try {
      const res = await fetch(
        `${api.userBase}/search?username=${encodeURIComponent(search)}`, 
        { headers: { ...authHeaders(jwtToken) } }
      );
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
        setError('');
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (e) {
      console.error('Search failed:', e);
      setError('Search connection error');
    } finally {
      setSearchLoading(false);
    }
  };

  const getButtonState = (username) => {
    // Check if already friends
    if (friends.some(f => f.username === username)) {
      return 'friend';
    }
    // Check if request sent
    if (sentRequests.some(r => r.to === username)) {
      return 'sent';
    }
    // Check if request received
    if (requests.some(r => r.from === username)) {
      return 'received';
    }
    return 'none';
  };

  useEffect(() => {
    if (jwtToken) {
      fetchFriends();
      fetchRequests();
      fetchSentRequests();
    }
  }, [jwtToken]);

  return {
    friends,
    requests,
    sentRequests,
    searchResults,
    error,
    loading,
    searchLoading,
    setError,
    addFriend,
    cancelFriend,
    acceptFriend,
    declineFriend,
    removeFriend,
    searchUsers,
    getButtonState,
    fetchFriends,
    fetchRequests,
    fetchSentRequests
  };
}
