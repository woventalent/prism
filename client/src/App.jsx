import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClientProvider } from './context/ClientContext';
import { getClients } from './api';
import LoginPage              from './pages/LoginPage';
import AuthCallbackPage       from './pages/AuthCallbackPage';
import KnowledgePage          from './pages/KnowledgePage';
import SettingsPage           from './pages/SettingsPage';
import WorkspaceSelectorPage  from './pages/WorkspaceSelectorPage';
import SuperAdminPage         from './pages/SuperAdminPage';
import Layout                 from './components/Layout';

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Outfit,sans-serif', color: '#00259C', fontSize: 16 }}>
      Loading…
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function SuperAdminRoute({ children }) {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/workspaces" replace />;
  return children;
}

// Resolves slug → client, wraps with ClientProvider
function WorkspaceLayout() {
  const { clients, setClients, isSuperAdmin } = useAuth();
  const { clientSlug } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [role,   setRole]   = useState(null);

  useEffect(() => {
    async function resolve() {
      let list = clients;
      if (!list || !list.length) {
        try {
          list = await getClients();
          setClients(list);
        } catch {
          navigate('/workspaces', { replace: true });
          return;
        }
      }
      const found = list.find(c => c.slug === clientSlug);
      if (!found) { navigate('/workspaces', { replace: true }); return; }
      localStorage.setItem('prism_client_id', found.id);
      setClient(found);
      setRole(found.workspace_role || found.my_role || (isSuperAdmin ? 'admin' : 'member'));
    }
    resolve();
  }, [clientSlug]); // eslint-disable-line

  if (!client) return <Spinner />;
  return (
    <ClientProvider client={client} workspaceRole={role}>
      <Layout />
    </ClientProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route path="/workspaces" element={<PrivateRoute><WorkspaceSelectorPage /></PrivateRoute>} />
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />

          <Route path="/w/:clientSlug" element={<PrivateRoute><WorkspaceLayout /></PrivateRoute>}>
            <Route index            element={<KnowledgePage />} />
            <Route path="settings"  element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/workspaces" replace />} />
          <Route path="*" element={<Navigate to="/workspaces" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
