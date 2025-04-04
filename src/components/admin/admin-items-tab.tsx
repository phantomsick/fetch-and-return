
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Loader2, Trash2, Edit, CheckCircle, AlertCircle } from "lucide-react";
import { Item } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AdminItemsTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { toast } = useToast();
  
  useEffect(() => {
    fetchItems();
  }, [categoryFilter, statusFilter]);
  
  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Use a stored procedure to get items
      const { data, error } = await supabase.rpc('get_items_with_user_details', {
        p_category: categoryFilter || null,
        p_status: statusFilter || null,
        p_search: searchQuery || null
      });
      
      if (error) throw error;
      
      setItems(data as Item[]);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };
  
  const handleDeleteItem = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setItems(items.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Item has been deleted",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleItemStatus = async (item: Item) => {
    try {
      const newStatus = item.status === 'Open' ? 'Resolved' : 'Open';
      
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', item.id);
      
      if (error) throw error;
      
      setItems(items.map(i => 
        i.id === item.id ? { ...i, status: newStatus } : i
      ));
      
      toast({
        title: "Success",
        description: `Item marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
              <SelectItem value="Found">Found</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Posted by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant={item.category === 'Lost' ? "destructive" : "default"}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.user?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Open' ? "outline" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Item Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <h3 className="font-medium">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Category:</p>
                                  <p className="text-sm">{item.category}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Status:</p>
                                  <p className="text-sm">{item.status}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Location:</p>
                                  <p className="text-sm">{item.location}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Date:</p>
                                  <p className="text-sm">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Contact:</p>
                                  <p className="text-sm">{item.contact_info}</p>
                                </div>
                              </div>
                              
                              {item.image_url && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Image:</p>
                                  <img 
                                    src={item.image_url} 
                                    alt={item.title} 
                                    className="w-full max-h-60 object-contain rounded-md"
                                  />
                                </div>
                              )}
                              
                              <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                  variant={item.status === 'Open' ? "default" : "outline"}
                                  onClick={() => handleToggleItemStatus(item)}
                                >
                                  {item.status === 'Open' ? (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved</>
                                  ) : (
                                    <><AlertCircle className="mr-2 h-4 w-4" /> Mark as Open</>
                                  )}
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant={item.status === 'Open' ? "default" : "outline"}
                          size="icon"
                          onClick={() => handleToggleItemStatus(item)}
                        >
                          {item.status === 'Open' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
