
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toasts = createToastMessages();
  
  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Set up auth state listener first
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.id);
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Defer fetching profile to avoid auth deadlock
            setTimeout(async () => {
              const userProfile = await fetchProfile(session.user.id);
              if (userProfile) {
                setProfile(userProfile);
                setIsAdmin(userProfile.role === 'admin');
                
                // If user is banned, sign them out
                if (userProfile.banned) {
                  toasts.showLoginError("Your account has been banned.");
                  signOut();
                  return;
                }
              }
            }, 0);
            
            if (location.pathname === '/auth') {
              navigate('/');
            }
          } else {
            setProfile(null);
            setIsAdmin(false);
            if (event === 'SIGNED_OUT') {
              navigate('/auth');
            }
          }
        });
        
        // Then check for existing session
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          const userProfile = await fetchProfile(data.session.user.id);
          if (userProfile) {
            setProfile(userProfile);
            setIsAdmin(userProfile.role === 'admin');
            console.log("User role:", userProfile.role);
            console.log("Is admin:", userProfile.role === 'admin');
            
            // If user is banned, sign them out
            if (userProfile.banned) {
              toasts.showLoginError("Your account has been banned.");
              signOut();
              return;
            }
          }
        }
        
        setLoading(false);
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth setup error:", error);
        setLoading(false);
      }
    };
    
    setupAuth();
  }, [navigate, location.pathname]);
  
  useEffect(() => {
    if (location.pathname === '/auth' || location.pathname === '/') return;
    
    // Only allow admin users to access the admin dashboard
    if (location.pathname === '/admin' && !loading && (!user || !isAdmin)) {
      console.log("Unauthorized admin access attempt. User is admin:", isAdmin);
      navigate('/');
      toasts.showLoginError("You do not have permission to access the admin dashboard.");
      return;
    }
    
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, location.pathname, navigate]);
  
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Check if this is the admin user
      if (email === 'admin@gmail.com') {
        // Use admin login endpoint
        const response = await supabase.functions.invoke('admin-login', {
          body: { email, password }
        });
        
        if (response.error) {
          setAuthError(response.error.message);
          toasts.showLoginError(response.error.message);
          return;
        }
        
        if (response.data && response.data.success) {
          toasts.showLoginSuccess();
          
          // Force refresh the session
          const { data } = await supabase.auth.getSession();
          if (data && data.session) {
            setSession(data.session);
            setUser(data.session.user);
            
            // Update the user's profile
            const userProfile = await fetchProfile(data.session.user.id);
            if (userProfile) {
              setProfile(userProfile);
              setIsAdmin(userProfile.role === 'admin');
            }
          }
          
          // Redirect to admin dashboard if admin
          if (response.data.isAdmin) {
            navigate('/admin');
          }
        } else {
          setAuthError("Authentication failed");
          toasts.showLoginError("Authentication failed");
        }
        
        return;
      }
      
      // Regular user sign in
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
    isAdmin,
    signIn, 
    signUp, 
    signOut,
    resetPassword,
    verifyOTP,
    loading,
    authError 
  };
};
