import apiClient from './api';

const extractUsersArray = (payload: unknown): User[] => {
  if (Array.isArray(payload)) {
    return payload as User[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.items, record.results, record.data, record.users];
    const firstArray = candidates.find(Array.isArray);
    if (firstArray) {
      return firstArray as User[];
    }
  }

  return [];
};

export interface User {
  id: number;
  display_name: string;
  username: string;
  email: string;
  birth_day?: string;
  description?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
}

export interface UserUpdate {
  display_name?: string;
  username?: string;
  birth_day?: string;
  description?: string;
}

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (data: UserUpdate): Promise<User> => {
    // Filter out empty strings to avoid validation errors
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== '')
    );
    const response = await apiClient.put('/users/me', filteredData);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete('/users/me/avatar');
  },

  searchUsers: async (username: string, offset: number = 0, limit: number = 30): Promise<User[]> => {
    const response = await apiClient.get('/users/search', {
      params: { username, offset, limit }
    });
    return extractUsersArray(response.data);
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/users/me');
  },
};
