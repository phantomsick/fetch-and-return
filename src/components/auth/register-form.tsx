
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserIcon, MailIcon, LockIcon, KeyIcon } from 'lucide-react';
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from '@/components/ui/use-toast';

export function RegisterForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [tempSession, setTempSession] = useState<any>(null);
  const { signUp, loading, verifyOTP } = useAuth();
  const { toast } = useToast();
  
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await signUp(email, password, name);
      if (session) {
        setTempSession(session);
        setShowOTP(true);
        toast({
          title: "Verification code sent",
          description: "We've sent a verification code to your email address",
        });
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await verifyOTP(email, otpValue, tempSession);
      toast({
        title: "Success!",
        description: "Your account has been verified successfully",
      });
      // Let the user login now
      onToggleForm();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification failed",
        description: "The code you entered is incorrect or has expired",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
        <CardDescription>
          {showOTP 
            ? "Enter the verification code we sent to your email" 
            : "Sign up to start posting lost and found items"}
        </CardDescription>
      </CardHeader>
      
      {showOTP ? (
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit code to <span className="font-medium">{email}</span>
              </p>
            </div>
            
            <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            <div className="flex flex-col w-full gap-2 mt-4">
              <Button 
                onClick={handleVerifyOTP} 
                disabled={otpValue.length !== 6 || loading}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={onToggleForm}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRequestOTP}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <UserIcon className="h-5 w-5" />
                </div>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <MailIcon className="h-5 w-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <LockIcon className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onToggleForm}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
