import { 
  users, 
  type User, 
  type InsertUser, 
  type SpotifyUser, 
  type SpotifyData 
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserToken(id: number, accessToken: string, refreshToken: string, expiresIn: number): Promise<User>;
  updateUserProfile(id: number, profileData: SpotifyUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.spotifyId === spotifyId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUserToken(
    id: number, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number
  ): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    
    const updatedUser: User = {
      ...user,
      accessToken,
      refreshToken,
      tokenExpiry: expiryDate
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(id: number, profileData: SpotifyUser): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      profileData
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
