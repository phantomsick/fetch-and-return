
import { useState, useEffect } from "react";

export function useDarkMode() {
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
  
  return { darkMode, setDarkMode };
}
