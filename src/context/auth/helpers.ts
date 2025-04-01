
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as Profile;
  } catch (error) {
    console.error('Error in fetchProfile:', error);
    return null;
  }
};

export const createToastMessages = () => {
  const { toast } = useToast();
  
  return {
    showLoginSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in."
      });
    },
    showLoginError: (message: string) => {
      toast({
        title: "Authentication error",
        description: message,
        variant: "destructive"
      });
    },
    showSignOutSuccess: () => {
      toast({
        title: "Signed out",
        description: "You've been successfully logged out."
      });
    },
    showSignOutError: (message: string) => {
      toast({
        title: "Sign out error",
        description: message,
        variant: "destructive"
      });
    },
    showResetPasswordSuccess: () => {
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password."
      });
    },
    showResetPasswordError: (message: string) => {
      toast({
        title: "Password reset error",
        description: message,
        variant: "destructive"
      });
    },
    showUnexpectedError: () => {
      toast({
        title: "Authentication error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
};
