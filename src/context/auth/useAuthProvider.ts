
import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/supabase';

export interface AuthContextState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null;
    data: { session: Session | null; user: User | null } | null;
  }>;
  signInWithEmail: (email: string, password: string) => Promise<{
    error: AuthError | null;
    data: { session: Session | null; user: User | null } | null;
  }>;
  signUp: (email: string, password: string, userData?: { [key: string]: any }) => Promise<{
    error: AuthError | null;
    data: { session: Session | null; user: User | null } | null;
  }>;
  signOut: () => Promise<{
    error: Error | null;
  }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (accessToken: string, newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const useAuthProvider = (): AuthContextState => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<() => void>(() => () => {});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
        
        // Fetch user profile when auth state changes
        if (currentSession?.user) {
          fetchUserProfile(currentSession.user);
        } else {
          setProfile(null);
        }
      }
    );
    
    setUnsubscribe(() => subscription.unsubscribe);
    
    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserProfile(initialSession.user);
        }
      } catch (err) {
        console.error('Error fetching initial session:', err);
        setError(err as AuthError);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (user: User) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserProfile(user);
  };
  
  const signIn = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError, data: null };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    return signIn(email, password);
  };

  const signUp = async (email: string, password: string, userData?: { [key: string]: any }) => {
    try {
      const response = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData
        }
      });
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError, data: null };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
      
      return { error };
    } catch (err) {
      console.error('Error signing out:', err);
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      return { error };
    } catch (err) {
      console.error('Error resetting password:', err);
      return { error: err as AuthError };
    }
  };

  const updatePassword = async (accessToken: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      return { error };
    } catch (err) {
      console.error('Error updating password:', err);
      return { error: err as AuthError };
    }
  };

  return {
    user,
    profile,
    session,
    isLoading,
    error,
    signIn,
    signInWithEmail,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile
  };
};

export default useAuthProvider;
