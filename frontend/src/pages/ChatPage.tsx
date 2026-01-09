import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    // TODO: Call logout API
    logout();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-screen flex">
        {/* Sidebar */}
        <div className="w-80 bg-card-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-lora font-semibold text-accent-olive">Aether</h1>
          </div>
          
          <div className="p-4">
            <p className="text-sm text-text-muted font-inter">Привет, {user?.username}!</p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-2 text-sm text-accent-olive hover:opacity-70 font-inter block"
            >
              Мой профиль
            </button>
            <button
              onClick={handleLogout}
              className="mt-2 text-sm text-error-soft hover:text-red-700 font-inter"
            >
              Выйти
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 text-center text-text-muted font-inter">
              Чаты скоро появятся...
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center text-text-muted font-inter">
            Выберите чат или начните новый
          </div>
        </div>
      </div>
    </div>
  );
}
