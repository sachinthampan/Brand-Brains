
export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  POSTED = 'POSTED',
  REJECTED = 'REJECTED'
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  TEXT_ONLY = 'TEXT_ONLY'
}

export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  X = 'X',
  LINKEDIN = 'LINKEDIN',
  TIKTOK = 'TIKTOK'
}

export interface XCredentials {
  consumerKey: string;
  consumerSecret: string;
  bearerToken: string;
}

export interface SocialConnection {
  platform: SocialPlatform;
  handle: string;
  isConnected: boolean;
  isVerified?: boolean;
  username?: string;
  credentials?: XCredentials;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface PostContent {
  id: string;
  niche: string;
  topic: string;
  caption: string;
  hashtags: string[];
  mediaType: MediaType;
  mediaUrl?: string;
  status: PostStatus;
  scheduledTime?: string;
  createdAt: string;
}

export interface UserNiche {
  id: string;
  name: string;
  targetAudience: string;
  tone: string;
  frequency: 'daily' | 'weekly' | 'custom';
  connections: SocialConnection[];
}
