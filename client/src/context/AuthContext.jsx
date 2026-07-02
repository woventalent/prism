import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('prism_token');
    if (!token) { setLoading(false); return; }
    getMe()
      .then(data => {
        const { clients: c, ...u } = data;
        setUser(u);
        setClients(c || []);
      })
      .catch(() => {
        localStorage.removeItem('prism_token');
        localStorage.removeItem('prism_client_id');
      })
      .finally(() => setLoading(false));
  }, []);

  // Called by AuthCallbackPage after Microsoft SSO redirect
  function loginWithToken(data) {
    localStorage.setItem('prism_token', data.token);
    setUser(data.user);
    setClients(data.clients || []);
  }

  function logout() {
    localStorage.removeItem('prism_token');
    localStorage.removeItem('prism_client_id');
    setUser(null);
    setClients([]);
  }

  const isSuperAdmin = !!user?.is_super_admin;
  const isAdmin      = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, clients, setClients, loading, loginWithToken, logout, isSuperAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
