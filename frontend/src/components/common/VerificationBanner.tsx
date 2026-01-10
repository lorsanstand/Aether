import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import { authService } from '../../services/authService';

interface VerificationBannerProps {
  userEmail: string;
}

export default function VerificationBanner({ userEmail }: VerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResendEmail = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await authService.resendVerificationEmail();
      setIsSuccess(true);
      setMessage('Письмо успешно отправлено! Проверьте свою почту.');
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.response?.data?.detail || 'Ошибка отправки письма');
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6 relative rounded-2xl p-4 shadow-sm"
        style={{ 
          backgroundColor: 'var(--accent-primary-soft)',
          border: '2px solid var(--accent-primary)'
        }}
      >
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 p-1 hover:opacity-70 transition"
          style={{ color: 'var(--accent-primary)' }}
          title="Закрыть"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex-shrink-0 p-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <Mail size={20} className="text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-inter font-semibold mb-1" style={{ color: 'var(--accent-primary)' }}>
              Подтвердите свою почту
            </h3>
            <p className="text-sm font-inter mb-3" style={{ color: 'var(--text-primary)' }}>
              Мы отправили письмо с подтверждением на <span className="font-semibold">{userEmail}</span>. 
              Проверьте почту и перейдите по ссылке для активации аккаунта.
            </p>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 text-sm font-inter"
                style={{ 
                  color: isSuccess ? 'var(--accent-primary)' : 'var(--error-color)'
                }}
              >
                {message}
              </motion.div>
            )}

            <motion.button
              onClick={handleResendEmail}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-full font-inter text-sm font-semibold transition hover:shadow-md disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              {isLoading ? 'Отправка...' : 'Отправить письмо повторно'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
