import { type SpotifyData, type SpotifyTrack } from "@shared/schema";
import UserProfile from "./UserProfile";
import TopTracks from "./TopTracks";
import GenreBreakdown from "./GenreBreakdown";
import { useState, useEffect } from "react";

interface NewspaperContentProps {
  data: SpotifyData;
}

type LanguageOption = 'en' | 'tr' | 'ku';

// Translations for UI elements
const translations = {
  en: {
    topTracks: 'TOP 10 TRACKS',
    topMonth: 'Top Listened Month',
    genreBreakdown: 'Genre Breakdown'
  },
  tr: {
    topTracks: 'EN İYİ 10 ŞARKI',
    topMonth: 'En Çok Dinlenen Ay',
    genreBreakdown: 'Tür Dağılımı'
  },
  ku: {
    topTracks: '10 HEB STRANÊN BAŞ',
    topMonth: 'Meha Herî Zêde Guhdarîkirî',
    genreBreakdown: 'Dabeşkirina Cureyên Muzîkê'
  }
};

export default function NewspaperContent({ data }: NewspaperContentProps) {
  // Language state
  const [language, setLanguage] = useState<LanguageOption>('en');
  const [topTrack, setTopTrack] = useState<SpotifyTrack | null>(null);

  // Set top track for display album cover
  useEffect(() => {
    if (data.topTracks && data.topTracks.length > 0) {
      setTopTrack(data.topTracks[0]);
    }
  }, [data.topTracks]);

  // Get current translations
  const t = translations[language];

  return (
    <div className="flex flex-col md:flex-row mt-4">
      {/* Language selector */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {(['en', 'tr', 'ku'] as const).map((lang) => (
          <button 
            key={lang} 
            onClick={() => setLanguage(lang)}
            className={`px-2 py-1 text-xs rounded ${language === lang ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* Left Column - User Profile */}
      <div className="md:w-1/3 border-r border-black pr-4">
        <UserProfile user={data.user} stats={data.stats} mood={data.mood} language={language} />
        
        {/* Add album cover of top track */}
        {topTrack && topTrack.imageUrl && (
          <div className="mt-4 border-t border-black pt-4">
            <h4 className="font-headline text-md font-bold mb-2">Top Track Album Cover:</h4>
            <div className="bg-gradient-to-r from-purple-400 to-blue-500 p-2">
              <img 
                src={topTrack.imageUrl} 
                alt={`${topTrack.name} by ${topTrack.artist}`} 
                className="w-full h-auto border-4 border-white shadow-lg"
              />
              <p className="text-white text-xs mt-1 font-bold text-center">
                {topTrack.name} - {topTrack.artist}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Right Column - Top Songs and Stats */}
      <div className="md:w-2/3 pl-4 mt-4 md:mt-0">
        <h3 className="font-headline text-2xl font-bold mb-3 pb-1 border-b border-black bg-yellow-100 p-2">
          {t.topTracks}
        </h3>
        
        <TopTracks tracks={data.topTracks} />
        
        <div className="border-t border-black pt-4 mt-4">
          <h3 className="font-headline text-xl font-bold mb-2 text-blue-800">{t.topMonth}:</h3>
          <p className="font-body text-lg mb-1">{data.stats.top_month}</p>
          <p className="font-body italic">{data.stats.top_month_reason}</p>
        </div>
        
        <div className="border-t border-black mt-4 pt-4">
          <h3 className="font-headline text-xl font-bold mb-2 bg-green-100 inline-block px-2">{t.genreBreakdown}:</h3>
          <GenreBreakdown genres={data.genres} />
        </div>
      </div>
    </div>
  );
}
