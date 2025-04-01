
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/items/item-card";
import { Item, supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface ItemsGridProps {
  searchQuery: string;
  filters: {
    category?: string;
    status?: string;
    location?: string;
    date?: Date;
  };
  userId: string | undefined;
}

export function ItemsGrid({ searchQuery, filters, userId }: ItemsGridProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (userId) {
      fetchItems(searchQuery, filters);
    }
  }, [userId]);
  
  const fetchItems = async (search = "", newFilters = filters) => {
    try {
      setLoading(true);
      setFetchError(null);
      
      console.log("Fetching items with filters:", newFilters);
      
      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply search if provided
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Apply filters if they exist
      if (newFilters.category) {
        console.log("Applying category filter:", newFilters.category);
        query = query.eq('category', newFilters.category);
      }
      
      if (newFilters.status) {
        console.log("Applying status filter:", newFilters.status);
        query = query.eq('status', newFilters.status);
      }
      
      if (newFilters.location) {
        console.log("Applying location filter:", newFilters.location);
        query = query.ilike('location', `%${newFilters.location}%`);
      }
      
      if (newFilters.date) {
        const dateStr = newFilters.date.toISOString().split('T')[0];
        console.log("Applying date filter:", dateStr);
        query = query.gte('date', `${dateStr}T00:00:00`).lte('date', `${dateStr}T23:59:59`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      console.log("Fetched items:", data);
      
      // Get user profiles for each item
      const itemsWithUsers = await Promise.all((data as Item[]).map(async (item) => {
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', item.user_id)
            .single();
          
          return {
            ...item,
            user: userError ? null : userData
          };
        } catch (err) {
          console.error(`Error fetching user for item ${item.id}:`, err);
          return {
            ...item,
            user: null
          };
        }
      }));
      
      setItems(itemsWithUsers as Item[]);
    } catch (error) {
      console.error('Error fetching items:', error);
      setFetchError("Failed to load items. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load items. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (fetchError) {
    return (
      <div className="text-center py-16 border rounded-lg bg-destructive/10 text-destructive">
        <h3 className="text-2xl font-medium mb-2">Error Loading Items</h3>
        <p className="mb-6">{fetchError}</p>
        <Button 
          variant="outline" 
          onClick={() => fetchItems(searchQuery, filters)}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-muted/30">
        <h3 className="text-2xl font-medium mb-2">No items found</h3>
        <p className="text-muted-foreground mb-6">
          Try adjusting your search or filters, or report a new item.
        </p>
        <Button onClick={() => navigate("/create")}>
          Report an Item
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
