import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Pages
import Login from "@/pages/Login";
import Newspaper from "@/pages/Newspaper";
import Loading from "@/pages/Loading";
import Error from "@/pages/Error";
import NotFound from "@/pages/not-found";

// Styles
import "@/components/ui/newspaper.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check authentication status on load
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
        
        // If user is not authenticated and not on login page, redirect to login
        if (!data.isAuthenticated && location !== '/') {
          setLocation('/');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to check authentication status."
        });
        setIsAuthenticated(false);
      }
    }
    
    checkSession();
  }, [location, setLocation, toast]);

  // Parse URL for errors
  useEffect(() => {
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    
    if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "You declined permission to access your Spotify data.",
        invalid_code: "Invalid authorization code from Spotify.",
        callback_failed: "Failed to authenticate with Spotify."
      };
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessages[error] || "An unknown error occurred."
      });
      
      // Clean the URL
      window.history.replaceState({}, document.title, '/');
    }
  }, [toast]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Loading />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={isAuthenticated ? Newspaper : Login} />
          <Route path="/error" component={Error} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
