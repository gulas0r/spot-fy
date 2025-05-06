import { apiRequest } from "@/lib/queryClient";
import { SpotifyData, SpotifyTrack, SpotifyUser } from "@shared/schema";

// Check if user is authenticated
export async function checkAuthentication(): Promise<boolean> {
  try {
    const response = await fetch('/api/session');
    const data = await response.json();
    return data.isAuthenticated;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Fetch user profile
export async function fetchUserProfile(): Promise<SpotifyUser> {
  const response = await apiRequest('GET', '/api/user', undefined);
  return await response.json();
}

// Fetch top tracks
export async function fetchTopTracks(): Promise<SpotifyTrack[]> {
  const response = await apiRequest('GET', '/api/top-tracks', undefined);
  return await response.json();
}

// Fetch all newspaper data at once
export async function fetchNewspaperData(): Promise<SpotifyData> {
  const response = await apiRequest('GET', '/api/newspaper-data', undefined);
  return await response.json();
}

// Handle Spotify login
export async function initiateSpotifyLogin(): Promise<string> {
  const response = await apiRequest('GET', '/api/login', undefined);
  const data = await response.json();
  return data.loginUrl;
}

// Logout user
export async function logout(): Promise<void> {
  await apiRequest('POST', '/api/logout', undefined);
}
