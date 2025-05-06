export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md text-center p-8">
        <h2 className="font-headline text-3xl mb-4">Stop the presses!</h2>
        <p className="font-body text-lg mb-10">We're gathering your musical news...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
        </div>
      </div>
    </div>
  );
}
