
import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/supabase';

export interface AuthContextState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  loading: boolean; // Added to match interface
  error: AuthError | null;
  authError: string | null; // Added to match interface
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
  verifyOTP?: (email: string, token: string, session: any) => Promise<void>; // Added to match interface
}

const useAuthProvider = (): AuthContextState => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false); // Added to match interface
  const [error, setError] = useState<AuthError | null>(null);
  const [authError, setAuthError] = useState<string | null>(null); // Added to match interface
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
        setAuthError((err as Error).message || 'Authentication error');
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
    setLoading(true);
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      
      if (response.error) {
        setError(response.error);
        setAuthError(response.error.message);
      }
      
      setLoading(false);
      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      setAuthError((err as Error).message || 'Authentication error');
      setLoading(false);
      return { error: authError, data: null };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    return signIn(email, password);
  };

  const signUp = async (email: string, password: string, userData?: { [key: string]: any }) => {
    setLoading(true);
    try {
      // Convert string userData to object when it's just a name
      const userMetadata = typeof userData === 'string' 
        ? { name: userData } 
        : userData;
        
      const response = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userMetadata
        }
      });
      
      if (response.error) {
        setError(response.error);
        setAuthError(response.error.message);
      }
      
      setLoading(false);
      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      setAuthError((err as Error).message || 'Authentication error');
      setLoading(false);
      return { error: authError, data: null };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
      
      setLoading(false);
      return { error };
    } catch (err) {
      console.error('Error signing out:', err);
      setLoading(false);
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        setAuthError(error.message);
      }
      
      setLoading(false);
      return { error };
    } catch (err) {
      console.error('Error resetting password:', err);
      setAuthError((err as Error).message || 'Password reset error');
      setLoading(false);
      return { error: err as AuthError };
    }
  };

  const updatePassword = async (accessToken: string, newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setAuthError(error.message);
      }
      
      setLoading(false);
      return { error };
    } catch (err) {
      console.error('Error updating password:', err);
      setAuthError((err as Error).message || 'Password update error');
      setLoading(false);
      return { error: err as AuthError };
    }
  };

  // Mock verifyOTP function since it's used in the RegisterForm but not implemented
  const verifyOTP = async (email: string, token: string, session: any) => {
    setLoading(true);
    try {
      // This is just a placeholder - in a real implementation, you would verify the OTP with Supabase
      console.log("Verifying OTP for", email, "with token", token);
      setLoading(false);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setAuthError((err as Error).message || 'OTP verification error');
      setLoading(false);
      throw err;
    }
  };

  return {
    user,
    profile,
    session,
    isLoading,
    loading,
    error,
    authError,
    signIn,
    signInWithEmail,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    verifyOTP
  };
};

export default useAuthProvider;
