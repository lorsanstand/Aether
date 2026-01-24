import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chat } from '../services/chatService';

interface ChatStore {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  clearChats: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      chats: [],
      
      setChats: (chats) => set({ chats }),
      
      updateChat: (chatId, updates) => 
        set((state) => ({
          chats: state.chats.map(chat => 
            chat.chat_id === chatId ? { ...chat, ...updates } : chat
          )
        })),
      
      clearChats: () => set({ chats: [] }),
    }),
    {
      name: 'aether-chats',
      partialize: (state) => ({ chats: state.chats }),
    }
  )
);
