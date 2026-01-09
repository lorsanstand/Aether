import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authService.login({ username, password });
      const user = await authService.getCurrentUser();
      setUser(user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block font-lora italic text-[15px] text-text-muted mb-2">
          Почта или никнейм
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="example@mail.com"
          autoFocus
          className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 font-inter text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent-olive transition-all duration-300"
          required
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="password" className="block font-lora italic text-[15px] text-text-muted">
            Пароль
          </label>
          <a href="#" className="font-inter text-sm hover:underline transition" style={{ color: '#6B705C' }}>
            Забыли пароль?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ваш пароль"
            className="w-full px-0 py-3 pr-10 bg-transparent border-0 border-b-2 border-gray-200 font-inter text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent-olive transition-all duration-300"
            required
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

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-error-soft/10 border-b-2 border-error-soft text-error-soft text-sm font-inter"
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
        {isLoading ? 'Вход...' : 'Войти'}
      </motion.button>
    </form>
  );
}
