
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WelcomeBannerProps {
  isAuthenticated: boolean;
}

export function WelcomeBanner({ isAuthenticated }: WelcomeBannerProps) {
  const navigate = useNavigate();

  if (!isAuthenticated) {
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
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Lost & Found</h1>
      <p className="text-xl text-muted-foreground">
        Connect lost items with their rightful owners
      </p>
    </div>
  );
}
