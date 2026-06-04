import axios from 'axios';

const TOKEN_KEY = 'plantapp-token';
const USER_KEY  = 'plantapp-user';

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete axios.defaults.headers.common['Authorization'];
  window.location.reload();
}

// Forcefully clears every client-side cache (service workers, CacheStorage)
// and reloads with a cache-busting query string. Use when iOS Safari is
// stuck on a stale build despite normal reloads.
export async function forceRefresh() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch (e) {
    console.warn('Cache clear failed', e);
  }
  // Cache-busting query string so iOS can't serve a disk-cached HTML
  const sep = window.location.search.includes('?') ? '&' : '?';
  window.location.href = window.location.pathname + window.location.search + sep + 'v=' + Date.now();
}

