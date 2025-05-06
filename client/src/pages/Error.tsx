import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Error() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>("An unknown error occurred");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    if (message) {
      setErrorMessage(message);
    }
  }, []);

  const handleRetry = () => {
    setLocation('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md text-center p-8 bg-white rounded-lg shadow-lg">
        <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 className="font-headline text-2xl mb-2">Extra! Extra! Error Occurred!</h2>
        <p className="font-body text-gray-600 mb-6">{errorMessage}</p>
        <Button onClick={handleRetry} className="bg-black hover:bg-gray-800 text-white font-bold">
          Try Again
        </Button>
      </div>
    </div>
  );
}
