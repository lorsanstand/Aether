import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import miniLogo from '../assets/mini-logo.png';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(username);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка отправки письма');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Subtle texture background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
           style={{ 
             backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.03) 1%, transparent 1%)',
             backgroundSize: '20px 20px'
           }}>
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="rounded-[32px] shadow-soft p-8" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <img src={miniLogo} alt="Aether Logo" className="w-full h-full object-contain" />
            </div>
            <div className="font-lora text-lg tracking-[2px] mb-6" style={{ color: 'var(--accent-primary)' }}>
              AETHER
            </div>
            <h2 className="text-xl font-lora font-semibold" style={{ color: 'var(--text-primary)' }}>
              Запрос сброса пароля
            </h2>
            <p className="mt-2 text-sm font-inter" style={{ color: 'var(--text-secondary)' }}>
              Введите почту или никнейм для получения ссылки на сброс пароля
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Почта или никнейм
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="example@mail.com"
                  autoFocus
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 font-inter placeholder:text-text-muted/50 focus:outline-none transition-all duration-300"
                  style={{ 
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                  }}
                  required
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl text-sm font-inter"
                  style={{
                    backgroundColor: 'var(--error-soft)',
                    color: 'var(--error-color)',
                    border: '2px solid var(--error-color)',
                  }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.95 }}
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                className="w-full mt-8 py-[18px] px-10 rounded-full font-inter font-semibold uppercase tracking-wider hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Отправка...' : 'Отправить ссылку'}
              </motion.button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 mx-auto font-inter text-sm hover:opacity-70 transition"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <ArrowLeft size={16} />
                  Вернуться к входу
                </button>
              </div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                   style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-lora font-semibold" style={{ color: 'var(--text-primary)' }}>
                Письмо отправлено!
              </h3>
              <p className="text-sm font-inter" style={{ color: 'var(--text-secondary)' }}>
                Проверьте почту и следуйте инструкциям для сброса пароля
              </p>
              <motion.button
                onClick={() => navigate('/auth')}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-6 py-3 rounded-full font-inter font-semibold transition hover:shadow-lg"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                Вернуться к входу
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
