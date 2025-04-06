
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

// Function to get appropriate reopen message based on category
export const getReopenMessage = (category: 'Lost' | 'Found'): string => {
  if (category === 'Lost') {
    return "Item is still missing";
  } else {
    return "Item is available again";
  }
};

// Function to get appropriate reopen action text based on category
export const getReopenActionText = (category: 'Lost' | 'Found'): string => {
  if (category === 'Lost') {
    return "Reopen as Still Missing";
  } else {
    return "Reopen as Available";
  }
};

// Function to check if an item can be reopened (within 48 hours of being resolved)
export const canReopenItem = (resolvedDate: string): boolean => {
  const now = new Date();
  const resolvedTime = new Date(resolvedDate);
  const diffInHours = (now.getTime() - resolvedTime.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 48;
};
