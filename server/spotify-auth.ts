import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Constants
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:5000'}/api/callback`;
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played'
].join(' ');

// Generates a random string for state parameter
function generateRandomString(length: number) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Creates the Spotify authorization URL
export function getAuthorizationUrl() {
  const state = generateRandomString(16);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID || '',
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: state
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Exchanges authorization code for access token
export async function exchangeCode(code: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: params
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting Spotify access token: ${errorText}`);
  }

  return await response.json();
}

// Refreshes an expired access token
export async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: params
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error refreshing token: ${errorText}`);
  }

  return await response.json();
}

// Middleware to check if user is authenticated and refresh token if needed
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if token is expired or about to expire (in next 5 minutes)
    const now = new Date();
    const expiryDate = user.tokenExpiry;
    
    // Allow 5 minutes buffer before expiry
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiryDate < fiveMinutesFromNow) {
      // Token is expired or about to expire, refresh it
      const refreshResponse = await refreshAccessToken(user.refreshToken);
      
      const { access_token, expires_in } = refreshResponse;
      
      // Update user with new token
      await storage.updateUserToken(
        userId, 
        access_token, 
        user.refreshToken, // Refresh token doesn't change
        expires_in
      );
      
      // Set updated token in locals for API calls
      res.locals.accessToken = access_token;
    } else {
      // Token is valid, set it in locals for API calls
      res.locals.accessToken = user.accessToken;
    }
    
    // Set user ID in locals
    res.locals.userId = userId;
    res.locals.spotifyId = user.spotifyId;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

// Fetch the user profile from Spotify
export async function fetchSpotifyProfile(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching Spotify profile: ${errorText}`);
  }

  return await response.json();
}
