
import { createClient } from '@supabase/supabase-js';

// These environment variables will be available through Lovable UI
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  profile_picture: string | null;
};

export type Item = {
  id: string;
  title: string;
  description: string;
  category: 'Lost' | 'Found';
  location: string;
  image_url: string | null;
  date: string;
  user_id: string;
  status: 'Open' | 'Resolved';
  contact_info: string;
  created_at: string;
  user?: Profile;
};

export type Comment = {
  id: string;
  item_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: Profile;
};
