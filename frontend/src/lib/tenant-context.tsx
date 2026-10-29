'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Faskes, UserRole } from './types';
import { fetchFaskesList } from './api';

interface TenantContextType {
  faskesList: Faskes[];
  selectedFaskesId: number | null;
  currentFaskes: Faskes | null;
  role: UserRole;
  isLoading: boolean;
  setSelectedFaskesId: (id: number | null) => void;
  setRole: (role: UserRole) => void;
  refreshFaskes: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [faskesList, setFaskesList] = useState<Faskes[]>([]);
  const [selectedFaskesId, setSelectedFaskesIdState] = useState<number | null>(null);
  const [role, setRoleState] = useState<UserRole>('SUPER_ADMIN_DINKES');
  const [isLoading, setIsLoading] = useState(true);

  const refreshFaskes = async () => {
    try {
      const list = await fetchFaskesList();
      setFaskesList(list);
    } catch (err) {
      console.error('Error fetching faskes list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Muat preferensi awal dari localStorage jika ada
    const savedFaskes = localStorage.getItem('nifas_tenant_faskes_id');
    const savedRole = localStorage.getItem('nifas_tenant_role') as UserRole | null;
    if (savedFaskes !== null && savedFaskes !== 'null') {
      setSelectedFaskesIdState(Number(savedFaskes));
    }
    if (savedRole) {
      setRoleState(savedRole);
    }
    refreshFaskes();
  }, []);

  const setSelectedFaskesId = (id: number | null) => {
    setSelectedFaskesIdState(id);
    if (id === null) {
      localStorage.setItem('nifas_tenant_faskes_id', 'null');
      setRoleState('SUPER_ADMIN_DINKES');
      localStorage.setItem('nifas_tenant_role', 'SUPER_ADMIN_DINKES');
    } else {
      localStorage.setItem('nifas_tenant_faskes_id', String(id));
      setRoleState('BIDAN_JAGA');
      localStorage.setItem('nifas_tenant_role', 'BIDAN_JAGA');
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('nifas_tenant_role', newRole);
  };

  const currentFaskes = useMemo(() => {
    if (selectedFaskesId === null) return null;
    return faskesList.find((f) => f.id === selectedFaskesId) || null;
  }, [faskesList, selectedFaskesId]);

  return (
    <TenantContext.Provider
      value={{
        faskesList,
        selectedFaskesId,
        currentFaskes,
        role,
        isLoading,
        setSelectedFaskesId,
        setRole,
        refreshFaskes,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
