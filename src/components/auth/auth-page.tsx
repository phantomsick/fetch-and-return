
import { useState } from 'react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { ForgotPasswordForm } from './forgot-password-form';
import { useSearchParams } from 'react-router-dom';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const resetMode = searchParams.get('reset') === 'true';
  
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot-password'>(
    resetMode ? 'forgot-password' : 'login'
  );
  
  const toggleForm = () => {
    setCurrentView(currentView === 'login' ? 'register' : 'login');
  };
  
  const showForgotPassword = () => {
    setCurrentView('forgot-password');
  };
  
  const goToLogin = () => {
    setCurrentView('login');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Lost & Found</h1>
        <p className="text-lg text-muted-foreground">
          Connect lost items with their rightful owners
        </p>
      </div>
      
      {currentView === 'login' && (
        <LoginForm 
          onToggleForm={toggleForm} 
          onForgotPassword={showForgotPassword} 
        />
      )}
      
      {currentView === 'register' && (
        <RegisterForm onToggleForm={toggleForm} />
      )}
      
      {currentView === 'forgot-password' && (
        <ForgotPasswordForm onBack={goToLogin} />
      )}
    </div>
  );
}
