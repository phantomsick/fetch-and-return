import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, UserResponse, AuthError } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';

export interface SignInResponse {
  session: Session | null;
  user: User | null;
  error: AuthError | null;
}

export interface SignUpResponse {
  session: Session | null;
  user: User | null;
  error: AuthError | null;
}

export interface AuthContextState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<SignInResponse>;
  signUp: (email: string, password: string, userData?: Record<string, any>) => Promise<SignUpResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  loading: boolean;
  authError: string | null;
  verifyOTP: (email: string, token: string, session: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export default function useAuthProvider(): AuthContextState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Refreshing profile for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log("Fetched profile:", data);
      setProfile(data);
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  }, [user]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Only synchronous state updates here
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer Supabase calls with setTimeout
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }

      setLoading(false);
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log("Fetched profile:", data);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<SignInResponse> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { session: null, user: null, error };
      }

      return {
        session: data.session,
        user: data.user,
        error: null,
      };
    } catch (error: any) {
      setAuthError(error.message);
      return {
        session: null,
        user: null,
        error: error as AuthError,
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData?: Record<string, any>
  ): Promise<SignUpResponse> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        setAuthError(error.message);
        return { session: null, user: null, error };
      }

      return {
        session: data.session,
        user: data.user,
        error: null,
      };
    } catch (error: any) {
      setAuthError(error.message);
      return {
        session: null,
        user: null,
        error: error as AuthError,
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (
    email: string, 
    token: string, 
    providedSession: any
  ): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      setAuthError(error.message);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (
    password: string
  ): Promise<{ error: AuthError | null }> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      setAuthError(error.message);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    profile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    loading,
    authError,
    verifyOTP,
    refreshProfile
  };
}
