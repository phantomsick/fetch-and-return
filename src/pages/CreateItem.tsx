
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ItemForm } from "@/components/items/item-form";

const CreateItem = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header setDarkMode={setDarkMode} darkMode={darkMode} />
      
      <main className="flex-1 container py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Report an Item</h1>
          <p className="text-muted-foreground">
            Help someone find their lost item or report something you've found
          </p>
        </div>
        
        <ItemForm />
      </main>
      
      <footer className="border-t py-6 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Lost & Found App. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default CreateItem;
