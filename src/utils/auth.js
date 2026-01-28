const AUTH_TOKEN_KEY = 'sm_token';

// Register user via backend
export async function registerUser(data) {
  try {
    const res = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || "Failed to register");
    }
    return json;
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

// Login user via backend
export async function loginUser(data) {
  const res = await fetch("http://localhost:8080/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to login");
  }

  return res.json();
}

// Save token to localStorage
export function saveToken(token) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.warn("Failed to save token", err);
  }
}

// Get token from localStorage
export function getToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.warn("Failed to get token", err);
    return null;
  }
}

// Clear token (logout)
export function logout() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.warn("logout error", err);
  }
}