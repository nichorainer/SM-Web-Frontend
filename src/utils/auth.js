import { data } from "framer-motion/client";

const USER_KEY = "user";
// Call for avatar
const AVATAR_KEY_PREFIX = "fe_avatar_user_";

// Register user via backend
export async function registerUser(data) {
  try {
    const res = await fetch("http://localhost:8080/register", {
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
  const res = await fetch("http://localhost:8080/login", {
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

// Save user object to localStorage
export function saveUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn("Failed to save user", err);
  }
}

// Get token from localStorage
export function getUserLocal() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Failed to get user", err);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  return !!getUserLocal();
}

// Clear token (logout)
export function logout() {
  try {
    localStorage.removeItem(USER_KEY);
    // clear localStorage data
    localStorage.removeItem("user-avatar");
    localStorage.removeItem("staffData");
    localStorage.removeItem("logsData");

  } catch (err) {
    console.warn("logout error", err);
  }
}

// Get user profile from BE from user_id
export async function getUser(userId) {
  try {
    // Ambil userId dari localStorage kalau tidak diberikan sebagai argumen
    if (!userId) {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      userId = parsed?.id;
      if (!userId) return null;
    }

    // Panggil backend
    const res = await fetch(`http://localhost:8080/users/${userId}`, {
      headers: { "Content-Type": "application/json" },
    });

    // Parse response JSON
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.message || "Failed to fetch user");
    }

    // Simpan ke localStorage untuk cache
    try {
      localStorage.setItem("user", JSON.stringify(json.data || json));
    } catch (err) {
      console.warn("Failed to save user to localStorage", err);
    }

    // Kembalikan data user
    return json.data || json;
  } catch (err) {
    console.error("getUser error:", err);
    return { status: "error", message: err.message };
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

// Read avatar dataURL from localStorage for a given user id
export function readLocalAvatar(id) {
  try {
    const key = `avatar:${id}`;
    const v = localStorage.getItem(key);
    return v === null ? null : v;
  } catch (e) {
    console.warn('readLocalAvatar error', e);
    return null;
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
export function setLocalAvatarAndEmit(id, dataUrl) {
  const key = `avatar:${id}`;
  try {
    if (dataUrl == null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, dataUrl);
    }
  } catch (e) {
    console.warn('setLocalAvatarAndEmit localStorage error', e);
  }

  // Emit internal emitter if ada
  try { onAuthEvent?.('avatar:changed', { id, dataUrl }); } catch (e) {}

  // Emit window event with consistent payload
  try {
    window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { id, dataUrl } }));
  } catch (e) {}
}

/** Convenience: emit name changed */
export function emitNameChanged(userId, fullName) {
  emitAuthEvent("name:changed", { user_id: userId, fullName });
}

/** Convenience: emit user refreshed (payload: full user object) */
export function emitUserRefreshed(user) {
  emitAuthEvent("user:refreshed", { user });
}

/* getProfile */
export async function getProfile() {
  try {
    // Ambil user dari localStorage dulu untuk dapatkan id
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    const userId = parsed?.id;

    if (!userId) {
      console.warn("No userId found in localStorage");
      return null;
    }

    // Fetch from BE
    const resp = await fetch(`http://localhost:8080/users/me?id=${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (resp.ok) {
      const body = await resp.json();
      console.log("Raw body from BE:", body);

      const profile = body?.data || body;
      console.log("Profile before normalize:", profile);

      if (profile) {
        try {
          localStorage.setItem("user", JSON.stringify(profile));
        } catch (err) {
          // ignore storage errors
        }
        return normalizeProfile(profile);
      }
    }
  } catch (err) {
    console.warn("getProfile fetch error", err);
  }

  // Fallback ke localStorage
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.username || parsed.email)) {
        return normalizeProfile(parsed);
      }
    }
  } catch (err) {
    console.warn("getProfile localStorage parse error", err);
  }
  // Nothing found, so return = null
  return null;
}

/**
 * Normalize backend profile shape to a consistent object used across the app.
 */
function normalizeProfile(profile) {
  if (!profile) return null;
  console.log("normalizeProfile input:", profile);

  return {
    id: profile.id || profile.user_id || null,
    user_id: profile.user_id || null,
    full_name:
      profile.full_name ||
      profile.name ||
      profile.fullName ||
      profile.FullName ||
      "",
    username: profile.username || "",
    email: profile.email || "",
    role: profile.role || null,
    avatar_url: null,
    _raw: profile,
  };
}

// Update user profile
export async function updateUser(userId, data) {
  try {
    const res = await fetch(`http://localhost:8080/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
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
