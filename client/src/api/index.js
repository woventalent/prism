import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT + active workspace ID on every request
api.interceptors.request.use(cfg => {
  const token    = localStorage.getItem('prism_token');
  const clientId = localStorage.getItem('prism_client_id');
  if (token)    cfg.headers.Authorization = `Bearer ${token}`;
  if (clientId) cfg.headers['X-Client-ID'] = clientId;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('prism_token');
      localStorage.removeItem('prism_client_id');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const getMe          = ()      => api.get('/auth/me').then(r => r.data);
export const changePassword = (body) => api.post('/auth/change-password', body).then(r => r.data);

// ── Clients / Workspaces ──────────────────────────────────────
export const getClients       = ()          => api.get('/clients').then(r => r.data);
export const createClient     = (body)      => api.post('/clients', body).then(r => r.data);
export const updateClient     = (id, body)  => api.put(`/clients/${id}`, body).then(r => r.data);
export const deleteClient     = (id)        => api.delete(`/clients/${id}`).then(r => r.data);
export const getClientUsers   = (id)        => api.get(`/clients/${id}/users`).then(r => r.data);
export const addClientUser    = (id, body)  => api.post(`/clients/${id}/users`, body).then(r => r.data);
export const updateClientUser = (id, uid, body) => api.patch(`/clients/${id}/users/${uid}`, body).then(r => r.data);
export const removeClientUser = (id, uid)   => api.delete(`/clients/${id}/users/${uid}`).then(r => r.data);

// ── Users (super admin / platform) ───────────────────────────
export const getUsers   = ()          => api.get('/users').then(r => r.data);
export const createUser = (body)      => api.post('/users', body).then(r => r.data);
export const updateUser = (id, body)  => api.patch(`/users/${id}`, body).then(r => r.data);
export const deleteUser = (id)        => api.delete(`/users/${id}`).then(r => r.data);

// ── Knowledge Base ────────────────────────────────────────────
export const getKnowledge  = (section)        => api.get(`/knowledge/${section}`).then(r => r.data);
export const saveKnowledge = (section, body)  => api.put(`/knowledge/${section}`, body).then(r => r.data);

export default api;
