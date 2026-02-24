import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { authService } from './services/authService';
import AuthPage from './pages/AuthPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F5F1' }}>
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#6B705C' }}></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
}

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Prevent default iOS behaviors
    document.addEventListener('touchmove', (e) => {
      if ((e.target as any).closest('.overflow-y-auto') === null && 
          (e.target as any).nodeName !== 'INPUT' &&
          (e.target as any).nodeName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }, { passive: false });

    // Handle viewport resize on mobile (keyboard appears)
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUser(user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/chat" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
