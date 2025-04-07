import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  supabase, 
  Item, 
  Comment, 
  getResolutionMessage, 
  getResolutionActionText,
  getReopenMessage,
  getReopenActionText,
  canReopenItem
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, User, Calendar, Phone, AlertTriangle, CheckCircle2, Trash2, RefreshCw } from "lucide-react";
import { CommentsSection } from "@/components/items/comments-section";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/context/auth/auth-context";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isResolving, setIsResolving] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resolvedDate, setResolvedDate] = useState<string | null>(null);
  
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
        
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();
        
        if (itemError) {
          console.error("Error fetching item:", itemError);
          throw new Error(`Failed to fetch item: ${itemError.message}`);
        }
        
        if (!itemData) {
          setError("Item not found.");
          return;
        }
        
        // Fetch the user profile associated with this item
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', itemData.user_id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }
          
        const itemWithProfile = {
          ...itemData,
          user: profileData || { 
            id: itemData.user_id,
            name: null,
            email: null,
            profile_picture: null 
          }
        } as Item;
        
        console.log("Fetched item with profile:", itemWithProfile);
        setItem(itemWithProfile);
        
        // For resolved items, check when it was resolved
        if (itemData.status === 'Resolved') {
          // Get audit logs or use created_at as a fallback
          setResolvedDate(itemData.created_at);
        }
        
        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('item_id', id)
          .order('created_at', { ascending: false });
        
        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
        } else if (commentsData) {
          // Fetch profile data for each comment
          const commentsWithProfiles = await Promise.all(
            commentsData.map(async (comment) => {
              try {
                const { data: userProfile, error: userProfileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', comment.user_id)
                  .single();
                  
                if (userProfileError) {
                  console.error("Error fetching comment user profile:", userProfileError);
                }
                  
                return {
                  ...comment,
                  user: userProfile || { 
                    id: comment.user_id,
                    name: null,
                    email: null,
                    profile_picture: null
                  }
                } as Comment;
              } catch (err) {
                console.error("Error processing comment:", err);
                return {
                  ...comment,
                  user: { 
                    id: comment.user_id,
                    name: null,
                    email: null,
                    profile_picture: null
                  }
                } as Comment;
              }
            })
          );
          
          setComments(commentsWithProfiles);
        }
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
    
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: 'Resolved' })
        .eq('id', item.id);
      
      if (error) {
        console.error("Error marking item as resolved:", error);
        throw error;
      }
      
      toast({
        title: "Item Resolved",
        description: getResolutionMessage(item.category),
      });
      
      setItem({ ...item, status: 'Resolved' });
      setResolvedDate(new Date().toISOString());
    } catch (error) {
      console.error('Error marking item as resolved:', error);
      toast({
        title: "Error",
        description: "Failed to mark item as resolved. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleReopenClick = async () => {
    if (!item) return;
    
    setIsReopening(true);
    
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: 'Open' })
        .eq('id', item.id);
      
      if (error) {
        console.error("Error reopening item:", error);
        throw error;
      }
      
      toast({
        title: "Item Reopened",
        description: getReopenMessage(item.category),
      });
      
      setItem({ ...item, status: 'Open' });
      setResolvedDate(null);
    } catch (error) {
      console.error('Error reopening item:', error);
      toast({
        title: "Error",
        description: "Failed to reopen the item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReopening(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!item) return;
    
    setIsDeleting(true);
    
    try {
      // First delete all comments associated with this item
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('item_id', item.id);
      
      if (commentsError) {
        console.error('Error deleting comments:', commentsError);
      }
      
      // Then delete the item
      const { error: itemError } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);
      
      if (itemError) {
        console.error("Error deleting item:", itemError);
        throw itemError;
      }
      
      toast({
        title: "Item Deleted",
        description: "The item has been successfully deleted.",
      });
      
      // Close the dialog and redirect to the home page
      setShowDeleteDialog(false);
      navigate('/');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  const handleCommentAdded = async (newComment: Comment) => {
    setComments(prevComments => [newComment, ...prevComments]);
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
  
  const displayName = item?.user?.name || "Anonymous";
  
  const formattedDate = formatDistanceToNow(new Date(item.date || item.created_at), {
    addSuffix: true,
  });
  
  const fullDate = format(new Date(item.date || item.created_at), 'PPP');
  const canReopen = item.status === 'Resolved' && resolvedDate && canReopenItem(resolvedDate);
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/')}>
          ← Back to Home
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {item?.image_url ? (
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
        
        <div>
          <h1 className="text-3xl font-semibold mb-4">{item?.title}</h1>
          
          <div className="flex items-center text-muted-foreground mb-2">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{item?.location}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground mb-2">
            <User className="mr-2 h-4 w-4" />
            <span>{displayName}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground mb-2">
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
            <div className="space-y-4">
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
              
              <Button 
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="w-full"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Item
                  </>
                )}
              </Button>
            </div>
          )}
          
          {item.status === 'Resolved' && (
            <div className="mt-4 p-4 rounded-md bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <CheckCircle2 className="mr-2 h-4 w-4 inline-block align-middle" />
              <span className="align-middle">This item has been marked as resolved.</span>
            </div>
          )}
          
          {item.status === 'Resolved' && user?.id === item.user_id && (
            <div className="space-y-4 mt-4">
              {canReopen && (
                <Button 
                  onClick={handleReopenClick}
                  disabled={isReopening}
                  className="w-full"
                  variant="outline"
                >
                  {isReopening ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reopening...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {getReopenActionText(item.category)}
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="w-full"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Item
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <CommentsSection 
          itemId={id || ""} 
          comments={comments} 
          onCommentAdded={handleCommentAdded} 
        />
      </div>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the item and remove all associated comments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemDetail;
