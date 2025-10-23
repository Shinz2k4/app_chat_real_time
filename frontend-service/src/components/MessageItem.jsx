import React from 'react';

export default function MessageItem({ message, currentUser, friendInfo }) {
  const isSent = message.sender === currentUser;
  const displayName = isSent ? 'You' : (friendInfo?.fullName || message.sender);
  const avatar = isSent ? null : friendInfo?.avatar;

  const renderAttachment = () => {
    if (!message.attachmentUrl) return null;

    if (message.messageType === 'image') {
      return (
        <div className="message-attachment message-image">
          <img src={message.attachmentUrl} alt={message.attachmentName || 'Image'} />
        </div>
      );
    }

    if (message.messageType === 'file') {
      return (
        <div className="message-attachment message-file">
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
            <i className="fas fa-file"></i>
            <span className="file-name">{message.attachmentName || 'File'}</span>
            {message.attachmentSize && (
              <span className="file-size">
                ({(message.attachmentSize / 1024).toFixed(2)} KB)
              </span>
            )}
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`message ${isSent ? 'sent' : 'received'}`}>
      {!isSent && avatar && (
        <div className="message-avatar">
          <img src={avatar} alt={displayName} />
        </div>
      )}
      <div className="message-content">
        {!isSent && (
          <div className="message-sender">{displayName}</div>
        )}
        {message.message && (
          <div className="message-text">{message.message}</div>
        )}
        {renderAttachment()}
        <div className="message-info">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

