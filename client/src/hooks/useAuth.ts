import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface User {
  userId: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthError {
  error: string;
  code: string;
  details?: any;
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });
    
    if (response.status === 401) {
      return null; // Not authenticated
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

async function loginUser(loginData: LoginData): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(loginData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data.user;
}

async function registerUser(registerData: RegisterData): Promise<User> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(registerData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data.user;
}

async function logoutUser(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: user, isLoading, error: queryError } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "user"], user);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "user"], user);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    // User state
    user,
    isLoading,
    isAuthenticated: !!user,
    error: error || queryError?.message || null,

    // Actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
