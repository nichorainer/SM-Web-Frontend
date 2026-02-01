const AUTH_TOKEN_KEY = 'sm_token';
// Call for avatar
const AVATAR_KEY_PREFIX = "fe_avatar_user_";

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

// Check if user is authenticated
export function isAuthenticated() {
  const token = getToken();
  return !!token; // true if token exists
}

// Clear token (logout)
export function logout() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.warn("logout error", err);
  }
}

// Get user profile from backend
export async function getUser(userId) {
  const token = getToken();
  if (!token) return { status: "error", message: "Not authenticated" };

  try {
    const res = await fetch(`http://localhost:8080/users/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to fetch user");
    return json;
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

// Update user profile
export async function updateUser(userId, data) {
  const token = getToken();
  if (!token) return { status: "error", message: "Not authenticated" };

  try {
    const res = await fetch(`http://localhost:8080/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to update user");
    return json;
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

// Read avatar dataURL from localStorage for a given user id
export function readLocalAvatar(userId) {
  if (!userId) return null;
  try {
    return localStorage.getItem(`${AVATAR_KEY_PREFIX}${userId}`);
  } catch (err) {
    console.error("readLocalAvatar error:", err);
    return null;
  }
}

// Write avatar dataURL to localStorage for a given user id
export function writeLocalAvatar(userId, dataUrl) {
  if (!userId) return;
  try {
    if (dataUrl === null) {
      localStorage.removeItem(`${AVATAR_KEY_PREFIX}${userId}`);
    } else {
      localStorage.setItem(`${AVATAR_KEY_PREFIX}${userId}`, dataUrl);
    }
  } catch (err) {
    console.error("writeLocalAvatar error:", err);
  }
}

// Small emitter so components can subscribe to auth/profile events
const emitter = new EventTarget();

// Subscribe
export function onAuthEvent(name, handler) {
  emitter.addEventListener(name, handler);
}

// Unsubscribe
export function offAuthEvent(name, handler) {
  emitter.removeEventListener(name, handler);
}

/** Emit event with detail object */
export function emitAuthEvent(name, detail) {
  emitter.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Convenience: set local avatar and emit avatar:changed */
export function setLocalAvatarAndEmit(userId, dataUrl) {
  writeLocalAvatar(userId, dataUrl);
  emitAuthEvent("avatar:changed", { id: userId, dataUrl });
}

/** Convenience: remove local avatar and emit avatar:changed with null */
export function removeLocalAvatarAndEmit(userId) {
  writeLocalAvatar(userId, null);
  emitAuthEvent("avatar:changed", { id: userId, dataUrl: null });
}

/** Convenience: emit name changed */
export function emitNameChanged(userId, fullName) {
  emitAuthEvent("name:changed", { id: userId, fullName });
}

/** Convenience: emit user refreshed (payload: full user object) */
export function emitUserRefreshed(user) {
  emitAuthEvent("user:refreshed", { user });
}

// Optional: import your API helper if you have one
// import { getProfile as apiGetProfile } from "../services/api";

/**
 * Normalize backend profile shape to a consistent object used across the app.
 */
function normalizeProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    full_name: profile.full_name || profile.fullName || profile.name || "",
    username: profile.username || profile.user_name || "",
    email: profile.email || "",
    role: profile.role || null,
    avatar_url: profile.avatar_url || profile.avatarUrl || profile.avatar || null,
    _raw: profile,
  };
}

/**
 * getProfile
 * - If forceFetch is false (default), try localStorage 'user' first.
 * - If not found or forceFetch === true, try to fetch from backend.
 * - On successful fetch, normalize and persist to localStorage under 'user'.
 *
 * Usage:
 *   const profile = await getProfile(); // returns normalized profile or null
 */
export async function getProfile(forceFetch = false) {
  // 1) Try localStorage first for speed and backward compatibility
  if (!forceFetch) {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.id || parsed.username || parsed.email)) {
          return normalizeProfile(parsed);
        }
      }
    } catch (err) {
      // ignore parse errors and fall through to fetch
      // console.warn("getProfile: localStorage parse error", err);
    }
  }

  // 2) Try to fetch from backend
  try {
    // If you have an API helper, prefer it. Uncomment and adapt the import above.
    // if (typeof apiGetProfile === "function") {
    //   const res = await apiGetProfile();
    //   const profile = res?.data || res;
    //   if (profile) {
    //     try { localStorage.setItem("user", JSON.stringify(profile)); } catch {}
    //     return normalizeProfile(profile);
    //   }
    // }

    // Fallback: use fetch to a common endpoint. Adjust URL to match your backend.
    const resp = await fetch("/api/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // If you store token in localStorage, include it here:
        // Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      credentials: "include", // optional: include cookies if your backend uses them
    });

    if (!resp.ok) {
      return null;
    }
    const body = await resp.json();
    // adapt to your backend response shape: body.data or body
    const profile = body?.data || body;
    if (profile) {
      try {
        localStorage.setItem("user", JSON.stringify(profile));
      } catch (err) {
        // ignore storage errors
      }
      return normalizeProfile(profile);
    }
  } catch (err) {
    // console.warn("getProfile fetch error", err);
  }

  // Nothing found
  return null;
}