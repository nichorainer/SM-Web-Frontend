const USER_STORAGE_KEY = 'sm_user';
const AUTH_TOKEN_KEY = 'sm_token'; // Save demo token

export function registerUser({ full_name, username, email, password }) {
  const user = {
    full_name: full_name || '',
    username: username || '',
    email: email || '',
    password: password || '',
    role: 'staff',
    avatarUrl: null,
  };
  
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('getUser parse error', err);
    return null;
  }
}

/** Simple auth check (demo) */
export function isAuthenticated() {
  return !!getUser();
}

export function updateUser(updates = {}) {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : {};
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

/**
 * Simulate login: verify email + password against stored sm_user.
 * Returns { token, user } on success, throws Error on failure.
 */
export function loginUser({ email, password }) {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      throw new Error('No user registered');
    }
    const user = JSON.parse(raw);

    // Basic check: email and password must match stored user
    if (!user.email || user.email !== email) {
      throw new Error('Invalid email or password');
    }
    // In demo we stored password in plain text; compare directly
    if (!user.password || user.password !== password) {
      throw new Error('Invalid email or password');
    }

    // Create a simple token for demo purposes
    const token = `demo-token-${Date.now()}`;

    // Optionally persist token (so isAuthenticated can check token if you want)
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (e) {
      // ignore storage errors
    }

    // Return token and user object
    return { token, user };
  } catch (err) {
    // rethrow so caller can handle
    throw err;
  }
}

/** Clear user (logout) */
export function logout() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // keep sm_user if you want to preserve registered data; or remove to "forget" user
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.warn('logout error', err);
  }
}
