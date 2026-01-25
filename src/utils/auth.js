const TOKEN_KEY = 'sm_auth_token';
const USER_KEY = 'sm_user';

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem('sm_user');
  if (!raw) return null;

  const user = JSON.parse(raw);
  return {
    ...user,
    avatarUrl: localStorage.getItem('sm_avatar') || user.avatarUrl || null
  };
}

export function loginUser({ name, email }) {
  // In real app, call backend and get token. Here we simulate.
  const token = 'demo-token-' + Date.now();
  const user = { name, email };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function registerUser({ full_name, username, email, password }) {
  const user = { 
    full_name, 
    username, 
    email, 
    password, 
    role: 'staff',
    avatarUrl: null 
  };
    localStorage.setItem('sm_user', JSON.stringify(user));
  }