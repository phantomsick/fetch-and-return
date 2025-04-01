
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
  resolved_at?: string | null;
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

// Function to mark an item as resolved
export const markItemAsResolved = async (itemId: string): Promise<boolean> => {
  try {
    const resolvedAt = new Date().toISOString();
    
    const { error } = await supabase
      .from('items')
      .update({ 
        status: 'Resolved',
        resolved_at: resolvedAt 
      })
      .eq('id', itemId);
    
    if (error) {
      console.error('Error marking item as resolved:', error);
      return false;
    }
    
    // Schedule notification about upcoming deletion
    try {
      const { data, error } = await supabase.functions.invoke('schedule-deletion-notification', {
        body: { itemId }
      });
      
      if (error) {
        console.error('Error scheduling deletion notification:', error);
      } else {
        console.log('Deletion notification scheduled:', data);
      }
    } catch (e) {
      console.error('Exception scheduling deletion notification:', e);
      // Continue anyway, this shouldn't prevent the item from being marked as resolved
    }
    
    return true;
  } catch (error) {
    console.error('Error in markItemAsResolved:', error);
    return false;
  }
};

// Function to check and delete resolved items older than 48 hours
export const cleanupResolvedItems = async (): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('cleanup-resolved-items');
    
    if (error) {
      console.error('Error invoking cleanup function:', error);
      return;
    }
    
    console.log('Cleanup function response:', data);
  } catch (error) {
    console.error('Error in cleanupResolvedItems:', error);
  }
};
