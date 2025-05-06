import { type SpotifyTrack } from "@shared/schema";

interface TopTracksProps {
  tracks: SpotifyTrack[];
}

export default function TopTracks({ tracks }: TopTracksProps) {
  // Ensure we have 10 tracks to display
  const displayTracks = [...tracks];
  while (displayTracks.length < 10) {
    displayTracks.push({
      id: `placeholder-${displayTracks.length}`,
      name: "---",
      artist: "---"
    });
  }

  // Split tracks into columns
  const leftColumnTracks = displayTracks.slice(0, 5);
  const rightColumnTracks = displayTracks.slice(5, 10);

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6">
      {/* Left column */}
      {leftColumnTracks.map((track, index) => (
        <div key={track.id} className="font-body">
          <span className="font-bold">{index + 1}.</span> {track.artist} - {track.name}
        </div>
      ))}
      
      {/* Right column */}
      {rightColumnTracks.map((track, index) => (
        <div key={track.id} className="font-body">
          <span className="font-bold">{index + 6}.</span> {track.artist} - {track.name}
        </div>
      ))}
    </div>
  );
}
