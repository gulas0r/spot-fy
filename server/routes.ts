import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from 'express-session';
import MemoryStore from 'memorystore';
import { storage } from "./storage";
import { 
  getAuthorizationUrl, 
  exchangeCode, 
  fetchSpotifyProfile,
  requireAuth 
} from "./spotify-auth";
import { 
  spotifyUserSchema, 
  spotifyDataSchema, 
  spotifyTrackSchema, 
  spotifyGenreSchema, 
  spotifyStatsSchema 
} from "@shared/schema";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware setup for authentication
  app.use(
    session({
      cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === "production"
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'spotify-newspaper-secret'
    })
  );

  // Login route - redirects to Spotify authorization
  app.get("/api/login", (req: Request, res: Response) => {
    const authUrl = getAuthorizationUrl();
    res.json({ loginUrl: authUrl });
  });

  // Callback route - handles Spotify OAuth callback
  app.get("/api/callback", async (req: Request, res: Response) => {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect('/?error=access_denied');
    }
    
    if (!code || typeof code !== 'string') {
      return res.redirect('/?error=invalid_code');
    }
    
    try {
      // Exchange code for tokens
      const tokenResponse = await exchangeCode(code);
      const { access_token, refresh_token, expires_in } = tokenResponse;
      
      // Get user profile from Spotify
      const profileData = await fetchSpotifyProfile(access_token);
      const validatedProfile = spotifyUserSchema.parse(profileData);
      
      // Check if user exists, create if not
      let user = await storage.getUserBySpotifyId(validatedProfile.id);
      
      if (!user) {
        // Create a new user
        user = await storage.createUser({
          username: validatedProfile.display_name,
          spotifyId: validatedProfile.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry: new Date(Date.now() + expires_in * 1000),
          profileData: validatedProfile
        });
      } else {
        // Update existing user token and profile
        user = await storage.updateUserToken(
          user.id, 
          access_token, 
          refresh_token, 
          expires_in
        );
        
        user = await storage.updateUserProfile(user.id, validatedProfile);
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Redirect to home page
      return res.redirect('/');
    } catch (error) {
      console.error('Callback error:', error);
      return res.redirect('/?error=callback_failed');
    }
  });

  // Check session status
  app.get("/api/session", (req: Request, res: Response) => {
    res.json({
      isAuthenticated: !!req.session.userId
    });
  });

  // Logout route
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie("connect.sid");
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get user's Spotify profile
  app.get("/api/user", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(res.locals.userId);
      if (!user || !user.profileData) {
        return res.status(404).json({ message: 'User profile not found' });
      }
      
      res.json(user.profileData);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  });

  // Fetch user's top tracks
  app.get("/api/top-tracks", requireAuth, async (req: Request, res: Response) => {
    try {
      const accessToken = res.locals.accessToken;
      const response = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Transform Spotify response to our schema
      const topTracks = data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        artist: item.artists[0].name,
        album: item.album.name,
        imageUrl: item.album.images[0]?.url,
        popularity: item.popularity
      }));
      
      const validatedTracks = topTracks.map((track: any) => 
        spotifyTrackSchema.parse(track)
      );
      
      res.json(validatedTracks);
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      res.status(500).json({ message: 'Failed to fetch top tracks' });
    }
  });

  // Get user's recently played tracks
  app.get("/api/recently-played", requireAuth, async (req: Request, res: Response) => {
    try {
      const accessToken = res.locals.accessToken;
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=10',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Transform Spotify response
      const recentTracks = data.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists[0].name,
        playedAt: item.played_at
      }));
      
      res.json(recentTracks);
    } catch (error) {
      console.error('Error fetching recently played:', error);
      res.status(500).json({ message: 'Failed to fetch recently played tracks' });
    }
  });

  // Get user's top artists and extract genre information
  app.get("/api/top-artists", requireAuth, async (req: Request, res: Response) => {
    try {
      const accessToken = res.locals.accessToken;
      const response = await fetch(
        'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Transform Spotify response
      const topArtists = data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.images[0]?.url,
        genres: item.genres,
        popularity: item.popularity
      }));
      
      res.json(topArtists);
    } catch (error) {
      console.error('Error fetching top artists:', error);
      res.status(500).json({ message: 'Failed to fetch top artists' });
    }
  });

  // Get all user's Spotify data for the newspaper
  app.get("/api/newspaper-data", requireAuth, async (req: Request, res: Response) => {
    try {
      const accessToken = res.locals.accessToken;
      
      // Fetch user profile
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!userResponse.ok) {
        throw new Error(`Error fetching user profile: ${await userResponse.text()}`);
      }
      
      const userData = await userResponse.json();
      
      // Fetch top tracks
      const tracksResponse = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10',
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      if (!tracksResponse.ok) {
        throw new Error(`Error fetching top tracks: ${await tracksResponse.text()}`);
      }
      
      const tracksData = await tracksResponse.json();
      
      // Fetch top artists (for genres)
      const artistsResponse = await fetch(
        'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10',
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      if (!artistsResponse.ok) {
        throw new Error(`Error fetching top artists: ${await artistsResponse.text()}`);
      }
      
      const artistsData = await artistsResponse.json();
      
      // Process top tracks
      const topTracks = tracksData.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        artist: item.artists[0].name,
        album: item.album.name,
        imageUrl: item.album.images[0]?.url,
        popularity: item.popularity
      }));
      
      // Process top artists
      const topArtists = artistsData.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.images[0]?.url,
        genres: item.genres,
        popularity: item.popularity
      }));
      
      // Extract and aggregate genres
      const genreCounts: Record<string, number> = {};
      let totalGenres = 0;
      
      artistsData.items.forEach((artist: any) => {
        artist.genres.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          totalGenres += 1;
        });
      });
      
      // Calculate genre percentages and sort by popularity
      const genrePercentages = Object.entries(genreCounts)
        .map(([name, count]) => ({
          name,
          percentage: Math.round((count / totalGenres) * 100)
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);  // Get top 5 genres
      
      // Ensure percentages add up to 100%
      let remainingPercentage = 100 - genrePercentages.reduce((sum, genre) => sum + genre.percentage, 0);
      
      // If there's any remaining percentage, add an "Other" category
      if (remainingPercentage > 0 && genrePercentages.length > 0) {
        genrePercentages.push({
          name: "Other",
          percentage: remainingPercentage
        });
      }
      
      const genres = genrePercentages.map(genre => spotifyGenreSchema.parse(genre));
      
      // Generate mood based on genres and artist popularity
      const mood = generateMood(genres, topArtists);
      
      // Generate listening stats
      const stats = generateListeningStats(topTracks, topArtists);
      
      // Combine all data
      const newspaperData = {
        user: userData,
        topTracks,
        topArtists,
        genres,
        stats,
        mood
      };
      
      // Validate against schema
      const validatedData = spotifyDataSchema.parse(newspaperData);
      
      res.json(validatedData);
    } catch (error) {
      console.error('Error creating newspaper data:', error);
      res.status(500).json({ message: 'Failed to create newspaper data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate a mood based on genres and artists
function generateMood(genres: any[], artists: any[]): string {
  // Calculate average popularity of top artists
  const avgPopularity = artists.reduce((sum, artist) => sum + artist.popularity, 0) / artists.length;
  
  // Get the top genre
  const topGenre = genres[0]?.name || 'Unknown';
  
  // Map common genres to moods
  const genreMoodMap: Record<string, string> = {
    'pop': 'Poppy',
    'rock': 'Rock Enthusiast',
    'hip hop': 'Hip',
    'rap': 'Urban',
    'r&b': 'Soulful',
    'indie': 'Indie',
    'electronic': 'Electronic',
    'dance': 'Energetic',
    'classical': 'Sophisticated',
    'jazz': 'Cultured',
    'metal': 'Intense',
    'alternative': 'Alternative',
    'folk': 'Folksy',
    'country': 'Country',
    'blues': 'Bluesy',
    'soul': 'Soulful'
  };
  
  // Try to find a mood based on the top genre
  for (const [genreKey, moodValue] of Object.entries(genreMoodMap)) {
    if (topGenre.toLowerCase().includes(genreKey)) {
      return moodValue;
    }
  }
  
  // Default moods based on popularity
  if (avgPopularity > 80) return 'Trendsetter';
  if (avgPopularity > 60) return 'Mainstream';
  if (avgPopularity > 40) return 'Mixed';
  return 'Eclectic';
}

// Helper function to generate listening stats
function generateListeningStats(tracks: any[], artists: any[]): any {
  // Calculate a realistic total minutes
  // Average song length is about 3.5 minutes
  // Assuming user listens to ~15 songs per day
  const avgDailyMinutes = 15 * 3.5;
  const daysInPeriod = 30;
  const totalMinutes = Math.floor(avgDailyMinutes * daysInPeriod);
  
  // Determine top month (just use current month for simplicity)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = months[new Date().getMonth()];
  
  // Generate fun facts based on the data
  const topArtistName = artists[0]?.name || 'your favorite artist';
  const topTrackName = tracks[0]?.name || 'your top song';
  
  // Generate "reasons" for top month
  const topMonthReasons = [
    `${topArtistName}'s new releases captivated you`,
    `You discovered some amazing new music`,
    `Perfect soundtrack for your activities`,
    `REASON still being investigated. Probably heartbreak.`
  ];
  
  // Generate fun facts
  const funFacts = [
    `You've listened to ${topArtistName} more than 80% of other Spotify users.`,
    `Your late night listening sessions have increased 34% compared to last year.`,
    `You've been in the top 2% of ${topArtistName} listeners this month.`,
    `"${topTrackName}" has been your go-to song when you need a mood boost.`
  ];
  
  // Generate listening habits data
  const listeningHabits = [
    { title: 'Peak listening time', value: '9PM - 11PM' },
    { title: 'Favorite day', value: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)] },
    { title: 'Listening streak', value: `${Math.floor(Math.random() * 50 + 10)} days` }
  ];
  
  // Return the constructed stats object
  return spotifyStatsSchema.parse({
    total_minutes: totalMinutes,
    top_month: currentMonth,
    top_month_reason: topMonthReasons[Math.floor(Math.random() * topMonthReasons.length)],
    fun_fact: funFacts[Math.floor(Math.random() * funFacts.length)],
    listening_habits: listeningHabits
  });
}
