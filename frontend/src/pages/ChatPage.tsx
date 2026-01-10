import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquarePlus, Settings, User } from 'lucide-react';
import miniLogo from '../assets/mini-logo.png';
import VerificationBanner from '../components/common/VerificationBanner';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div className="w-80 flex flex-col shadow-soft" style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h1 className="text-3xl font-lora font-semibold text-center tracking-wider" style={{ color: 'var(--accent-primary)' }}>
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
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 transition"
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
            {/* Placeholder for future chats */}
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
      <div className="flex-1 flex flex-col">
        {/* Empty State */}
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
      </div>
    </div>
  );
}
