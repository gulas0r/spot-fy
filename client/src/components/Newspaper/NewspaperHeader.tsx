import { type SpotifyUser } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

interface NewspaperHeaderProps {
  user: SpotifyUser;
}

export default function NewspaperHeader({ user }: NewspaperHeaderProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  // Generate a random issue number (but make it deterministic based on user ID)
  const getIssueNumber = (id: string) => {
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return (sum % 999 + 1).toString().padStart(3, '0');
  };

  return (
    <>
      <div className="border-b-2 border-t-2 border-black py-2">
        <h1 className="font-headline text-5xl md:text-6xl font-black text-center tracking-tight">FUNIFY</h1>
      </div>
      
      <div className="flex justify-between text-xs font-body border-b border-black py-1">
        <div>TODAY'S MUSIC HERO: {user.display_name}</div>
        <div>DATE: {currentDate}</div>
      </div>
      
      <div className="text-right text-xs font-body border-b-2 border-black py-1">
        NO. {getIssueNumber(user.id)}
      </div>
      
      <div className="py-4 border-b border-black">
        <h2 className="font-headline text-4xl md:text-5xl font-bold text-center leading-tight">
          {user.display_name.toUpperCase()}'S<br />
          EARS ARE ON FIRE!
        </h2>
        <p className="text-center font-body text-lg italic">Spotify listener, in review!</p>
      </div>
    </>
  );
}
