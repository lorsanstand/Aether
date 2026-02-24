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
    const preventBounce = (e: TouchEvent) => {
      if ((e.target as any).closest('.overflow-y-auto') === null && 
          (e.target as any).nodeName !== 'INPUT' &&
          (e.target as any).nodeName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventBounce, { passive: false });

    // Track focus state for input fields
    let isInputFocused = false;
    
    const handleInputFocus = () => {
      isInputFocused = true;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    };
    
    const handleInputBlur = () => {
      isInputFocused = false;
      document.body.style.position = '';
      document.body.style.width = '';
    };
    
    // Attach focus/blur listeners to all inputs
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', handleInputFocus);
      input.addEventListener('blur', handleInputBlur);
    });

    // Handle viewport resize and keyboard appearance using visualViewport API
    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        // Fallback for older browsers
        const windowHeight = window.innerHeight;
        const vh = windowHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        return;
      }

      // Calculate keyboard height
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);

      // Set CSS variables for keyboard height
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      
      // Set standard vh variable for better compatibility
      const vh = viewport.height * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      // Prevent body scrolling issues
      if (keyboardHeight > 0) {
        document.body.style.overflow = 'hidden';
      } else if (!isInputFocused) {
        document.body.style.overflow = 'auto';
      }
    };

    // Listen to visualViewport changes (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      handleViewportChange();
    }

    // Fallback for older browsers - listen to window resize
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleViewportChange, 100);
    });

    // Initial setup
    handleViewportChange();

    return () => {
      document.removeEventListener('touchmove', preventBounce);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
        input.removeEventListener('blur', handleInputBlur);
      });
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
