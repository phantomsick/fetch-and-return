import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, Item, Comment, getResolutionMessage, getResolutionActionText, markItemAsResolved } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, User, Calendar, Phone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CommentsSection } from "@/components/items/comments-section";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/context/auth/auth-context";

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isResolving, setIsResolving] = useState(false);
  
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        setError("Item ID is missing.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw new Error(`Failed to fetch item: ${error.message}`);
        }
        
        if (!data) {
          setError("Item not found.");
          return;
        }
        
        setItem(data as Item);
      } catch (err: any) {
        setError(err.message || "Failed to load item.");
        toast({
          title: "Error",
          description: err.message || "Failed to load item.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchItem();
  }, [id, toast]);
  
  const handleResolveClick = async () => {
    if (!item) return;
    
    setIsResolving(true);
    
    const success = await markItemAsResolved(item.id);
    
    if (success) {
      toast({
        title: "Item Resolved",
        description: getResolutionMessage(item.category),
      });
      
      // Optimistically update the item's status
      setItem({ ...item, status: 'Resolved' });
    } else {
      toast({
        title: "Error",
        description: "Failed to mark item as resolved. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsResolving(false);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !item) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error || "Item not found."}</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  const formattedDate = formatDistanceToNow(new Date(item.date || item.created_at), {
    addSuffix: true,
  });
  
  const fullDate = format(new Date(item.date || item.created_at), 'PPP');
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/')}>
          ← Back to Home
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Item Image */}
        <div>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full rounded-lg shadow-md aspect-video object-cover"
            />
          ) : (
            <div className="w-full rounded-lg shadow-md aspect-video bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>
        
        {/* Item Details */}
        <div>
          <h1 className="text-3xl font-semibold mb-4">{item.title}</h1>
          
          <div className="flex items-center text-muted-foreground mb-2">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{item.location}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground mb-4">
            <User className="mr-2 h-4 w-4" />
            <span>{item.user_id}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground mb-4">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{fullDate} ({formattedDate})</span>
          </div>
          
          <p className="text-muted-foreground mb-6">{item.description}</p>
          
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">Contact Information</h4>
            <div className="flex items-center text-muted-foreground">
              <Phone className="mr-2 h-4 w-4" />
              <span>{item.contact_info}</span>
            </div>
          </div>
          
          {item.status === 'Open' && user?.id === item.user_id && (
            <Button 
              onClick={handleResolveClick}
              disabled={isResolving}
              className="w-full"
            >
              {isResolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {getResolutionActionText(item.category)}
                </>
              )}
            </Button>
          )}
          
          {item.status === 'Resolved' && (
            <div className="mt-4 p-4 rounded-md bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <CheckCircle2 className="mr-2 h-4 w-4 inline-block align-middle" />
              <span className="align-middle">This item has been marked as resolved.</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="mt-8">
        <CommentsSection itemId={id} />
      </div>
    </div>
  );
};

export default ItemDetail;
