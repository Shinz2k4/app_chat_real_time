import React, { useState, useRef, useEffect } from 'react';
import Navigation from './Navigation';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import FriendsTab from './FriendsTab';
import ProfileTab from './ProfileTab';
import { useSocket } from '../hooks/useSocket';
import { useFriends } from '../hooks/useFriends';
import { useProfile } from '../hooks/useProfile';
import { useMessages } from '../hooks/useMessages';

export default function Chat({ auth, onLogout }) {
  const [activeFriend, setActiveFriend] = useState(null);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [search, setSearch] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Custom hooks
  const friendsData = useFriends(auth.jwtToken);
  const profileData = useProfile(auth.jwtToken, auth);
  const messagesData = useMessages(auth.jwtToken, activeFriend);

  // Typing handlers
  const handleTyping = (username) => {
    setTypingUser(username);
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Auto-clear after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUser(null);
    }, 3000);
  };

  const handleStopTyping = (username) => {
    if (typingUser === username) {
      setTypingUser(null);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Socket connection
  const socket = useSocket(
    auth.jwtToken,
    messagesData.addMessage,
    friendsData.setError,
    handleTyping,
    handleStopTyping
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Event handlers
  const handleSelectFriend = (friend) => {
    // Leave previous chat
    if (activeFriend && socket) {
      messagesData.leaveChat(socket, activeFriend);
    }
    setActiveFriend(friend.username);
    setTypingUser(null); // Clear typing indicator
    messagesData.joinChat(socket, friend.username);
  };

  const handleSendMessage = () => {
    if (socket && activeFriend) {
      messagesData.sendMessage(socket, activeFriend, input);
      // Send stop typing after sending message
      messagesData.sendStopTyping(socket, activeFriend);
      isTypingRef.current = false;
    }
    setInput('');
  };

  const handleSendFile = async (file, caption) => {
    if (!socket || !activeFriend) return;
    
    try {
      await messagesData.sendFile(socket, activeFriend, file, caption, auth.jwtToken);
      // Send stop typing after sending file
      messagesData.sendStopTyping(socket, activeFriend);
      isTypingRef.current = false;
    } catch (error) {
      console.error('Failed to send file:', error);
      throw error;
    }
  };

  const handleInputChange = (value) => {
    if (!socket || !activeFriend) return;
    
    // Send typing indicator if not already sent
    if (value && !isTypingRef.current) {
      messagesData.sendTyping(socket, activeFriend);
      isTypingRef.current = true;
    }
    
    // Send stop typing if input is cleared
    if (!value && isTypingRef.current) {
      messagesData.sendStopTyping(socket, activeFriend);
      isTypingRef.current = false;
    }
  };

  const handleSearch = () => {
    friendsData.searchUsers(search);
  };

  const handleRemoveFriend = (username) => {
    friendsData.removeFriend(username);
    // If removed friend was active, clear chat
    if (activeFriend === username) {
      setActiveFriend(null);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="header-brand">
          <h1 className="app-logo">SokishiX</h1>
          <span className="app-tagline">Kết nối tình anh em</span>
        </div>
        <div className="header-user">
          <div className="user-welcome">
            {profileData.profileData?.avatar ? (
              <img src={profileData.profileData.avatar} alt="Avatar" className="header-avatar" />
            ) : (
              <div className="header-avatar-fallback">
                {(profileData.profileData?.fullName || auth.currentUser || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="user-info">
              <span className="welcome-text">Welcome back,</span>
              <span className="user-name">{profileData.profileData?.fullName || auth.currentUser}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="main-content">
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={onLogout} 
        />

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="tab-content">
            <ChatSidebar 
              friends={friendsData.friends}
              activeFriend={activeFriend}
              onSelectFriend={handleSelectFriend}
              unreadCount={messagesData.unreadCount}
            />
            <ChatArea 
              activeFriend={activeFriend}
              activeFriendInfo={friendsData.friends.find(f => f.username === activeFriend)}
              messages={messagesData.messages}
              input={input}
              setInput={setInput}
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              onInputChange={handleInputChange}
              currentUser={auth.currentUser}
              isTyping={typingUser === activeFriend}
            />
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <FriendsTab
            friends={friendsData.friends}
            search={search}
            setSearch={setSearch}
            searchResults={friendsData.searchResults}
            requests={friendsData.requests}
            sentRequests={friendsData.sentRequests}
            error={friendsData.error}
            loading={friendsData.loading}
            searchLoading={friendsData.searchLoading}
            onSearch={handleSearch}
            onAddFriend={friendsData.addFriend}
            onCancelFriend={friendsData.cancelFriend}
            onAcceptFriend={friendsData.acceptFriend}
            onDeclineFriend={friendsData.declineFriend}
            onRemoveFriend={handleRemoveFriend}
            getButtonState={friendsData.getButtonState}
          />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileTab
            profileData={profileData.profileData}
            setProfileData={profileData.setProfileData}
            auth={auth}
            error={profileData.error}
            loading={profileData.loading}
            saving={profileData.saving}
            onUpdateProfile={profileData.updateProfile}
            onLoadProfile={profileData.loadProfile}
            onAvatarChange={profileData.handleAvatarChange}
          />
        )}
      </div>
    </div>
  );
}



