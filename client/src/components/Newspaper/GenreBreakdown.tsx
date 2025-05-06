import { type SpotifyGenre } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface GenreBreakdownProps {
  genres: SpotifyGenre[];
}

export default function GenreBreakdown({ genres }: GenreBreakdownProps) {
  // Format genre name to capitalize first letter of each word
  const formatGenreName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {genres.map((genre) => (
        <div key={genre.name} className="flex items-center">
          <div className="w-24 font-body font-bold text-sm">{formatGenreName(genre.name)}</div>
          <div className="flex-1 bg-gray-200 h-4 rounded-full overflow-hidden">
            <div 
              className="bg-black h-full rounded-full" 
              style={{ width: `${genre.percentage}%` }}
            ></div>
          </div>
          <div className="ml-2 font-mono text-sm">{genre.percentage}%</div>
        </div>
      ))}
    </div>
  );
}
