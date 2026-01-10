import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 font-inter font-medium hover:opacity-70 transition"
            style={{ color: 'var(--accent-primary)' }}
          >
            <ArrowLeft size={20} />
            Назад к чатам
          </button>
        </div>

        {/* Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl shadow-soft p-8"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <h1 className="text-3xl font-lora font-semibold mb-8" style={{ color: 'var(--text-primary)' }}>
            Настройки
          </h1>

          {/* Appearance Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-lora font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Внешний вид
              </h2>

              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="block font-lora italic text-[15px] mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Тема оформления
                </label>

                <div className="grid grid-cols-2 gap-4">
                  {/* Light Theme */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme('light')}
                    className="relative p-6 rounded-2xl border-2 transition-all"
                    style={{
                      backgroundColor: theme === 'light' ? 'var(--accent-primary-soft)' : 'var(--bg-input)',
                      borderColor: theme === 'light' ? 'var(--accent-primary)' : 'transparent',
                    }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Sun size={32} className="text-white" />
                      </div>
                      <span className="font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Светлая тема
                      </span>
                      {theme === 'light' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>

                  {/* Dark Theme */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme('dark')}
                    className="relative p-6 rounded-2xl border-2 transition-all"
                    style={{
                      backgroundColor: theme === 'dark' ? 'var(--accent-primary-soft)' : 'var(--bg-input)',
                      borderColor: theme === 'dark' ? 'var(--accent-primary)' : 'transparent',
                    }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
                        <Moon size={32} className="text-white" />
                      </div>
                      <span className="font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Темная тема
                      </span>
                      {theme === 'dark' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                </div>

                <p className="text-sm font-inter mt-3" style={{ color: 'var(--text-secondary)' }}>
                  Выберите тему, которая лучше всего подходит для ваших глаз
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
