import React, { useEffect, useMemo, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';

export default function App() {
  const [jwtToken, setJwtToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');

  useEffect(() => {
    const savedToken = localStorage.getItem('jwtToken');
    const savedUser = localStorage.getItem('currentUser');
    if (savedToken && savedUser) {
      setJwtToken(savedToken);
      setCurrentUser(savedUser);
      setView('chat');
    }
  }, []);

  const authContext = useMemo(() => ({
    jwtToken,
    currentUser,
    setAuth: (token, username) => {
      setJwtToken(token);
      setCurrentUser(username);
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('currentUser', username);
    },
    setCurrentUser: (user) => {
      setCurrentUser(user);
      localStorage.setItem('currentUser', user);
    },
    clearAuth: () => {
      setJwtToken(null);
      setCurrentUser(null);
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
    }
  }), [jwtToken, currentUser]);

  if (view === 'chat' && jwtToken) {
    return (
      <Chat
        auth={authContext}
        onLogout={() => {
          authContext.clearAuth();
          setView('login');
        }}
      />
    );
  }

  if (view === 'register') {
    return (
      <Register
        onBack={() => setView('login')}
        onRegistered={() => setView('login')}
      />
    );
  }

  return (
    <Login
      onRegister={() => setView('register')}
      onLoggedIn={(token, username) => {
        authContext.setAuth(token, username);
        setView('chat');
      }}
    />
  );
}



