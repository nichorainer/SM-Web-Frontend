const TOKEN_KEY = 'sm_auth_token';
const USER_STORAGE_KEY = 'sm_user';

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

export function updateUser(updates) {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : {};

    // merge data lama dengan data baru
    const updatedUser = {
      ...user,
      ...updates,
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
  } catch (err) {
    console.error('Failed to update user in localStorage', err);
    return null;
  }
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
  localStorage.removeItem(USER_STORAGE_KEY);
}
