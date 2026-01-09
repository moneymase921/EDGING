'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface UserContextType {
  username: string | null;
  isLoading: boolean;
  setUsername: (name: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ev_username');
    if (stored) {
      setUsernameState(stored);
    }
    setIsLoading(false);
  }, []);

  const setUsername = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed) {
      localStorage.setItem('ev_username', trimmed);
      setUsernameState(trimmed);
    }
  };

  const logout = () => {
    localStorage.removeItem('ev_username');
    setUsernameState(null);
  };

  return (
    <UserContext.Provider value={{ username, isLoading, setUsername, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

// Hook that redirects to login if no username
export function useRequireUser() {
  const { username, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !username) {
      router.push('/login');
    }
  }, [username, isLoading, router]);

  return { username, isLoading };
}
