import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="max-w-4xl mx-auto w-full p-3 md:p-6">
          {/* Header */}
          <div className="mb-3 md:mb-6 flex-shrink-0">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 font-inter font-medium hover:opacity-70 transition min-h-touch min-w-touch text-sm md:text-base"
              style={{ color: 'var(--accent-primary)' }}
            >
              <ArrowLeft size={16} className="md:w-5 md:h-5" />
              Назад
            </button>
          </div>

          {/* Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl md:rounded-3xl shadow-soft p-4 md:p-8"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h1 className="text-2xl md:text-3xl font-lora font-semibold mb-6 md:mb-8" style={{ color: 'var(--text-primary)' }}>
              Настройки
            </h1>

            {/* Appearance Section */}
            <div className="space-y-5 md:space-y-6">
              <div>
                <h2 className="text-lg md:text-xl font-lora font-semibold mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>
                  Внешний вид
                </h2>

                {/* Theme Selector */}
                <div className="space-y-2 md:space-y-3">
                  <label className="block font-lora italic text-xs md:text-[15px] mb-2 md:mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Тема оформления
                  </label>

                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {/* Light Theme */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme('light')}
                      className="relative p-3 md:p-6 rounded-lg md:rounded-2xl border-2 transition-all min-h-touch"
                      style={{
                        backgroundColor: theme === 'light' ? 'var(--accent-primary-soft)' : 'var(--bg-input)',
                        borderColor: theme === 'light' ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 md:gap-3">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <Sun size={20} className="md:w-8 md:h-8 text-white" />
                        </div>
                        <span className="font-inter font-semibold text-xs md:text-sm" style={{ color: 'var(--text-primary)' }}>
                          Светлая тема
                        </span>
                        {theme === 'light' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 md:top-3 right-2 md:right-3 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--accent-primary)' }}
                          >
                            <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="relative p-3 md:p-6 rounded-lg md:rounded-2xl border-2 transition-all min-h-touch"
                      style={{
                        backgroundColor: theme === 'dark' ? 'var(--accent-primary-soft)' : 'var(--bg-input)',
                        borderColor: theme === 'dark' ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 md:gap-3">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
                          <Moon size={20} className="md:w-8 md:h-8 text-white" />
                        </div>
                        <span className="font-inter font-semibold text-xs md:text-sm" style={{ color: 'var(--text-primary)' }}>
                          Темная тема
                        </span>
                        {theme === 'dark' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 md:top-3 right-2 md:right-3 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--accent-primary)' }}
                          >
                            <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </div>

                  <p className="text-xs md:text-sm font-inter mt-2 md:mt-3" style={{ color: 'var(--text-secondary)' }}>
                    Выберите тему оформления
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
