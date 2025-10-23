import React from 'react';

export default function Loading({ message = 'Loading...', size = 'medium' }) {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  };

  return (
    <div className={`loading-container ${sizeClasses[size]}`}>
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}
