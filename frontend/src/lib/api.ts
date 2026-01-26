/// <reference types="vite/client" />

/**
 * Echon API Client
 * Handles all backend API requests with authentication
 * 
 * PATH: echon/frontend/src/lib/api.ts
 */

import axios from 'axios';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('echon_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('echon_token');
      localStorage.removeItem('echon_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- TYPE DEFINITIONS ---

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_year?: number;
  birth_location?: string;
  profile_photo_url?: string;
  simplified_mode: boolean;
  language: string;
  created_at: string;
  last_active: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface FamilySpace {
  id: string;
  name: string;
  secondary_name?: string;
  slug: string;
  origin_location?: string;
  origin_cities?: string;
  emblem_url?: string;
  color_primary: string;
  color_secondary: string;
  created_at: string;
}

export interface Post {
  id: string;
  space_id: string;
  user_id: string;
  content?: string;
  media_urls?: string[];
  media_type?: string;
  event_date?: string;
  location?: string;
  privacy_level: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
  comments?: Comment[];
  reactions?: Reaction[];
  tags?: string[];
  comment_count: number;
  reaction_count: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
}

export interface MemberProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_year?: number;
  birth_location?: string;
  profile_photo_url?: string;
  role: string;
  generation?: string;
  lineage?: string;
  relationship_to_founder?: string;
  joined_at: string;
  post_count: number;
  comment_count: number;
}

export interface MemberListResponse {
  members: MemberProfile[];
  total: number;
  founders: number;
  elders: number;
  regular_members: number;
}

export interface Story {
  id: string;
  space_id: string;
  author_id: string;
  title: string;
  description?: string;
  audio_url: string;
  duration?: number;
  story_date?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
  tags?: string[];
  play_count: number;
}

export interface StoryListResponse {
  stories: Story[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface Story {
  id: string;
  space_id: string;
  author_id: string;
  title: string;
  description?: string;
  audio_url: string;
  duration?: number;
  story_date?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
  tags?: string[];
  play_count: number;
}

export interface StoryListResponse {
  stories: Story[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface ActivityItem {
  id: string;
  type: string; // "memory", "story", "comment", "reaction", "member_joined"
  space_id: string;
  user_id: string;
  content?: string;
  related_id?: string;
  created_at: string;
  user_name: string;
  user_photo?: string;
  preview_url?: string;
  preview_text?: string;
}

export interface ActivityFeedResponse {
  activities: ActivityItem[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface SpaceStats {
  total_members: number;
  total_memories: number;
  total_stories: number;
  total_comments: number;
  recent_activity_count: number;
}

// --- AUTH ENDPOINTS ---

export const authApi = {
  register: async (data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    birth_year?: number;
    birth_location?: string;
  }): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: {
    email_or_phone: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// --- FAMILY SPACE ENDPOINTS ---

export const spaceApi = {
  createSpace: async (data: {
    name: string;
    secondary_name?: string;
    origin_location?: string;
    origin_cities?: string;
  }): Promise<FamilySpace> => {
    const response = await api.post('/api/spaces', data);
    return response.data;
  },

  getMySpaces: async (): Promise<FamilySpace[]> => {
    const response = await api.get('/api/spaces/my-spaces');
    return response.data;
  },

  getSpace: async (spaceId: string): Promise<FamilySpace> => {
    const response = await api.get(`/api/spaces/${spaceId}`);
    return response.data;
  },
};

// --- POSTS/MEMORIES ENDPOINTS ---

export const postsApi = {
  uploadMedia: async (file: File, mediaType: 'photo' | 'video' | 'audio'): Promise<{
    file_path: string;
    file_url: string;
    media_type: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    
    const response = await api.post('/api/posts/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createPost: async (data: {
    space_id: string;
    content?: string;
    media_urls?: string[];
    media_type?: string;
    event_date?: string;
    location?: string;
    privacy_level?: string;
    tags?: string[];
  }): Promise<Post> => {
    const response = await api.post('/api/posts', data);
    return response.data;
  },

  getSpacePosts: async (spaceId: string, page: number = 1, perPage: number = 20): Promise<{
    posts: Post[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  }> => {
    const response = await api.get(`/api/posts/space/${spaceId}`, {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    const response = await api.post('/api/posts/comments', {
      post_id: postId,
      content,
    });
    return response.data;
  },

  addReaction: async (postId: string, reactionType: string): Promise<Reaction> => {
    const response = await api.post('/api/posts/reactions', {
      post_id: postId,
      reaction_type: reactionType,
    });
    return response.data;
  },
};

// --- FAMILY/MEMBERS ENDPOINTS ---

export const familyApi = {
  getSpaceMembers: async (spaceId: string): Promise<MemberListResponse> => {
    const response = await api.get(`/api/family/space/${spaceId}`);
    return response.data;
  },

  getMemberProfile: async (memberId: string, spaceId: string): Promise<MemberProfile> => {
    const response = await api.get(`/api/family/${memberId}`, {
      params: { space_id: spaceId },
    });
    return response.data;
  },

  updateMemberProfile: async (
    memberId: string,
    spaceId: string,
    updates: {
      name?: string;
      birth_year?: number;
      birth_location?: string;
      generation?: string;
      lineage?: string;
      relationship_to_founder?: string;
    }
  ): Promise<MemberProfile> => {
    const response = await api.patch(`/api/family/${memberId}`, updates, {
      params: { space_id: spaceId },
    });
    return response.data;
  },
};

// --- STORIES/VOICE ENDPOINTS ---

export const storiesApi = {
  uploadAudio: async (file: File): Promise<{
    file_path: string;
    file_url: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/stories/upload-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createStory: async (data: {
    space_id: string;
    title: string;
    description?: string;
    audio_url: string;
    duration?: number;
    story_date?: string;
    location?: string;
    tags?: string[];
  }): Promise<Story> => {
    const response = await api.post('/api/stories', data);
    return response.data;
  },

  getSpaceStories: async (spaceId: string, page: number = 1, perPage: number = 20): Promise<StoryListResponse> => {
    const response = await api.get(`/api/stories/space/${spaceId}`, {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  deleteStory: async (storyId: string, spaceId: string): Promise<void> => {
    await api.delete(`/api/stories/${storyId}`, {
      params: { space_id: spaceId },
    });
  },
};

// --- ACTIVITY/NOW ENDPOINTS ---

export const activityApi = {
  getActivityFeed: async (spaceId: string, page: number = 1, perPage: number = 50): Promise<ActivityFeedResponse> => {
    const response = await api.get(`/api/activity/space/${spaceId}`, {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  createQuickUpdate: async (spaceId: string, content: string): Promise<{
    id: string;
    content: string;
    created_at: string;
  }> => {
    const response = await api.post('/api/activity/quick-update', {
      space_id: spaceId,
      content,
    });
    return response.data;
  },

  getSpaceStats: async (spaceId: string): Promise<SpaceStats> => {
    const response = await api.get(`/api/activity/stats/${spaceId}`);
    return response.data;
  },
};