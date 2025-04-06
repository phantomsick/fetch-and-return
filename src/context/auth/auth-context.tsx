
import React, { createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import useAuthProvider, { AuthContextState } from './useAuthProvider';
import { Profile } from '@/lib/supabase';

export interface AuthContextInterface extends AuthContextState {
  loading: boolean;
  authError: string | null;
  verifyOTP?: (email: string, token: string, session: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthProvider();
  
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextInterface {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export type { User, Session, AuthError, Profile };
