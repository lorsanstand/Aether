import apiClient from './api';

export type Chat = {
  chat_id: string;
  user_id: number;
  last_message: string | null;
  avatar_url: string | null;
  display_name: string;
}

export type Message = {
  id: string;
  sender_id: number;
  chat_id: string;
  content: string;
  is_edited?: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageCreate = {
  content: string;
  chat_id?: string;
  recipient_id?: number;
}

export type MessageUpdate = {
  id: string;
  content: string;
}

const chatService = {
  async getChats(offset: number = 0, limit: number = 10): Promise<Chat[]> {
    const response = await apiClient.get('/chats/', {
      params: { offset, limit }
    });
    return response.data;
  },

  async getChatMessages(chatId: string, offset: number = 0, limit: number = 50): Promise<Message[]> {
    const response = await apiClient.get(`/chats/${chatId}`, {
      params: { offset, limit }
    });
    return response.data;
  },

  async sendMessage(data: MessageCreate): Promise<Message> {
    const response = await apiClient.post('/chats/message', data);
    return response.data;
  },

  async updateMessage(data: MessageUpdate): Promise<Message> {
    const response = await apiClient.put('/chats/message', data);
    return response.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete('/chats/message', {
      params: { message_id: messageId }
    });
  }
};

export default chatService;
