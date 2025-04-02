
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth/auth-context";
import { supabase, initializeStorage } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Mail, Camera, LogOut, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Password schema without current password requirement
const passwordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [profilePicture, setProfilePicture] = useState<string | null>(profile?.profile_picture || null);
  
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setProfilePicture(profile.profile_picture);
    }
    
    // Initialize storage buckets
    initializeStorage();
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploading(true);
    
    try {
      // Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      // Remove old avatar if exists
      if (profile?.profile_picture) {
        const oldFileName = profile.profile_picture.split('/').pop();
        if (oldFileName) {
          try {
            await supabase
              .storage
              .from('avatars')
              .remove([oldFileName]);
          } catch (error) {
            console.error("Failed to remove old avatar:", error);
            // Continue with upload even if removal fails
          }
        }
      }
      
      // Upload new file
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      const publicUrl = urlData.publicUrl;
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setProfilePicture(publicUrl);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully."
      });
      
    } catch (error: any) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Password reset functionality
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      form.reset();
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
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
  
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and how others see you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profilePicture || ""} alt={name} />
                    <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="font-medium">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">
                      This will be displayed on your profile and in comments.
                    </p>
                    
                    <div className="flex items-center">
                      <Input
                        type="file"
                        id="avatar"
                        className="hidden"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                      />
                      <Label htmlFor="avatar" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Camera className="mr-2 h-4 w-4" />
                                Change Avatar
                              </>
                            )}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="inline-block mr-2 h-4 w-4" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline-block mr-2 h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your email address cannot be changed.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/my-items")}
                >
                  View My Items
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter new password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm new password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sign Out</CardTitle>
                  <CardDescription>
                    Sign out from your account on this device.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
