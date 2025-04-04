
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string, session?: any) => Promise<void>;
  loading: boolean;
  authError: string | null;
};
