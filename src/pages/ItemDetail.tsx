import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { CommentsSection } from "@/components/items/comments-section";
import { Comment, Item, supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { 
  CalendarIcon, 
  ChevronLeft, 
  Loader2, 
  MapPin, 
  MailIcon, 
  PhoneIcon,
  CheckSquare,
  XSquare
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [darkMode, setDarkMode] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
    
    if (id) {
      fetchItem(id);
      fetchComments(id);
    }
  }, [id]);
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  
  const fetchItem = async (itemId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          user:profiles!user_id (
            id,
            name,
            email,
            profile_picture
          )
        `)
        .eq('id', itemId)
        .single();
      
      if (error) {
        throw error;
      }
      
      setItem(data as unknown as Item);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast({
        title: "Error",
        description: "Failed to load item details. Please try again later.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchComments = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!user_id (
            id,
            name,
            profile_picture
          )
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setComments(data as unknown as Comment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };
  
  const updateItemStatus = async (newStatus: 'Open' | 'Resolved') => {
    if (!item || !user) return;
    
    // Check if the current user is the item owner
    if (user.id !== item.user_id) {
      toast({
        title: "Permission denied",
        description: "Only the item owner can update the status.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', item.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setItem({ ...item, status: newStatus });
      
      toast({
        title: "Status updated",
        description: `Item status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({
        title: "Error",
        description: "Failed to update item status. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  const formatContactInfo = (contactInfo: string) => {
    // Simple formatting to detect email and phone numbers
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phonePattern = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
    
    if (emailPattern.test(contactInfo)) {
      return (
        <div className="flex items-center">
          <MailIcon className="h-4 w-4 mr-2" />
          <a href={`mailto:${contactInfo}`} className="text-primary hover:underline">
            {contactInfo}
          </a>
        </div>
      );
    }
    
    if (phonePattern.test(contactInfo)) {
      return (
        <div className="flex items-center">
          <PhoneIcon className="h-4 w-4 mr-2" />
          <a href={`tel:${contactInfo}`} className="text-primary hover:underline">
            {contactInfo}
          </a>
        </div>
      );
    }
    
    return <div>{contactInfo}</div>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header setDarkMode={setDarkMode} darkMode={darkMode} />
      
      <main className="flex-1 container py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : item ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2">
                {item.image_url ? (
                  <div className="rounded-xl overflow-hidden border">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl h-60 bg-muted flex items-center justify-center border">
                    <span className="text-muted-foreground">No image available</span>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-1/2 space-y-6">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={
                      item.category === "Lost" ? "category-badge-lost" : "category-badge-found"
                    }
                  >
                    {item.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "Open" ? "status-badge-open" : "status-badge-resolved"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                
                <h1 className="text-3xl font-bold">{item.title}</h1>
                
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.user?.profile_picture || ""} />
                    <AvatarFallback>{getInitials(item.user?.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm text-muted-foreground">Posted by </span>
                    <span className="font-medium">{item.user?.name || "Anonymous"}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>
                    {item.date && format(new Date(item.date), "MMMM d, yyyy")}
                  </span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>{item.location}</span>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="whitespace-pre-line">{item.description}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  {formatContactInfo(item.contact_info)}
                </div>
                
                {user && user.id === item.user_id && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Item Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.status === "Open" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button disabled={updating}>
                              <CheckSquare className="mr-2 h-4 w-4" />
                              Mark as Resolved
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark as Resolved?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark this item as resolved? This will indicate
                                that the item has been returned to its owner or claimed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => updateItemStatus("Resolved")}
                              >
                                Yes, Mark as Resolved
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={updating}>
                              <XSquare className="mr-2 h-4 w-4" />
                              Reopen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reopen Item?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reopen this item? This will change the status
                                back to "Open" and indicate that the item is still lost or unclaimed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => updateItemStatus("Open")}
                              >
                                Yes, Reopen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 border-t pt-8">
              <CommentsSection
                itemId={item.id}
                comments={comments}
                onCommentAdded={() => fetchComments(item.id)}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-medium mb-2">Item not found</h3>
            <p className="text-muted-foreground mb-6">
              The item you're looking for might have been removed or doesn't exist.
            </p>
            <Button onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
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

export default ItemDetail;
