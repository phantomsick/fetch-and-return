
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  authError: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const setupAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        await fetchProfile(data.session.user.id);
      }
      
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      });

      setLoading(false);
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, []);
  
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    setProfile(data as Profile);
  };
  
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setAuthError(error.message);
        toast({
          title: "Authentication error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in."
      });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Authentication error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created successfully."
      });
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign out error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Signed out",
        description: "You've been successfully logged out."
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        user, 
        profile, 
        signIn, 
        signUp, 
        signOut, 
        loading,
        authError 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
