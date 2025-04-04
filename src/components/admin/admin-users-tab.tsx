
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Loader2, Ban, Check, User } from "lucide-react";
import { Profile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function AdminUsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*');
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setUsers(data as Profile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };
  
  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ banned: !currentBanStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, banned: !currentBanStatus } : user
      ));
      
      toast({
        title: "Success",
        description: currentBanStatus ? "User has been unbanned" : "User has been banned",
      });
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast({
        title: "Error",
        description: "Failed to update user ban status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    try {
      setLoading(true);
      
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit">Search</Button>
      </form>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || 'Unnamed User'}</TableCell>
                    <TableCell>{user.email || 'No email'}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? "secondary" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.banned ? "destructive" : "success"}>
                        {user.banned ? 'Banned' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <User className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <h3 className="font-medium">{user.name || 'Unnamed User'}</h3>
                                <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Role:</p>
                                  <p className="text-sm">{user.role}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Status:</p>
                                  <p className="text-sm">{user.banned ? 'Banned' : 'Active'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">User ID:</p>
                                  <p className="text-sm overflow-hidden text-ellipsis">{user.id}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                  variant={user.role === 'admin' ? "outline" : "default"}
                                  onClick={() => handleToggleAdmin(user.id, user.role)}
                                >
                                  {user.role === 'admin' ? 'Remove Admin Role' : 'Make Admin'}
                                </Button>
                                <Button 
                                  variant={user.banned ? "outline" : "destructive"}
                                  onClick={() => handleToggleBan(user.id, user.banned)}
                                >
                                  {user.banned ? 'Unban User' : 'Ban User'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant={user.banned ? "outline" : "destructive"} 
                              size="icon"
                            >
                              {user.banned ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {user.banned ? 'Unban User' : 'Ban User'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.banned 
                                  ? `Are you sure you want to unban ${user.name || 'this user'}?` 
                                  : `Are you sure you want to ban ${user.name || 'this user'}? They will no longer be able to log in.`
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleToggleBan(user.id, user.banned)}
                              >
                                {user.banned ? 'Unban' : 'Ban'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button 
                          variant={user.role === 'admin' ? "secondary" : "outline"}
                          size="icon"
                          onClick={() => handleToggleAdmin(user.id, user.role)}
                        >
                          {user.role === 'admin' ? 'A' : 'U'}
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
