import apiClient from './api';
import type { User } from './userService';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  display_name: string;
  username: string;
  password: string;
}

export const authService = {
  login: async (data: LoginData) => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  guestLogin: async () => {
    const response = await apiClient.post('/auth/guest');
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await apiClient.post(`/auth/email/verify/${token}`);
    return response.data;
  },

  resendVerificationEmail: async () => {
    const response = await apiClient.post('/auth/email/resend-verification');
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post(`/auth/password/reset/${token}`, null, {
      params: { new_password: newPassword }
    });
    return response.data;
  },

  requestPasswordReset: async (username_email: string) => {
    const response = await apiClient.post('/auth/password/reset', null, {
      params: { username_email }
    });
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/password/change', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
};
