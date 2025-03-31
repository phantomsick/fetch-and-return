
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Item, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/items/item-card";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
    
    // Redirect if not logged in
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchUserItems();
  }, [user, navigate]);
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  
  const fetchUserItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Get user profiles for each item
      const itemsWithUsers = await Promise.all((data as Item[]).map(async (item) => {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', item.user_id)
          .single();
        
        return {
          ...item,
          user: userError ? null : userData
        };
      }));
      
      setItems(itemsWithUsers as Item[]);
    } catch (error) {
      console.error('Error fetching user items:', error);
      toast({
        title: "Error",
        description: "Failed to load your items. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filterItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };
  
  const filterItemsByStatus = (status: string) => {
    return items.filter(item => item.status === status);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header setDarkMode={setDarkMode} darkMode={darkMode} />
      
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Items</h1>
            <p className="text-muted-foreground">
              Manage your lost and found items
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/create")}
            className="mt-4 md:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Report New Item
          </Button>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="lost">Lost Items</TabsTrigger>
            <TabsTrigger value="found">Found Items</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="all">
                {items.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border rounded-lg bg-muted/30">
                    <h3 className="text-xl font-medium mb-2">No items yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't reported any lost or found items yet.
                    </p>
                    <Button onClick={() => navigate("/create")}>
                      Report an Item
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="lost">
                {filterItemsByCategory("Lost").length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filterItemsByCategory("Lost").map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border rounded-lg bg-muted/30">
                    <h3 className="text-xl font-medium mb-2">No lost items</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't reported any lost items yet.
                    </p>
                    <Button onClick={() => navigate("/create")}>
                      Report a Lost Item
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="found">
                {filterItemsByCategory("Found").length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filterItemsByCategory("Found").map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border rounded-lg bg-muted/30">
                    <h3 className="text-xl font-medium mb-2">No found items</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't reported any found items yet.
                    </p>
                    <Button onClick={() => navigate("/create")}>
                      Report a Found Item
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="open">
                {filterItemsByStatus("Open").length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filterItemsByStatus("Open").map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">
                      You don't have any open items.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="resolved">
                {filterItemsByStatus("Resolved").length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filterItemsByStatus("Resolved").map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">
                      You don't have any resolved items.
                    </p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
      
      <footer className="border-t py-6 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Lost & Found App. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
