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

// Helper to get full media URL
export const getMediaUrl = (path: string): string => {
  if (!path) return '';
  // If path already has http, return as-is
  if (path.startsWith('http')) return path;
  // Otherwise prepend API base URL
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

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
  current_user_role?: string;
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
  type: string; // "memory", "story", "comment", "reaction", "chat", "member_joined"
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

  uploadProfilePhoto: async (formData: FormData): Promise<{
    profile_photo_url: string;
    message: string;
  }> => {
    const response = await api.post('/api/auth/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProfile: async (data: {
    birth_year?: number;
    birth_location?: string;
  }): Promise<User> => {
    const response = await api.patch('/api/auth/me', data);
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<{
    message: string;
  }> => {
    const response = await api.post('/api/auth/update-password', null, {
      params: {
        current_password: currentPassword,
        new_password: newPassword,
      },
    });
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

  uploadEmblem: async (spaceId: string, formData: FormData): Promise<{
    emblem_url: string;
    message: string;
  }> => {
    const response = await api.post(`/api/spaces/${spaceId}/upload-emblem`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateSpace: async (spaceId: string, data: {
    name?: string;
    secondary_name?: string;
    origin_location?: string;
    origin_cities?: string;
    color_primary?: string;
    color_secondary?: string;
  }): Promise<FamilySpace> => {
    const response = await api.patch(`/api/spaces/${spaceId}`, data);
    return response.data;
  },

  removeMember: async (spaceId: string, memberUserId: string): Promise<void> => {
    await api.delete(`/api/spaces/${spaceId}/members/${memberUserId}`);
  },
};

// --- POSTS/MEMORIES ENDPOINTS ---

export const postsApi = {
  uploadMedia: async (file: File, mediaType: 'photo' | 'video' | 'audio' | 'pdf'): Promise<{
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

  updatePost: async (
    postId: string,
    spaceId: string,
    updates: {
      caption?: string;
      location?: string;
      event_date?: string;
      tags?: string;
    }
  ): Promise<Post> => {
    const response = await api.patch(`/api/posts/${postId}`, null, {
      params: {
        space_id: spaceId,
        ...updates,
      },
    });
    return response.data;
  },

  deletePost: async (postId: string, spaceId: string): Promise<void> => {
    await api.delete(`/api/posts/${postId}`, {
      params: { space_id: spaceId },
    });
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

// --- INVITATIONS ENDPOINTS ---

export const invitationsApi = {
  createInvitationCode: async (
    spaceId: string,
    inviteeName: string,
    inviteeContact: string,
    relationship?: string,
    message?: string
  ): Promise<{
    invitation_code: string;
    invitee_name: string;
    expires_at: string;
    space_name: string;
    message: string;
  }> => {
    const response = await api.post('/api/invitations/create-code', null, {
      params: {
        space_id: spaceId,
        invitee_name: inviteeName,
        invitee_contact: inviteeContact,
        relationship,
        message,
      },
    });
    return response.data;
  },

  joinWithCode: async (invitationCode: string): Promise<{
    status: string;
    message: string;
    space_name: string;
    space_id: string;
  }> => {
    const response = await api.post('/api/invitations/join-with-code', null, {
      params: { invitation_code: invitationCode },
    });
    return response.data;
  },

  registerAndJoin: async (data: {
    invitation_code: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
  }): Promise<{
    access_token: string;
    token_type: string;
    user: User;
    space_id: string;
    space_name: string;
    status: string;
    message: string;
  }> => {
    const response = await api.post('/api/invitations/register-and-join', data);
    return response.data;
  },

  deleteInvitation: async (invitationId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/invitations/${invitationId}`);
    return response.data;
  },

  getSentInvitations: async (spaceId: string): Promise<{
    sent_invitations: Array<{
      id: string;
      invitee_name: string;
      invitee_contact: string;
      relationship?: string;
      token: string;
      created_at: string;
      expires_at: string;
    }>;
    total: number;
  }> => {
    const response = await api.get(`/api/invitations/sent/${spaceId}`);
    return response.data;
  },

  getPendingApprovals: async (spaceId: string): Promise<{
    pending_approvals: Array<{
      membership_id: string;
      user_id: string;
      user_name: string;
      user_email?: string;
      user_phone?: string;
      relationship?: string;
      joined_at: string;
    }>;
    total: number;
  }> => {
    const response = await api.get(`/api/invitations/pending-approvals/${spaceId}`);
    return response.data;
  },

  approveMembership: async (
    membershipId: string,
    spaceId: string,
    approve: boolean = true
  ): Promise<{
    status: string;
    message: string;
    user_name?: string;
  }> => {
    const response = await api.post(`/api/invitations/approve/${membershipId}`, null, {
      params: {
        space_id: spaceId,
        approve,
      },
    });
    return response.data;
  },

  getMySpaces: async (): Promise<{
    spaces: Array<{
      space_id: string;
      space_name: string;
      role: string;
      joined_at: string;
      emblem_url?: string;
    }>;
    total: number;
  }> => {
    const response = await api.get('/api/invitations/my-spaces');
    return response.data;
  },
};

// --- CHAT ENDPOINTS ---

export const chatApi = {
  sendMessage: async (spaceId: string, content: string): Promise<any> => {
    const response = await api.post('/api/chat/send', {
      space_id: spaceId,
      content,
    });
    return response.data;
  },

  getMessages: async (spaceId: string, page: number = 1, perPage: number = 100): Promise<{
    messages: Array<{
      id: string;
      space_id: string;
      user_id: string;
      content: string;
      created_at: string;
      user_name: string;
      user_photo?: string;
    }>;
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  }> => {
    const response = await api.get(`/api/chat/messages/${spaceId}`, {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  deleteMessage: async (messageId: string, spaceId: string): Promise<void> => {
    await api.delete(`/api/chat/${messageId}`, {
      params: { space_id: spaceId },
    });
  },
};

// --- FILE UPLOAD (VIDEO/PDF) ---

export const fileApi = {
  uploadFile: async (file: File): Promise<{
    file_url: string;
    file_path: string;
    file_type: string;
    file_size: number;
    original_filename: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/posts/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// --- RELATIONSHIPS & FAMILY TREE ---

export interface Relationship {
  id: string;
  space_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: string;
  rel_metadata?: Record<string, any>;
  confidence_level: string;
  created_by: string;
  created_at: string;
  person_a_name?: string;
  person_b_name?: string;
}

export interface FamilyTreeNode {
  id: string;
  name: string;
  profile_photo_url?: string;
  birth_date?: string;
  death_date?: string;
  bio?: string;
  relationships: Array<{
    type: string;
    to_person_id: string;
    confidence: string;
  }>;
}

export interface FamilyTree {
  nodes: FamilyTreeNode[];
  edges: Relationship[];
  root_person_id?: string;
}

export interface RelationshipCalculation {
  person_a_id: string;
  person_b_id: string;
  relationship: string;
  path: string[];
  degree: number;
}

export const relationshipsApi = {
  // Create relationship
  create: async (data: {
    space_id: string;
    person_a_id: string;
    person_b_id: string;
    relationship_type: string;
    rel_metadata?: Record<string, any>;
    confidence_level?: string;
  }): Promise<Relationship> => {
    const response = await api.post('/api/relationships', data);
    return response.data;
  },

  // Get all relationships in space
  getAll: async (spaceId: string): Promise<Relationship[]> => {
    const response = await api.get(`/api/relationships/${spaceId}`);
    return response.data;
  },

  // Get family tree
  getTree: async (spaceId: string, rootPersonId?: string): Promise<FamilyTree> => {
    const response = await api.get(`/api/relationships/${spaceId}/tree`, {
      params: rootPersonId ? { root_person_id: rootPersonId } : {},
    });
    return response.data;
  },

  // Calculate relationship between two people
  calculate: async (
    spaceId: string,
    personAId: string,
    personBId: string
  ): Promise<RelationshipCalculation> => {
    const response = await api.get(
      `/api/relationships/${spaceId}/calculate/${personAId}/${personBId}`
    );
    return response.data;
  },

  // Delete relationship
  delete: async (relationshipId: string, spaceId: string): Promise<void> => {
    await api.delete(`/api/relationships/${relationshipId}`, {
      params: { space_id: spaceId },
    });
  },
};

// --- NOTIFICATIONS ---

export interface Notification {
  id: string;
  user_id: string;
  space_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  actor_id?: string;
  actor_name?: string;
  actor_photo?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
}

export const notificationsApi = {
  // Get notifications
  getAll: async (spaceId?: string, unreadOnly: boolean = false): Promise<{
    notifications: Notification[];
    total: number;
    unread_count: number;
  }> => {
    const response = await api.get('/api/notifications/', {
      params: { space_id: spaceId, unread_only: unreadOnly },
    });
    return response.data;
  },

  // Get stats
  getStats: async (spaceId?: string): Promise<NotificationStats> => {
    const response = await api.get('/api/notifications/stats', {
      params: { space_id: spaceId },
    });
    return response.data;
  },

  // Mark as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.post(`/api/notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: async (spaceId?: string): Promise<void> => {
    await api.post('/api/notifications/mark-all-read', null, {
      params: { space_id: spaceId },
    });
  },

  // Delete notification
  delete: async (notificationId: string): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },
};