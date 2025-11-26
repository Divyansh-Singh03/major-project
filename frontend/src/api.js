// frontend/src/api.js
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
export const api = axios.create({ baseURL: BASE });

// if token exists at load time, attach it
const tokenNow = localStorage.getItem('token');
if (tokenNow) api.defaults.headers.common['Authorization'] = 'Bearer ' + tokenNow;

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
}

export function getPortfolio() {
  return api.get('/portfolio');
}

export function addHolding(payload) {
  // payload: { symbol, shares, avg_buy_price }
  return api.post('/portfolio/holdings', payload);
}

export function deleteHolding(id) {
  return api.delete(`/portfolio/holdings/${id}`);
}

export default api;
