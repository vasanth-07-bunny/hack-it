import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@abhiyantrix/shared-types';
import { getApiUrl } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  allUsers: User[];
  isLoading: boolean;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('organizer');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch(getApiUrl('/api/auth/users'));
      if (res.ok) {
        const users: User[] = await res.json();
        setAllUsers(users);

        // Set default user if not set
        if (!currentUser) {
          const savedUserId = localStorage.getItem('abhiyantrix_user_id');
          const matched = users.find(u => u.id === savedUserId) || users.find(u => u.role === 'organizer') || users[0];
          if (matched) {
            setCurrentUser(matched);
            setCurrentRole(matched.role);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const switchUser = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setCurrentRole(target.role);
      localStorage.setItem('abhiyantrix_user_id', target.id);
    }
  };

  const switchRole = (role: UserRole) => {
    const target = allUsers.find(u => u.role === role);
    if (target) {
      switchUser(target.id);
    } else {
      setCurrentRole(role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        allUsers,
        isLoading,
        switchUser,
        switchRole,
        refreshUsers: fetchUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
