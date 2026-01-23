const TOKEN_KEY = 'sm_auth_token';
const USER_KEY = 'sm_user';

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
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
  localStorage.removeItem(USER_KEY);
}

export function registerUser({ full_name, username, email, password }) {
  // In real app, call backend to create user. Here we simulate and auto-login.
  // You could store users in localStorage for demo, but keep simple.
  
  //   return loginUser({ full_name, email });

  const user = { full_name, username, email, password, role: 'staff' };
    localStorage.setItem('sm_user', JSON.stringify(user));
  }