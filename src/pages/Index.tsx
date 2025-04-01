
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ItemFilter } from "@/components/items/item-filter";
import { WelcomeBanner } from "@/components/items/welcome-banner";
import { MobileSearch } from "@/components/items/mobile-search";
import { ItemsGrid } from "@/components/items/items-grid";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "@/context/auth/auth-context";

const Index = () => {
  const { darkMode, setDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Filters
  const [filters, setFilters] = useState<{
    category?: string;
    status?: string;
    location?: string;
    date?: Date;
  }>({});
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleFilter = (newFilters: {
    category?: string;
    status?: string;
    location?: string;
    date?: Date;
  }) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        setDarkMode={setDarkMode} 
        darkMode={darkMode} 
        onSearch={handleSearch}
      />
      
      <main className="flex-1 container py-8">
        <WelcomeBanner isAuthenticated={!!user} />
        
        {user && (
          <>
            <MobileSearch onSearch={handleSearch} />
            <ItemFilter onFilter={handleFilter} />
            <ItemsGrid 
              searchQuery={searchQuery} 
              filters={filters} 
              userId={user?.id}
            />
          </>
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
