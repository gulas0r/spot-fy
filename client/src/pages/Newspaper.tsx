import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import * as htmlToImage from "html-to-image";
import { SpotifyData } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loading from "@/pages/Loading";
import NewspaperHeader from "@/components/Newspaper/NewspaperHeader";
import NewspaperContent from "@/components/Newspaper/NewspaperContent";

export default function Newspaper() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const newspaperRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch user's Spotify data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/newspaper-data'],
    refetchOnWindowFocus: false
  }) as { data: SpotifyData | undefined, isLoading: boolean, error: unknown };

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout', undefined);
      // Redirect to login page
      setLocation('/');
      // Force page reload to clear any cached data
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to log out. Please try again."
      });
    }
  };

  // Handle PNG download
  const handleDownload = async () => {
    if (!newspaperRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const dataUrl = await htmlToImage.toPng(newspaperRef.current, {
        quality: 0.95,
        backgroundColor: '#F5F5F5',
        pixelRatio: 2
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `funify-${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Download Complete",
        description: "Your newspaper has been downloaded successfully!"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to generate image. Please try again."
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Data fetch error:', error);
      toast({
        variant: "destructive",
        title: "Failed to Load Data",
        description: "Could not load your Spotify data. Please try again."
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="font-headline text-3xl font-bold">Your funify Newspaper</h1>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded flex items-center"
          >
            {isDownloading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download as PNG
              </>
            )}
          </Button>
          <Button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Log Out
          </Button>
        </div>
      </div>
      
      <Separator className="mb-6" />

      {data ? (
        <div 
          ref={newspaperRef} 
          id="newspaper-content" 
          className="newspaper-container bg-paper border border-gray-300 shadow-lg max-w-4xl mx-auto p-8 overflow-hidden"
        >
          <NewspaperHeader user={data.user} />
          <NewspaperContent data={data} />
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-100 rounded-lg max-w-4xl mx-auto">
          <p className="font-body text-lg">No data available. Please try reloading the page.</p>
        </div>
      )}
    </div>
  );
}
