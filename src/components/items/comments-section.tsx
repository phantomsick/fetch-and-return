
import { useState } from "react";
import { useAuth } from "@/context/auth/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment, supabase } from "@/lib/supabase";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

interface CommentsSectionProps {
  itemId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export function CommentsSection({ itemId, comments, onCommentAdded }: CommentsSectionProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add a comment.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            item_id: itemId,
            user_id: user.id,
            message: newComment.trim(),
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Use current profile data instead of fetching it again
        const newCommentWithProfile = {
          ...data[0],
          user: profile || { 
            id: user.id,
            name: profile?.name || "Anonymous",
            email: null,
            profile_picture: null 
          }
        } as Comment;
        
        setNewComment('');
        onCommentAdded(newCommentWithProfile);
        
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add your comment. Please try again later.",
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
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Comments</h3>
      
      <div className="space-y-2">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3 py-2 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.profile_picture || ""} alt={comment.user?.name || "User"} />
                <AvatarFallback>{getInitials(comment.user?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{comment.user?.name || "Anonymous"}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </div>
                <p className="text-sm">{comment.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">No comments yet. Be the first to comment!</div>
        )}
      </div>
      
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <Button onClick={handleSubmitComment} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Comment"
          )}
        </Button>
      </div>
    </div>
  );
}
