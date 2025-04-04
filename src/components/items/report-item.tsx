
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReportItemProps {
  itemId: string;
}

export function ReportItem({ itemId }: ReportItemProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleSubmitReport = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report an item",
        variant: "destructive",
      });
      return;
    }
    
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reporting this item",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('reports')
        .insert({
          item_id: itemId,
          reporter_id: user.id,
          reason: reason.trim(),
        });
      
      if (error) throw error;
      
      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We will review it shortly.",
      });
      
      setReason("");
      setOpen(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4 mr-2" />
          Report Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this item</DialogTitle>
          <DialogDescription>
            Report this item if you believe it violates our guidelines or terms of service. Our administrative team will review your report.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            placeholder="Explain why you're reporting this item..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setReason("");
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReport}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
