import React, { createContext, useContext, useState, useEffect } from 'react';

const ClientContext = createContext(null);

export function ClientProvider({ client, workspaceRole, children }) {
  useEffect(() => {
    if (client?.id) localStorage.setItem('prism_client_id', client.id);
  }, [client?.id]);

  const canEdit = workspaceRole === 'admin';

  return (
    <ClientContext.Provider value={{ client, workspaceRole, canEdit }}>
      {children}
    </ClientContext.Provider>
  );
}

export const useClient = () => useContext(ClientContext);
