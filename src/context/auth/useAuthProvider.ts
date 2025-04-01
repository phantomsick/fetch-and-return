
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchProfile, createToastMessages } from './helpers';

export const useAuthProvider = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toasts = createToastMessages();
  
  useEffect(() => {
    const setupAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        const userProfile = await fetchProfile(data.session.user.id);
        if (userProfile) {
          setProfile(userProfile);
        }
      }
      
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          if (userProfile) {
            setProfile(userProfile);
          }
          
          if (location.pathname === '/auth') {
            navigate('/');
          }
        } else {
          setProfile(null);
          if (event === 'SIGNED_OUT') {
            navigate('/auth');
          }
        }
      });

      setLoading(false);
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, [navigate, location.pathname]);
  
  useEffect(() => {
    if (location.pathname === '/auth') return;
    
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, location.pathname, navigate]);
  
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setAuthError(error.message);
        toasts.showLoginError(error.message);
        return;
      }
      
      toasts.showLoginSuccess();
    } catch (error) {
      console.error('Sign in error:', error);
      toasts.showUnexpectedError();
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        toasts.showLoginError(error.message);
        return null;
      }
      
      return data.session;
    } catch (error) {
      console.error('Sign up error:', error);
      toasts.showUnexpectedError();
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const verifyOTP = async (email: string, token: string, session?: any) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        setAuthError(error.message);
        toasts.showResetPasswordError(error.message);
        return;
      }
      
      toasts.showResetPasswordSuccess();
    } catch (error) {
      console.error('Password reset error:', error);
      toasts.showUnexpectedError();
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toasts.showSignOutError(error.message);
        return;
      }
      
      toasts.showSignOutSuccess();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toasts.showUnexpectedError();
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
    verifyOTP,
    loading,
    authError 
  };
};
