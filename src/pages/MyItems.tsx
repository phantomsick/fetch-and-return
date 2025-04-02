
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/items/item-card";
import { Item, supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth/auth-context";

const MyItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchUserItems();
    }
  }, [user]);
  
  const fetchUserItems = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      if (!user) {
        navigate('/auth');
        return;
      }
      
      console.log("Fetching items for user:", user.id);
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const itemsWithProfiles = await Promise.all(
          data.map(async (item) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', item.user_id)
              .single();
            
            return {
              ...item,
              user: profileData || null
            } as Item;
          })
        );
        
        console.log("Fetched user items:", itemsWithProfiles);
        setItems(itemsWithProfiles);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setFetchError("Failed to load your items. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load your items. Please try again later.",
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
          onClick={fetchUserItems}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Items</h1>
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <h3 className="text-2xl font-medium mb-2">You haven't reported any items yet</h3>
          <p className="text-muted-foreground mb-6">
            Report lost or found items to see them here.
          </p>
          <Button onClick={() => navigate("/create")}>
            Report an Item
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Items</h1>
        <Button onClick={() => navigate("/create")}>
          Report New Item
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default MyItems;
