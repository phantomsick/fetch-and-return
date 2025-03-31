
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/auth-page";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Use a try-catch block to safely access auth context
  let authUser = null;
  let getAuthError = null;
  try {
    const { user, authError } = useAuth();
    authUser = user;
    getAuthError = authError;
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

    // Set auth error if present
    if (getAuthError) {
      setAuthError(getAuthError);
    }
  }, [authUser, navigate, getAuthError]);
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="flex flex-col">
      {authError === "Email not confirmed" && (
        <Alert className="max-w-md mx-auto mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">Email verification required</AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-500">
            Please check your email and click the confirmation link to verify your account.
            <br />
            <span className="text-sm mt-1 block">
              For development purposes, you can disable email confirmation in the Supabase dashboard under Authentication &gt; Providers.
            </span>
          </AlertDescription>
        </Alert>
      )}
      <AuthPage />
    </div>
  );
};

export default Auth;
