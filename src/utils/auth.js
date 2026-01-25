const USER_STORAGE_KEY = 'sm_user';
const AUTH_TOKEN_KEY = 'sm_token';

export function registerUser({ full_name, username, email, password }) {
  const user = {
    full_name: full_name || '',
    username: username || '',
    email: email || '',
    password: password || '',
    role: 'admin',
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
 * Simulate login: verify email OR username + password against stored sm_user.
 * Returns { token, user } on success, throws Error on failure.
 */
export function loginUser({ email, username, identifier, password }) {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      throw new Error('No user registered');
    }
    const user = JSON.parse(raw);

    // Normalize inputs
    const id = (identifier || email || username || '').trim();

    // If no identifier provided, fail early
    if (!id) {
      throw new Error('Email/username and password are required');
    }

    // Check identifier matches either stored email or username
    const matchesIdentifier =
      (user.email && user.email === id) || (user.username && user.username === id);

    if (!matchesIdentifier) {
      throw new Error('Invalid email/username or password');
    }

    // Password check (demo: plain text)
    if (!user.password || user.password !== password) {
      throw new Error('Invalid email/username or password');
    }

    // Create a simple token for demo purposes
    const token = `demo-token-${Date.now()}`;

    // Persist token (optional)
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (e) {
      // ignore storage errors
    }

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
    localStorage.removeItem(USER_STORAGE_KEY);
    // console.log('Logging out...');
    // navigate('/login');
  } catch (err) {
    console.warn('logout error', err);
  }
}
