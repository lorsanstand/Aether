import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import miniLogo from '../assets/mini-logo.png';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-screen h-screen flex items-center justify-center p-3 md:p-4 relative overflow-hidden" style={{ backgroundColor: '#F5F5F1' }}>
      {/* Subtle texture background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
           style={{ 
             backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.03) 1%, transparent 1%)',
             backgroundSize: '20px 20px'
           }}>
      </div>
      
      <motion.div 
        className="w-full max-w-[480px] relative z-10"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-card-white rounded-2xl md:rounded-3xl shadow-soft px-5 md:px-10 py-8 md:py-12">
          {/* Logo */}
          <div className="text-center mb-5 md:mb-8">
            <div className="auth-logo w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 flex items-center justify-center">
              <img src={miniLogo} alt="Aether Logo" className="w-full h-full object-contain" />
            </div>
            <div className="font-lora text-accent-olive text-sm md:text-lg tracking-[2px] mb-3 md:mb-4">
              AETHER
            </div>
            <AnimatePresence mode="wait">
              <motion.h1 
                key={isLogin ? 'login' : 'register'}
                className="font-lora font-semibold text-xl md:text-2xl text-text-main mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                {isLogin ? 'Вход в аккаунт' : 'Создание аккаунта'}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Forms with animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              {isLogin ? <LoginForm /> : <RegisterForm />}
            </motion.div>
          </AnimatePresence>

          {/* Switch */}
          <div className="mt-5 md:mt-6 text-center text-xs md:text-sm font-inter" style={{ color: '#8B8B8B' }}>
            {isLogin ? (
              <>
                Ещё нет аккаунта?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-medium hover:underline transition min-h-touch"
                  style={{ color: '#6B705C' }}
                >
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-medium hover:underline transition min-h-touch"
                  style={{ color: '#6B705C' }}
                >
                  Войти
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
