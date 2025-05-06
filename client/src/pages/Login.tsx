import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLoginClick = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('GET', '/api/login', undefined);
      const data = await res.json();
      
      if (data.loginUrl) {
        window.location.href = data.loginUrl;
      } else {
        throw new Error('No login URL returned from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Failed to initialize Spotify login."
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <h1 className="font-headline text-4xl font-bold mb-2">funify</h1>
            <p className="font-body text-lg mb-6">Create your personal Spotify newspaper</p>
            
            <div className="mb-8 w-full">
              <div className="bg-gray-200 w-full h-48 rounded mb-4 flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 16.5c2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5-4.5 2-4.5 4.5 2 4.5 4.5 4.5zm0 1.5c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-9c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zm0 3c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zm7.5-7.5H18V2h-1.5v2.3h-9V2H6v2.3H4.5C3.1 4.3 2 5.4 2 6.8v12C2 20.1 3.1 21.3 4.5 21.3h15c1.4 0 2.5-1.1 2.5-2.5v-12c0-1.4-1.1-2.5-2.5-2.5zm1 14.5c0 .6-.4 1-1 1h-15c-.6 0-1-.4-1-1v-9h17v9zm0-10.5H3.5v-1.5c0-.6.4-1 1-1h15c.6 0 1 .4 1 1v1.5z" />
                </svg>
              </div>
              <p className="font-body text-gray-600 italic text-center">
                Connect your Spotify account to generate your personalized newspaper based on your listening habits.
              </p>
            </div>
            
            <Button 
              onClick={handleLoginClick}
              disabled={isLoading}
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.5-1 .5s-.7-.1-1-.4c-2.8-1.7-6.4-2.1-10.5-1.1-.4.1-.9-.1-1.1-.5-.1-.4.1-.9.5-1.1 4.6-1 8.6-.6 11.8 1.3.4.2.5.8.3 1.3zm1.5-3.3c-.3.4-.8.6-1.2.6-.3 0-.6-.1-.9-.3-3.2-2-8.1-2.5-11.9-1.4-.5.1-1.1-.1-1.3-.6-.1-.5.1-1.1.6-1.3 4.4-1.3 9.8-.8 13.6 1.5.5.2.7.9.4 1.4l-.3.1zm.1-3.4c-3.8-2.3-10.2-2.5-13.9-1.4-.6.1-1.2-.2-1.3-.8-.1-.6.2-1.2.8-1.3 4.2-1.3 11.2-1 15.5 1.6.6.3.7 1.1.4 1.6-.3.6-1 .8-1.5.5v-.2z"/>
                  </svg>
                  Connect with Spotify
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
