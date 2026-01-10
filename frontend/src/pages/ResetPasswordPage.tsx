import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import miniLogo from '../assets/mini-logo.png';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Токен сброса пароля не найден');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }

    if (!token) {
      setError('Токен не найден');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/auth'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось сбросить пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundColor: '#F5F5F1' }}>
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
        <div className="bg-card-white rounded-[32px] shadow-soft p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <img src={miniLogo} alt="Aether Logo" className="w-full h-full object-contain" />
            </div>
            <div className="font-lora text-lg tracking-[2px] mb-6" style={{ color: '#6B705C' }}>
              AETHER
            </div>
            <h2 className="text-xl font-lora font-semibold" style={{ color: '#2C2C2C' }}>
              Сброс пароля
            </h2>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block font-lora italic text-[15px] mb-2" style={{ color: '#8B8B8B' }}>
                  Новый пароль
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    autoFocus
                    className="w-full px-0 py-3 pr-10 bg-transparent border-0 border-b-2 border-gray-200 font-inter placeholder:text-text-muted/50 focus:outline-none transition-all duration-300"
                    style={{ 
                      color: '#2C2C2C',
                      borderBottomColor: '#E5E5E5'
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = '#6B705C'}
                    onBlur={(e) => e.target.style.borderBottomColor = '#E5E5E5'}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 transition"
                    style={{ color: '#8B8B8B' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block font-lora italic text-[15px] mb-2" style={{ color: '#8B8B8B' }}>
                  Повторите пароль
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 font-inter placeholder:text-text-muted/50 focus:outline-none transition-all duration-300"
                  style={{ 
                    color: '#2C2C2C',
                    borderBottomColor: '#E5E5E5'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = '#6B705C'}
                  onBlur={(e) => e.target.style.borderBottomColor = '#E5E5E5'}
                  required
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 border-b-2 text-sm font-inter"
                  style={{ 
                    backgroundColor: 'rgba(199, 154, 139, 0.1)',
                    borderBottomColor: '#C79A8B',
                    color: '#C79A8B'
                  }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.95 }}
                style={{ backgroundColor: '#6B705C', color: 'white' }}
                className="w-full mt-8 py-[18px] px-10 rounded-full font-inter font-semibold uppercase tracking-wider hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Сброс...' : 'Сбросить пароль'}
              </motion.button>
            </form>
          ) : (
            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-lora font-semibold" style={{ color: '#2C2C2C' }}>
                Пароль успешно изменен!
              </h2>
              <p className="font-inter" style={{ color: '#8B8B8B' }}>
                Перенаправление на страницу входа...
              </p>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-inter font-medium hover:underline transition"
              style={{ color: '#6B705C' }}
            >
              Вернуться ко входу
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
