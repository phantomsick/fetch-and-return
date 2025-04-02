
import { useState } from "react";
import { useAuth } from "@/context/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Password schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ResetPasswordForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: data.currentPassword,
      });
      
      if (signInError) {
        throw new Error("Current password is incorrect");
      }
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      setIsSuccess(true);
      form.reset();
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Change Password</h2>
        <p className="text-muted-foreground">
          Update your password to keep your account secure.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your current password" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your new password" 
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
                    placeholder="Confirm your new password" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {isSuccess && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <Check className="mr-2 h-4 w-4" />
              <span>Password updated successfully</span>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
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
    </div>
  );
}
