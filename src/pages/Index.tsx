
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { ItemCard } from "@/components/items/item-card";
import { ItemFilter } from "@/components/items/item-filter";
import { Item, supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Filters
  const [filters, setFilters] = useState<{
    category?: string;
    status?: string;
    location?: string;
    date?: Date;
  }>({});
  
  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
    
    if (user) {
      fetchItems();
    }
  }, [user]);
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  
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
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchItems(query);
  };
  
  const handleFilter = (newFilters: {
    category?: string;
    status?: string;
    location?: string;
    date?: Date;
  }) => {
    setFilters(newFilters);
    fetchItems(searchQuery, newFilters); 
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Lost & Found</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Please sign in to access the Lost & Found system
          </p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        setDarkMode={setDarkMode} 
        darkMode={darkMode} 
        onSearch={handleSearch}
      />
      
      <main className="flex-1 container py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Lost & Found</h1>
          <p className="text-xl text-muted-foreground">
            Connect lost items with their rightful owners
          </p>
        </div>
        
        <div className="md:hidden mb-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchQuery);
          }} className="flex gap-2">
            <Input
              type="search"
              placeholder="Search for lost or found items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>
        
        <ItemFilter onFilter={handleFilter} />
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : fetchError ? (
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
        ) : items.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-lg bg-muted/30">
            <h3 className="text-2xl font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters, or report a new item.
            </p>
            <Button onClick={() => navigate("/create")}>
              Report an Item
            </Button>
          </div>
        )}
      </main>
      
      <footer className="border-t py-6 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Lost & Found App. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
