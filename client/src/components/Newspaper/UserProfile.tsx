import { type SpotifyUser, type SpotifyStats } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileProps {
  user: SpotifyUser;
  stats: SpotifyStats;
  mood: string;
  language?: 'en' | 'tr' | 'ku';
}

export default function UserProfile({ user, stats, mood, language = 'en' }: UserProfileProps) {
  // Format minutes to display nicely
  const formatMinutes = (minutes: number) => {
    return new Intl.NumberFormat().format(minutes);
  };

  // Get user's profile image URL
  const profileImageUrl = user.images && user.images.length > 0 
    ? user.images[0].url 
    : undefined;

  // Create customized country name based on user's name
  const getCustomCountry = (userName: string) => {
    // Get first 3-5 characters of username (use 3 if name is short, otherwise use 5)
    const prefix = userName.length > 5 ? userName.substring(0, 5) : userName.substring(0, 3);
    return `${prefix}fy`;
  };

  // Translations for UI elements in UserProfile
  const translations = {
    en: {
      identity: "HERO'S IDENTITY",
      username: "USER NAME",
      country: "COUNTRY",
      mood: "MOOD",
      headline: "'Headphones Sue!'",
      subHeadline: "Union consulted: \"Volume limit, pls!\"",
      listeningHabits: "Listening Habits",
      totalMinutes: "Total minutes",
      footer: "This newspaper was crafted by the funify team with love, heartache, and data."
    },
    tr: {
      identity: "KAHRAMANIN KİMLİĞİ",
      username: "KULLANICI ADI",
      country: "ÜLKE",
      mood: "RUH HALİ",
      headline: "'Kulaklıklar Dava Açtı!'",
      subHeadline: "Sendika danışıldı: \"Ses sınırı, lütfen!\"",
      listeningHabits: "Dinleme Alışkanlıkları",
      totalMinutes: "Toplam dakika",
      footer: "Bu gazete funify ekibi tarafından sevgi, kalp ağrısı ve verilerle hazırlandı."
    },
    ku: {
      identity: "NASNAMEYA LEHENG",
      username: "NAVÊ BIKARHÊNER",
      country: "WELAT",
      mood: "REWŞA DERÛNÎ",
      headline: "'Berguhkan Doz Vekir!'",
      subHeadline: "Bi sendîkayê re şêwirî: \"Sînorê dengî, ji kerema xwe!\"",
      listeningHabits: "Adetên Guhdarkirinê",
      totalMinutes: "Deqîqeyên tevahî",
      footer: "Ev rojname ji aliyê GULASOR ve bi evîn, jana dil û daneyan hat amadekirin."
    }
  };

  // Get current translations based on language prop
  const t = translations[language];

  return (
    <>
      <h3 className="font-headline text-xl font-bold mb-2 border-b border-black pb-1 bg-indigo-100 px-2">
        {t.identity}:
      </h3>
      
      <div className="mb-4">
        <p className="font-body"><strong>{t.username}:</strong> {user.display_name}</p>
        <p className="font-body"><strong>{t.country}:</strong> {getCustomCountry(user.display_name)}</p>
        <p className="font-body"><strong>{t.mood}:</strong> {mood}</p>
      </div>
      
      <div className="flex justify-center mb-4">
        <Avatar className="w-32 h-32 rounded-full border-4 border-indigo-200 shadow-lg">
          <AvatarImage src={profileImageUrl} alt={user.display_name} />
          <AvatarFallback className="bg-gray-200 text-gray-800 text-2xl">
            {user.display_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="border-t border-black pt-2 mb-4">
        <h4 className="font-headline text-xl font-bold text-purple-700">{t.headline}</h4>
        <p className="font-body text-sm italic mb-2">{t.subHeadline}</p>
        
        <div className="bg-yellow-50 p-2 text-sm font-body italic border-l-4 border-yellow-400">
          <p>{stats.fun_fact}</p>
        </div>
      </div>
      
      <div className="border-t border-black pt-2">
        <h4 className="font-headline text-xl font-bold text-green-700">{t.listeningHabits}</h4>
        <div className="mt-2 space-y-1 bg-gray-50 p-3 rounded">
          {stats.listening_habits.map((habit, index) => (
            <div key={index} className="text-sm font-body">
              <strong>{habit.title}:</strong> <span>{habit.value}</span>
            </div>
          ))}
          <div className="text-sm font-body font-bold border-t border-gray-300 pt-1 mt-1">
            <strong>{t.totalMinutes}:</strong> <span>{formatMinutes(stats.total_minutes)}</span>
          </div>
        </div>
      </div>
      
      {/* Newspaper Footer */}
      <div className="border-t-2 border-black mt-6 pt-2">
        <p className="text-center font-body text-xs italic">
          {t.footer}
        </p>
      </div>
    </>
  );
}
