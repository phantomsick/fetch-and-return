
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth/auth-context";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminItemsTab } from "@/components/admin/admin-items-tab";
import { AdminUsersTab } from "@/components/admin/admin-users-tab";
import { AdminReportsTab } from "@/components/admin/admin-reports-tab";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState("items");

  useEffect(() => {
    // Redirect non-admin users away from this page
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <ShieldAlert className="h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-4 text-center">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => navigate("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <main className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          
          <Tabs 
            defaultValue="items" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="space-y-4">
              <AdminItemsTab />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <AdminUsersTab />
            </TabsContent>
            
            <TabsContent value="reports" className="space-y-4">
              <AdminReportsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
