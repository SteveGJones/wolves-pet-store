import { useState } from "react";
import { Redirect } from "wouter";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const { isAuthenticated } = useAuth();

  const handleSuccess = () => {
    // No need to manually redirect - the useAuth hook will update isAuthenticated
    // and this component will re-render, causing the redirect below
  };

  const handleSwitchToRegister = () => {
    setMode("register");
  };

  const handleSwitchToLogin = () => {
    setMode("login");
  };

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {mode === "login" ? "Welcome back" : "Welcome to Wolves Pet Store"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "login" 
              ? "Find your perfect companion" 
              : "Join our community and help pets find their forever homes"
            }
          </p>
        </div>

        {mode === "login" ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={handleSwitchToRegister}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </div>
    </div>
  );
}