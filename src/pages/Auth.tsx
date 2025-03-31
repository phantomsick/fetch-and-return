
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/auth-page";
import { useAuth } from "@/context/auth-context";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
    
    // Redirect if already logged in
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
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
