
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle, Trash2 } from "lucide-react";
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
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Item } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export function AdminItemsTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Query items with user profile information
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email,
            profile_picture,
            role,
            banned
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const formattedItems: Item[] = data.map(item => ({
        ...item,
        user: item.profiles,
        category: item.category as "Lost" | "Found"
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error fetching items",
        description: "Could not load admin items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);

      if (error) {
        throw error;
      }

      // Remove the item from state
      setItems(items.filter((item) => item.id !== id));

      toast({
        title: "Item deleted",
        description: "The item has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error deleting item",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResolveItem = async (item: Item) => {
    try {
      // Toggle the status
      const newStatus = item.status === "Open" ? "Resolved" : "Open";

      const { error } = await supabase
        .from("items")
        .update({ status: newStatus })
        .eq("id", item.id);

      if (error) {
        throw error;
      }

      // Update the item in state
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, status: newStatus as "Open" | "Resolved" } : i
        )
      );

      toast({
        title: `Item ${newStatus === "Open" ? "reopened" : "resolved"}`,
        description: `The item has been marked as ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Error updating item status:", error);
      toast({
        title: "Error updating item",
        description: "Failed to update the item status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Items Management</h3>
        <Button variant="outline" onClick={fetchItems} disabled={loading}>
          Refresh List
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading items...</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.category === "Lost" ? "outline" : "default"}
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.user?.name || "Anonymous"}
                      {item.user?.banned && (
                        <span className="ml-2 text-xs text-destructive">
                          (Banned)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === "Open" ? "default" : "outline"}
                        className={
                          item.status === "Open"
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveItem(item)}
                        className={
                          item.status === "Open" ? "text-amber-500" : "text-green-500"
                        }
                      >
                        {item.status === "Open" ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Resolved
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Mark Open
                          </>
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this item? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
