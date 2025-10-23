export const api = {
  authBase: '/api/auth',
  userBase: '/api/users',
  chatBase: '/api/chat',
};

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}



