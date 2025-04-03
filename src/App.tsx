
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth/auth-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useEffect } from "react";
import { initializeStorage } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import MyItems from "@/pages/MyItems";
import CreateItem from "@/pages/CreateItem";
import ItemDetail from "@/pages/ItemDetail";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Initialize storage buckets on app load
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeStorage();
        console.log("Storage initialization completed");
      } catch (error) {
        console.error("Error during storage initialization:", error);
      }
    };
    
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="lost-and-found-theme">
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-items" element={<MyItems />} />
              <Route path="/create" element={<CreateItem />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
