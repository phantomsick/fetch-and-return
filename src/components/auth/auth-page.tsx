
import { useState } from 'react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Lost & Found</h1>
        <p className="text-lg text-muted-foreground">
          Connect lost items with their rightful owners
        </p>
      </div>
      
      {isLogin ? (
        <LoginForm onToggleForm={toggleForm} />
      ) : (
        <RegisterForm onToggleForm={toggleForm} />
      )}
    </div>
  );
}
