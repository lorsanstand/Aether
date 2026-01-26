import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, Settings, User, Send, ArrowLeft, X, Pencil, Check, ArrowDown, Trash2 } from 'lucide-react';
import miniLogo from '../assets/mini-logo.png';
import VerificationBanner from '../components/common/VerificationBanner';
import { useEffect, useState, useRef } from 'react';
import chatService, { type Chat, type Message } from '../services/chatService';
import { userService, type User as UserType } from '../services/userService';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  
  // Chat store with cache
  const cachedChats = useChatStore((state) => state.chats);
  const setChatsCache = useChatStore((state) => state.setChats);
  const updateChatCache = useChatStore((state) => state.updateChat);
  
  const [chats, setChats] = useState<Chat[]>(cachedChats); // Initialize with cached data
  const [loading, setLoading] = useState(cachedChats.length === 0); // Don't show loading if we have cache
  const [error, setError] = useState<string | null>(null);
  
  // Selected chat state
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // User profile modal state
  const [viewingUser, setViewingUser] = useState<UserType | null>(null);
  const [_userProfileLoading, setUserProfileLoading] = useState(false);

  // Message input state
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  
  // Unread messages counter
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true); // Track if user is at bottom

  // Ref for auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  
  // Input ref for auto-focus
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadChats = async () => {
      try {
        if (cachedChats.length === 0) {
          setLoading(true);
        }
        setError(null);
        
        const data = await chatService.getChats(0, 50);
        setChats(data);
        setChatsCache(data);
        
        // If chatId in URL, select that chat (messages will load in next useEffect)
        if (chatId && data.length > 0) {
          const chat = data.find(c => c.chat_id === chatId);
          if (chat) {
            setSelectedChat(chat);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка загрузки чатов');
        console.error('Failed to load chats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [chatId, setChatsCache]);

  useEffect(() => {
    if (selectedChat) {
      // Reset messages and load from beginning
      setMessages([]);
      setHasMoreMessages(true);
      setUnreadCount(0);
      setShowScrollButton(false);
      isAtBottomRef.current = true;
      loadMessages(selectedChat.chat_id, true);
      // Auto-focus input when chat is selected
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [selectedChat?.chat_id]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      // Get token from cookies for WebSocket auth
      const wsUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
      const wsProtocol = wsUrl.startsWith('https') ? 'wss' : 'ws';
      const wsBase = wsUrl.replace('http://', '').replace('https://', '');
      
      const ws = new WebSocket(`${wsProtocol}://${wsBase}/chats/ws`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket data:', data);
          
          // Handle message deletion
          if (data.type === 'del' && data.message_id) {
            setMessages(prev => prev.filter(m => m.id !== data.message_id));
            return;
          }
          
          // Handle regular message (add/update)
          const message: Message = data;
          
          // Add or update message in current chat if it belongs to it
          if (selectedChat && message.chat_id === selectedChat.chat_id) {
            const isNewMessage = !messages.some(m => m.id === message.id);
            
            setMessages(prev => {
              // Check if message already exists (update it if edited)
              const existingIndex = prev.findIndex(m => m.id === message.id);
              if (existingIndex !== -1) {
                // Update existing message
                const updated = [...prev];
                updated[existingIndex] = message;
                return updated;
              }
              // Add new message
              return [...prev, message];
            });
            
            // Handle scroll and unread counter for new messages
            if (isNewMessage) {
              // Use ref to check current position synchronously
              setTimeout(() => {
                if (isAtBottomRef.current) {
                  // Auto-scroll if at bottom
                  scrollToBottom(true);
                } else {
                  // Increment unread counter if not at bottom
                  setUnreadCount(prev => prev + 1);
                  setShowScrollButton(true);
                }
              }, 100);
            }
          }
          
          // Update chat list with new last message
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.chat_id === message.chat_id 
                ? { ...chat, last_message: message.content }
                : chat
            )
          );
          
          // Update cache
          updateChatCache(message.chat_id, { last_message: message.content });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (wsRef.current === ws) {
            connectWebSocket();
          }
        }, 3000);
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedChat, updateChatCache]);

  // Handle Escape key to close chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingUser) {
          setViewingUser(null);
        } else if (selectedChat) {
          handleBackToChats();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChat, viewingUser]);

  const loadMessages = async (chatId: string, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setMessagesLoading(true);
      } else {
        setLoadingMore(true);
      }
      setMessagesError(null);
      
      const offset = isInitial ? 0 : messages.length;
      
      // Save scroll position before loading more
      const scrollContainer = messagesContainerRef.current;
      const previousScrollHeight = scrollContainer?.scrollHeight || 0;
      
      const data = await chatService.getChatMessages(chatId, offset, 50);
      
      if (data.length < 50) {
        setHasMoreMessages(false);
      }
      
      // Backend returns messages in DESC order (newest first), reverse to show oldest first
      const sortedData = [...data].reverse();
      
      if (isInitial) {
        setMessages(sortedData);
        // Scroll to bottom on initial load
        setTimeout(() => {
          scrollToBottom(false);
          checkScrollPosition();
        }, 100);
      } else {
        // Prepend old messages to the beginning
        setMessages(prev => [...sortedData, ...prev]);
        
        // Restore scroll position after render
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      }
    } catch (err: any) {
      setMessagesError(err.response?.data?.detail || 'Ошибка загрузки сообщений');
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
      setLoadingMore(false);
    }
  };
  
  const checkScrollPosition = () => {
    const element = messagesContainerRef.current;
    if (!element) return;
    
    const threshold = 150; // pixels from bottom
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const atBottom = distanceFromBottom < threshold;
    
    isAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
    
    if (atBottom) {
      setUnreadCount(0);
    }
  };
  
  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      setUnreadCount(0);
      setShowScrollButton(false);
      isAtBottomRef.current = true;
    }
  };
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    
    // Update scroll position tracking
    checkScrollPosition();
    
    // If scrolled to top and has more messages
    if (element.scrollTop === 0 && hasMoreMessages && !loadingMore && selectedChat) {
      loadMessages(selectedChat.chat_id, false);
    }
  };

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
    navigate(`/chat/${chat.chat_id}`);
  };

  const handleBackToChats = () => {
    setSelectedChat(null);
    setMessages([]);
    navigate('/chat');
  };

  const handleViewUserProfile = async (userId: number) => {
    try {
      setUserProfileLoading(true);
      const userData = await userService.getUserById(userId);
      setViewingUser(userData);
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
    } finally {
      setUserProfileLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      // Send message with chat_id (если чат существует) или recipient_id (если новый чат)
      const newMessage = await chatService.sendMessage({
        content: messageText.trim(),
        chat_id: selectedChat?.chat_id,
        recipient_id: selectedChat?.user_id,
      });

      // Add message to list
      setMessages(prev => [...prev, newMessage]);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      
      // Clear input
      setMessageText('');
      
      // Keep input focused
      messageInputRef.current?.focus();

      // Update chat list with new last message
      const updatedChats = chats.map(chat => 
        chat.chat_id === selectedChat?.chat_id 
          ? { ...chat, last_message: messageText.trim() }
          : chat
      );
      setChats(updatedChats);
      setChatsCache(updatedChats); // Update cache
      
      // Update cache for specific chat
      if (selectedChat?.chat_id) {
        updateChatCache(selectedChat.chat_id, { last_message: messageText.trim() });
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('Не удалось отправить сообщение');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingMessageText(message.content);
  };
  
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };
  
  const handleSaveEdit = async (messageId: string) => {
    if (!editingMessageText.trim() || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      const updatedMessage = await chatService.updateMessage({
        id: messageId,
        content: editingMessageText.trim(),
      });
      
      // Update message in list
      setMessages(prev => 
        prev.map(m => m.id === messageId ? updatedMessage : m)
      );
      
      // Clear editing state
      setEditingMessageId(null);
      setEditingMessageText('');
      
    } catch (err: any) {
      console.error('Failed to update message:', err);
      alert('Не удалось изменить сообщение');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(messageId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Удалить сообщение?')) return;
    
    try {
      await chatService.deleteMessage(messageId);
      // Message will be removed via WebSocket
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      alert('Не удалось удалить сообщение');
    }
  };

  return (
    <div className="min-h-screen h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div className={`w-full md:w-80 flex flex-col shadow-soft ${
        selectedChat ? 'hidden md:flex' : 'flex'
      }`} style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="p-4 md:p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h1 className="text-2xl md:text-3xl font-lora font-semibold text-center tracking-wider" style={{ color: 'var(--accent-primary)' }}>
            AETHER
          </h1>
        </div>

        {/* Verification Banner */}
        {user && !user.is_verified && (
          <div className="p-4">
            <VerificationBanner userEmail={user.email} />
          </div>
        )}

        {/* User Profile Section */}
        <div className="p-4 md:p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Avatar */}
            <div
              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 transition"
              style={{
                backgroundImage: user?.avatar_url ? `url(${user.avatar_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: user?.avatar_url ? '50%' : '0',
              }}
              onClick={() => navigate('/profile')}
              title="Перейти в профиль"
            >
              {!user?.avatar_url && (
                <img src={miniLogo} alt="Avatar" className="w-full h-full object-contain" />
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-inter font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.display_name || user?.username}
              </h3>
              <p className="text-sm font-inter truncate" style={{ color: 'var(--text-secondary)' }}>
                @{user?.username}
              </p>
            </div>

            {/* Settings Icon */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Настройки"
            >
              <Settings size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <motion.button
              onClick={() => navigate('/profile')}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-inter text-sm font-medium transition hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--accent-primary)' }}
            >
              <User size={16} />
              Профиль
            </motion.button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl font-inter font-semibold shadow-sm hover:shadow-md transition"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
          >
            <MessageSquarePlus size={20} />
            Новый чат
          </motion.button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-12 px-4">
                <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-t-transparent rounded-full" 
                     style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
                <p className="font-inter text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Загрузка чатов...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12 px-4">
                <p className="font-inter text-sm text-red-500">{error}</p>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-terracotta/20 to-accent-olive/20 flex items-center justify-center">
                  <MessageSquarePlus size={32} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
                </div>
                <p className="font-inter text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Пока нет чатов
                </p>
                <p className="font-inter text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Начните новый диалог
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <motion.div
                  key={chat.chat_id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChatClick(chat)}
                  className="p-4 rounded-2xl cursor-pointer transition-all relative overflow-hidden"
                  style={{ 
                    backgroundColor: selectedChat?.chat_id === chat.chat_id ? 'var(--accent-primary)' : 'var(--bg-input)',
                    boxShadow: selectedChat?.chat_id === chat.chat_id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Chat Avatar with Online Indicator */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-12 h-12 flex items-center justify-center"
                        style={{
                          backgroundImage: chat.avatar_url ? `url(${chat.avatar_url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: chat.avatar_url ? '50%' : '8px',
                        }}
                      >
                        {!chat.avatar_url && (
                          <img src={miniLogo} alt="Avatar" className="w-full h-full object-contain" />
                        )}
                      </div>
                      {/* Online indicator */}
                      <div 
                        className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                        style={{ 
                          backgroundColor: '#10b981',
                          borderColor: 'var(--bg-card)'
                        }}
                      />
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 
                          className="font-inter font-semibold text-base truncate" 
                          style={{ color: selectedChat?.chat_id === chat.chat_id ? 'white' : 'var(--text-primary)' }}
                        >
                          {chat.display_name}
                        </h4>
                        {/* Time badge */}
                        <span 
                          className="text-xs font-inter flex-shrink-0"
                          style={{ 
                            color: selectedChat?.chat_id === chat.chat_id ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                            fontSize: '0.7rem'
                          }}
                        >
                          12:34
                        </span>
                      </div>
                      
                      {chat.last_message ? (
                        <p 
                          className="font-inter text-sm truncate" 
                          style={{ color: selectedChat?.chat_id === chat.chat_id ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}
                        >
                          {chat.last_message}
                        </p>
                      ) : (
                        <p 
                          className="font-inter text-sm italic truncate" 
                          style={{ color: selectedChat?.chat_id === chat.chat_id ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)' }}
                        >
                          Нет сообщений
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs font-inter" style={{ color: 'var(--text-secondary)' }}>
            Aether Chat v1.0
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative ${
        selectedChat ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b flex items-center gap-2 md:gap-4" style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBackToChats}
                className="p-2 rounded-full transition"
                style={{ 
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)'
                }}
                title="Назад к чатам"
              >
                <ArrowLeft size={20} />
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleViewUserProfile(selectedChat.user_id)}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center cursor-pointer"
                style={{
                  backgroundImage: selectedChat.avatar_url ? `url(${selectedChat.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: selectedChat.avatar_url ? '50%' : '0',
                }}
              >
                {!selectedChat.avatar_url && (
                  <img src={miniLogo} alt="Avatar" className="w-full h-full object-contain" />
                )}
              </motion.div>

              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleViewUserProfile(selectedChat.user_id)}
              >
                <h3 className="font-inter font-semibold truncate hover:underline" style={{ color: 'var(--text-primary)' }}>
                  {selectedChat.display_name}
                </h3>
                <p className="text-xs font-inter" style={{ color: 'var(--text-secondary)' }}>
                  в сети
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 relative" 
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                backgroundImage: `
                  radial-gradient(circle at 10% 20%, rgba(166, 123, 91, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 90% 80%, rgba(119, 141, 109, 0.08) 0%, transparent 50%),
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 50px,
                    rgba(166, 123, 91, 0.02) 50px,
                    rgba(166, 123, 91, 0.02) 51px
                  )
                `
              }}
            >
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" 
                       style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
                </div>
              )}
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" 
                       style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
                </div>
              ) : messagesError ? (
                <div className="flex items-center justify-center h-full">
                  <p className="font-inter text-sm text-red-500">{messagesError}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent-terracotta/15 to-accent-olive/15 flex items-center justify-center shadow-lg">
                      <MessageSquarePlus size={42} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
                    </div>
                    <h3 className="font-lora text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Начните общение
                    </h3>
                    <p className="font-inter text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Отправьте первое сообщение в этот чат
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 max-w-4xl mx-auto">
                  {messages.map((message, index) => {
                    const isMyMessage = message.sender_id === user?.id;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                    const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;
                    
                    // Check if date changed from previous message
                    const messageDate = new Date(message.created_at);
                    const prevMessageDate = prevMessage ? new Date(prevMessage.created_at) : null;
                    const showDateDivider = !prevMessageDate || 
                      messageDate.toDateString() !== prevMessageDate.toDateString();
                    
                    return (
                      <div key={message.id}>
                        {/* Date divider */}
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-6">
                            <div className="px-4 py-2 rounded-full font-inter text-xs font-medium shadow-sm" 
                                 style={{ 
                                   backgroundColor: 'var(--bg-card)', 
                                   color: 'var(--text-secondary)',
                                   border: '1px solid var(--border-color)'
                                 }}>
                              {messageDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={`flex gap-3 mb-3 ${isMyMessage ? 'justify-end' : 'justify-start'} ${!showAvatar && !isMyMessage ? 'ml-11' : ''}`}
                        >
                        {/* Avatar for incoming messages */}
                        {!isMyMessage && showAvatar && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="w-9 h-9 flex-shrink-0 flex items-center justify-center self-end shadow-md"
                            style={{
                              backgroundImage: selectedChat.avatar_url ? `url(${selectedChat.avatar_url})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: selectedChat.avatar_url ? '50%' : '8px',
                              border: '2px solid var(--bg-card)'
                            }}
                          >
                            {!selectedChat.avatar_url && (
                              <img src={miniLogo} alt="Avatar" className="w-full h-full object-contain p-1" />
                            )}
                          </motion.div>
                        )}

                        {/* Message bubble */}
                        <div className="flex flex-col max-w-lg">
                          {/* Sender name for incoming messages */}
                          {!isMyMessage && showAvatar && (
                            <span className="text-xs font-inter font-medium mb-1 px-2" style={{ color: 'var(--accent-primary)' }}>
                              {selectedChat.display_name}
                            </span>
                          )}
                          
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`px-5 py-3 font-inter text-[15px] leading-relaxed relative group ${
                              isMyMessage 
                                ? 'rounded-[20px] rounded-br-md' 
                                : 'rounded-[20px] rounded-bl-md'
                            }`}
                            style={{
                              backgroundColor: isMyMessage ? 'var(--accent-primary)' : 'var(--bg-card)',
                              color: isMyMessage ? 'white' : 'var(--text-primary)',
                              boxShadow: isMyMessage 
                                ? '0 2px 8px rgba(166, 123, 91, 0.25)' 
                                : '0 2px 8px rgba(0,0,0,0.08)',
                              border: isMyMessage ? 'none' : '1px solid var(--border-color)'
                            }}
                          >
                            {/* Edit and Delete buttons - показываем только для своих сообщений */}
                            {isMyMessage && editingMessageId !== message.id && (
                              <>
                                <button
                                  onClick={() => handleStartEdit(message)}
                                  className="absolute -top-2 -right-10 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--accent-primary)' }}
                                  title="Редактировать"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="absolute -top-2 -right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  style={{ backgroundColor: 'var(--bg-card)', color: '#DC2626' }}
                                  title="Удалить"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            
                            {/* Message content or edit input */}
                            {editingMessageId === message.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingMessageText}
                                  onChange={(e) => setEditingMessageText(e.target.value)}
                                  onKeyDown={(e) => handleEditKeyPress(e, message.id)}
                                  autoFocus
                                  className="flex-1 bg-transparent border-b-2 outline-none"
                                  style={{ 
                                    borderColor: isMyMessage ? 'rgba(255,255,255,0.5)' : 'var(--accent-primary)',
                                    color: isMyMessage ? 'white' : 'var(--text-primary)'
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveEdit(message.id)}
                                  className="p-1 hover:opacity-70 transition"
                                  title="Сохранить (Enter)"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 hover:opacity-70 transition"
                                  title="Отмена (Esc)"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <p className="break-words whitespace-pre-wrap">{message.content}</p>
                            )}
                            
                            {/* Message metadata */}
                            <div className={`flex items-center gap-2 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                              {/* Edited indicator */}
                              {message.is_edited && (
                                <span 
                                  className="text-[11px] font-inter font-medium italic"
                                  style={{ 
                                    color: isMyMessage ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)',
                                  }}
                                >
                                  изменено
                                </span>
                              )}
                              
                              <span 
                                className="text-[11px] font-inter font-medium"
                                style={{ 
                                  color: isMyMessage ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
                                }}
                              >
                                {new Date(message.created_at).toLocaleTimeString('ru-RU', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              
                              {/* Read status for my messages */}
                              {isMyMessage && (
                                <svg 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 16 16" 
                                  fill="none"
                                  style={{ opacity: 0.75 }}
                                >
                                  <path 
                                    d="M3 8L6 11L13 4" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                  <path 
                                    d="M5 8L8 11L15 4" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                          </motion.div>
                          
                          {/* Reactions placeholder - можно добавить позже */}
                          {isLastInGroup && false && (
                            <div className="flex gap-1 mt-1 px-2">
                              <span className="text-xs">❤️</span>
                            </div>
                          )}
                        </div>
                        </motion.div>
                      </div>
                    );
                  })}
                  
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Scroll to bottom button with unread counter - OUTSIDE scroll container */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-20 md:bottom-24 right-4 md:right-8 p-2.5 md:p-3 rounded-full shadow-xl hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: 'var(--accent-primary)', 
                    color: 'white',
                    zIndex: 50
                  }}
                  title="Прокрутить вниз"
                >
                  <ArrowDown size={20} />
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2"
                      style={{ 
                        backgroundColor: '#DC2626', 
                        color: 'white',
                        borderColor: 'var(--bg-card)'
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Message Input */}
            <div className="p-3 md:p-4 border-t" style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}>
              <div className="flex gap-2 md:gap-3 max-w-4xl mx-auto">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Написать сообщение..."
                  disabled={sendingMessage}
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl font-inter text-sm outline-none transition"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    borderBottom: '2px solid transparent',
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-inter font-semibold flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                >
                  {sendingMessage ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Send size={18} />
                  )}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <img src={miniLogo} alt="Aether Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-2xl font-lora font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Добро пожаловать в Aether
                </h2>
                <p className="font-inter" style={{ color: 'var(--text-secondary)' }}>
                  Выберите существующий чат из списка слева или создайте новый, чтобы начать общение
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {viewingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => setViewingUser(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
                <h2 className="text-xl font-lora font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Профиль пользователя
                </h2>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      backgroundImage: viewingUser.avatar_url ? `url(${viewingUser.avatar_url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: viewingUser.avatar_url ? undefined : 'var(--bg-input)',
                    }}
                  >
                    {!viewingUser.avatar_url && (
                      <User size={48} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-lora font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {viewingUser.display_name}
                    </h3>
                    <p className="text-sm font-inter" style={{ color: 'var(--text-secondary)' }}>
                      @{viewingUser.username}
                    </p>
                  </div>

                  {viewingUser.description && (
                    <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-input)' }}>
                      <p className="text-sm font-inter" style={{ color: 'var(--text-primary)' }}>
                        {viewingUser.description}
                      </p>
                    </div>
                  )}

                  {viewingUser.birth_day && (
                    <div className="flex items-center gap-2 text-sm font-inter" style={{ color: 'var(--text-secondary)' }}>
                      <span>🎂</span>
                      <span>
                        {new Date(viewingUser.birth_day).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm font-inter" style={{ color: 'var(--text-secondary)' }}>
                    <span>✉️</span>
                    <span>{viewingUser.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewingUser(null)}
                    className="w-full py-3 px-4 rounded-2xl font-inter font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                  >
                    Закрыть
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
