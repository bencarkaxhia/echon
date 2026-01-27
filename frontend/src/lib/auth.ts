/**
 * Echon Authentication Utilities
 * Token storage, user management, auth state
 * 
 * PATH: echon/frontend/src/lib/auth.ts
 */

import { User } from './api';

// --- TOKEN MANAGEMENT ---

export const setAuthToken = (token: string): void => {
  localStorage.setItem('echon_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('echon_token');
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('echon_token');
};

// --- USER MANAGEMENT ---

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('echon_user', JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('echon_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const removeCurrentUser = (): void => {
  localStorage.removeItem('echon_user');
};

// --- AUTH STATE ---

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const logout = (): void => {
  removeAuthToken();
  removeCurrentUser();
  removeCurrentSpace();
  window.location.href = '/';
};

// --- FAMILY SPACE TRACKING ---

export const setCurrentSpace = (spaceId: string): void => {
  localStorage.setItem('echon_current_space', spaceId);
};

export const getCurrentSpace = (): string | null => {
  return localStorage.getItem('echon_current_space');
};

export const removeCurrentSpace = (): void => {
  localStorage.removeItem('echon_current_space');
};