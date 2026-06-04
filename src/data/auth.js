import axios from 'axios';

export function setToken(token) {
  localStorage.setItem('plantapp-token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function logout() {
  localStorage.removeItem('plantapp-token');
  delete axios.defaults.headers.common['Authorization'];
  window.location.reload();
}
