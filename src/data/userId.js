// Generates and persists a per-browser UUID used as the user identity
// (POC: no real auth — server upserts a plantapp_users row on first sight).
export function getUserId() {
  let id = localStorage.getItem('plantapp-user-id');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || fallbackUuid();
    localStorage.setItem('plantapp-user-id', id);
  }
  return id;
}

function fallbackUuid() {
  // Used only if crypto.randomUUID is unavailable (old browser); not crypto-strong.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
