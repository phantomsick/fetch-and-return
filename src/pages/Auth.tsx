
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/auth-page";
import { useAuth } from "@/context/auth-context";

const Auth = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  
  // Use a try-catch block to safely access auth context
  let authUser = null;
  try {
    const { user } = useAuth();
    authUser = user;
  } catch (error) {
    console.log("Auth context not available yet, waiting...");
  }
  
  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
    
    // Redirect if already logged in
    if (authUser) {
      navigate("/");
    }
  }, [authUser, navigate]);
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return <AuthPage />;
};

export default Auth;
