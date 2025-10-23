import React, { useRef, useEffect, useState } from 'react';
import MessageItem from './MessageItem';

export default function ChatArea({ 
  activeFriend,
  activeFriendInfo,
  messages, 
  input, 
  setInput, 
  onSendMessage,
  onSendFile,
  onInputChange,
  currentUser,
  isTyping
}) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);
    // Call parent handler for typing indicator
    if (onInputChange) {
      onInputChange(newValue);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || !onSendFile || uploading) return;

    setUploading(true);
    try {
      await onSendFile(selectedFile, input);
      setSelectedFile(null);
      setFilePreview(null);
      setInput('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if (selectedFile) {
      handleSendFile();
    } else {
      onSendMessage();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h3>
          {activeFriend ? `Chat with ${activeFriendInfo?.fullName || activeFriend}` : 'Select a friend to start chatting'}
        </h3>
      </div>
      <div className="chat-messages">
        {messages.map((m) => (
          <MessageItem 
            key={m.id} 
            message={m} 
            currentUser={currentUser}
            friendInfo={activeFriendInfo}
          />
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">{activeFriendInfo?.fullName || activeFriend} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="file-preview-container">
          <div className="file-preview">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="preview-image" />
            ) : (
              <div className="preview-file">
                <i className="fas fa-file"></i>
                <span>{selectedFile.name}</span>
                <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
            <button className="btn-cancel-preview" onClick={handleCancelFile}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <div className="chat-input">
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <button 
          className="btn btn-attachment" 
          onClick={() => fileInputRef.current?.click()}
          disabled={!activeFriend || uploading}
          title="Attach file or image"
        >
          <i className="fas fa-paperclip"></i>
        </button>
        <input 
          placeholder={selectedFile ? 'Add a caption (optional)...' : 'Type your message...'} 
          value={input} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!activeFriend || uploading} 
        />
        <button 
          className="btn btn-send" 
          onClick={handleSend} 
          disabled={!activeFriend || uploading || (!input.trim() && !selectedFile)}
        >
          {uploading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
}
