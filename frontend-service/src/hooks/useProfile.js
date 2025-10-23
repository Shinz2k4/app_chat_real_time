import { useState, useEffect } from 'react';
import { api, authHeaders } from '../api';

export function useProfile(jwtToken, auth) {
  const [profileData, setProfileData] = useState({
    username: '',
    fullName: '',
    email: '',
    dateOfBirth: '',
    avatar: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api.userBase}/profile`, {
        headers: { ...authHeaders(jwtToken) }
      });
      const data = await res.json();
      if (data.success) {
        // Convert ISO date to yyyy-MM-dd format for date input
        let formattedDate = '';
        if (data.data.dateOfBirth) {
          const date = new Date(data.data.dateOfBirth);
          formattedDate = date.toISOString().split('T')[0];
        }
        
        const profileInfo = {
          username: data.data.username || '',
          fullName: data.data.fullName || '',
          email: data.data.email || '',
          dateOfBirth: formattedDate,
          avatar: data.data.avatar || ''
        };
        setProfileData(profileInfo);
        setError('');
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${api.userBase}/profile`, {
        method: 'PUT',
        headers: { 
          ...authHeaders(jwtToken),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success) {
        setError('');
        alert('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${api.userBase}/profile/avatar`, {
        method: 'POST',
        headers: { ...authHeaders(jwtToken) },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfileData({...profileData, avatar: data.data.avatar});
        // Update auth context with new avatar
        if (auth.setCurrentUser) {
          auth.setCurrentUser({...auth.currentUser, avatar: data.data.avatar});
        }
        alert('Avatar updated successfully!');
      } else {
        setError(data.message || 'Failed to update avatar');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      setError('Failed to update avatar');
    }
  };

  // Auto-load profile on mount
  useEffect(() => {
    if (jwtToken) {
      console.log('🔄 Loading profile...');
      loadProfile();
    }
  }, [jwtToken]);

  return {
    profileData,
    setProfileData,
    error,
    loading,
    saving,
    setError,
    loadProfile,
    updateProfile,
    handleAvatarChange
  };
}
