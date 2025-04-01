
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
      await supabase.functions.invoke('schedule-deletion-notification', {
        body: { itemId }
      });
    } catch (e) {
      console.error('Error scheduling deletion notification:', e);
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
    // Calculate the timestamp for 48 hours ago
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 48);
    
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .eq('status', 'Resolved')
      .lt('resolved_at', cutoffTime.toISOString());
    
    if (error) {
      console.error('Error fetching old resolved items:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const itemIds = data.map(item => item.id);
      
      // Delete the items
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .in('id', itemIds);
      
      if (deleteError) {
        console.error('Error deleting old resolved items:', deleteError);
      } else {
        console.log(`Successfully deleted ${itemIds.length} old resolved items`);
      }
    }
  } catch (error) {
    console.error('Error in cleanupResolvedItems:', error);
  }
};
