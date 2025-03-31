
import { supabase } from '@/integrations/supabase/client';

export { supabase };

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  profile_picture: string | null;
};

export type Item = {
  id: string;
  title: string;
  description: string | null;
  category: 'Lost' | 'Found';
  location: string;
  image_url: string | null;
  date: string;
  user_id: string;
  status: 'Open' | 'Resolved';
  contact_info: string;
  created_at: string;
  user?: Profile | null;
};

export type Comment = {
  id: string;
  item_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: Profile | null;
};

// Function to get appropriate resolution message based on category
export const getResolutionMessage = (category: 'Lost' | 'Found'): string => {
  if (category === 'Lost') {
    return "Item has been found and returned to the owner";
  } else {
    return "Item has been claimed by its owner";
  }
};

// Function to get appropriate action text based on category
export const getResolutionActionText = (category: 'Lost' | 'Found'): string => {
  if (category === 'Lost') {
    return "Mark as Found & Returned";
  } else {
    return "Mark as Claimed by Owner";
  }
};
