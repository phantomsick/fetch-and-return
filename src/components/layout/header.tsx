
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Menu, Search, PlusCircle, User, LogOut, Home, MapPin, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  setDarkMode: (value: boolean) => void;
  darkMode: boolean;
  onSearch?: (query: string) => void;
}

export function Header({ setDarkMode, darkMode, onSearch }: HeaderProps) {
  const navigate = useNavigate();
  const { user, signOut, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Lost & Found</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => navigate("/")}
                  >
                    <Home className="mr-2 h-5 w-5" />
                    Home
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => navigate("/dashboard")}
                  >
                    <User className="mr-2 h-5 w-5" />
                    My Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => navigate("/my-items")}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    My Items
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => navigate("/create")}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Report Item
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          <Button
            variant="ghost"
            className="text-lg font-bold text-primary"
            onClick={() => navigate("/")}
          >
            <MapPin className="mr-2 h-5 w-5" />
            Lost & Found
          </Button>
        </div>
        
        <form onSubmit={handleSearch} className="hidden md:flex relative w-full max-w-sm mx-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for lost or found items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-2">
          {!isMobile && user && (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
              >
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/my-items")}
              >
                My Items
              </Button>
              <Button
                variant="default"
                onClick={() => navigate("/create")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Report Item
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profile_picture || ""} alt={profile?.name || ""} />
                    <AvatarFallback>{profile?.name ? getInitials(profile.name) : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.name && <p className="font-medium">{profile.name}</p>}
                    {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-items")}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>My Items</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
}
