
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

interface CommentsProps {
  itemId: string;
  comments: Comment[];
  onCommentAdded: () => void;
}

export function CommentsSection({ itemId, comments, onCommentAdded }: CommentsProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to post a comment.",
        variant: "destructive",
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a message before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('comments')
        .insert({
          item_id: itemId,
          user_id: user.id,
          message: message.trim(),
        });
      
      if (error) {
        throw error;
      }
      
      setMessage("");
      toast({
        title: "Comment posted",
        description: "Your comment has been successfully posted.",
      });
      
      onCommentAdded();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "There was a problem posting your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
      
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.profile_picture || ""} />
              <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Comment"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-md bg-muted p-4 text-center">
          <p className="text-muted-foreground">
            Please sign in to post a comment.
          </p>
        </div>
      )}
      
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user?.profile_picture || ""} />
                <AvatarFallback>{getInitials(comment.user?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="font-medium">{comment.user?.name || "Anonymous"}</h4>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1">{comment.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md bg-muted p-6 text-center">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}
