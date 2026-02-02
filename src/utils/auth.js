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
  emitAuthEvent("avatar:changed", { user_id: userId, dataUrl });
}

/** Convenience: remove local avatar and emit avatar:changed with null */
export function removeLocalAvatarAndEmit(userId) {
  writeLocalAvatar(userId, null);
  emitAuthEvent("avatar:changed", { user_id: userId, dataUrl: null });
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
export async function getProfile(forceFetch = false) {
    try {
    // Fetch from BE
    const resp = await fetch("http://localhost:8080/users/me?id=6", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (resp.ok) {
      const body = await resp.json();
      console.log("Raw body from BE:", body);

      profile = body?.data || body;
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

  // Fallback try to localStorage
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
  // Nothing found
  return null;
}

/**
 * Normalize backend profile shape to a consistent object used across the app.
 */
function normalizeProfile(profile) {
  if (!profile) return null;
  console.log("normalizeProfile input:", profile);

  return {
    id: profile.user_id || profile.id || null,
    full_name: profile.full_name || profile.name || profile.fullName || profile.FullName || "",
    username: profile.username || "",
    email: profile.email || "",
    role: profile.role || null,
    avatar_url: null,
    _raw: profile,
  };
}
