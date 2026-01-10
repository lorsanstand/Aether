import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (!agreedToTerms) {
      setError('Необходимо принять правила');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({ email, display_name: displayName, username, password });
      setSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block font-lora italic text-[15px] text-text-muted mb-2">
          Электронная почта
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@mail.com"
          autoFocus
          className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 font-inter text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent-terracotta transition-all duration-300"
          required
        />
      </div>

      <div>
        <label htmlFor="displayName" className="block font-lora italic text-[15px] text-text-muted mb-2">
          Имя для отображения
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Как вас называть"
          className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 font-inter text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent-terracotta transition-all duration-300"
          required
        />
      </div>

      <div>
        <label htmlFor="username" className="block font-lora italic text-[15px] text-text-muted mb-2">
          Никнейм
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ваш никнейм"
          className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 font-inter text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent-terracotta transition-all duration-300"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block font-lora italic text-[15px] text-text-muted mb-2">
          Пароль
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 8 символов"
            className="w-full px-0 py-3 pr-10 bg-transparent border-0 border-b-2 border-gray-200 font-inter text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent-terracotta transition-all duration-300"
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
        <label htmlFor="confirmPassword" className="block font-lora italic text-[15px] text-text-muted mb-2">
          Повторите пароль
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Повторите пароль"
          className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 font-inter text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent-terracotta transition-all duration-300"
          required
        />
      </div>

      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={() => setAgreedToTerms(!agreedToTerms)}
          style={{
            backgroundColor: agreedToTerms ? '#D27D56' : 'transparent',
            borderColor: agreedToTerms ? '#D27D56' : '#8B8B8B'
          }}
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        >
          {agreedToTerms && (
            <motion.svg 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </button>
        <label className="font-inter text-sm cursor-pointer" style={{ color: '#8B8B8B' }} onClick={() => setAgreedToTerms(!agreedToTerms)}>
          Я согласен с <a href="#" style={{ color: '#6B705C' }} className="hover:underline">правилами</a>
        </label>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-error-soft/10 border-b-2 border-error-soft text-error-soft text-sm font-inter"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-accent-terracotta/10 border-b-2 border-accent-terracotta text-accent-terracotta text-sm font-inter"
        >
          {success}
        </motion.div>
      )}

      <motion.button
        type="submit"
        disabled={isLoading}
        whileTap={{ scale: 0.95 }}
        style={{ backgroundColor: '#D27D56', color: 'white' }}
        className="w-full mt-8 py-[18px] px-10 rounded-full font-inter font-semibold uppercase tracking-wider hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
      </motion.button>
    </form>
  );
}
