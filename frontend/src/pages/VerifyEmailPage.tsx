import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setErrorMessage('Токен верификации не найден');
        setStatus('error');
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setTimeout(() => navigate('/auth'), 3000);
      } catch (error: any) {
        setErrorMessage(
          error.response?.data?.detail || 'Не удалось подтвердить почту'
        );
        setStatus('error');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-bg-sand flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="bg-card-white rounded-[32px] shadow-soft p-8 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-lora font-semibold text-accent-olive mb-2">Aether</h1>
          </div>

          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-accent-olive rounded-full animate-spin mx-auto"></div>
              <h2 className="text-xl font-lora font-semibold text-text-main">Верификация почты...</h2>
              <p className="text-text-muted font-inter">Пожалуйста, подождите</p>
            </div>
          )}

          {status === 'success' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-lora font-semibold text-text-main">Почта подтверждена!</h2>
              <p className="text-text-muted font-inter">
                Ваша почта успешно подтверждена. Перенаправление на страницу входа...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-lora font-semibold text-text-main">Ошибка верификации</h2>
              <p className="text-text-muted font-inter">{errorMessage}</p>
              <motion.button
                onClick={() => navigate('/auth')}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-6 py-3 bg-accent-olive text-white rounded-full font-inter font-semibold hover:shadow-lg transition"
              >
                Вернуться к регистрации
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
