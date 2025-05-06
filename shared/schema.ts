import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  spotifyId: text("spotify_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: timestamp("token_expiry").notNull(),
  profileData: jsonb("profile_data")
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Spotify Data Schema
export const spotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  imageUrl: z.string().optional(),
  popularity: z.number().optional()
});

export const spotifyArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().optional(),
  genres: z.array(z.string()).optional(),
  popularity: z.number().optional()
});

export const spotifyGenreSchema = z.object({
  name: z.string(),
  percentage: z.number()
});

export const spotifyUserSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  images: z.array(z.object({
    url: z.string()
  })).optional(),
  country: z.string().optional(),
  email: z.string().optional(),
  product: z.string().optional()
});

export const spotifyStatsSchema = z.object({
  total_minutes: z.number(),
  top_month: z.string(),
  top_month_reason: z.string(),
  fun_fact: z.string(),
  listening_habits: z.array(
    z.object({
      title: z.string(),
      value: z.string()
    })
  )
});

export const spotifyDataSchema = z.object({
  user: spotifyUserSchema,
  topTracks: z.array(spotifyTrackSchema),
  topArtists: z.array(spotifyArtistSchema),
  genres: z.array(spotifyGenreSchema),
  stats: spotifyStatsSchema,
  mood: z.string()
});

export type SpotifyTrack = z.infer<typeof spotifyTrackSchema>;
export type SpotifyArtist = z.infer<typeof spotifyArtistSchema>;
export type SpotifyGenre = z.infer<typeof spotifyGenreSchema>;
export type SpotifyUser = z.infer<typeof spotifyUserSchema>;
export type SpotifyStats = z.infer<typeof spotifyStatsSchema>;
export type SpotifyData = z.infer<typeof spotifyDataSchema>;
