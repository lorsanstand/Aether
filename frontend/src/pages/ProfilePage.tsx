import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Trash2, LogOut, ArrowLeft } from 'lucide-react';
import { userService } from '../services/userService';
import type { UserUpdate } from '../services/userService';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<UserUpdate>({
    display_name: user?.display_name || '',
    username: user?.username || '',
    description: user?.description || '',
    birth_day: user?.birth_day || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        username: user.username,
        description: user.description || '',
        birth_day: user.birth_day || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const updatedUser = await userService.uploadAvatar(file);
      useAuthStore.getState().setUser(updatedUser);
      setSuccess('Аватар успешно загружен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки аватара');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Удалить аватар?')) return;

    try {
      setIsLoading(true);
      await userService.deleteAvatar();
      const updatedUser = await userService.getCurrentUser();
      useAuthStore.getState().setUser(updatedUser);
      setSuccess('Аватар удален');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка удаления аватара');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const updatedUser = await userService.updateProfile(formData);
      useAuthStore.getState().setUser(updatedUser);
      setSuccess('Профиль обновлен');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    logout();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Вы уверены? Это действие необратимо!')) return;

    try {
      await userService.deleteAccount();
      logout();
      navigate('/auth');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка удаления аккаунта');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F1' }}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 font-inter font-medium hover:opacity-70 transition"
            style={{ color: '#6B705C' }}
          >
            <ArrowLeft size={20} />
            Назад к чатам
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 font-inter font-medium hover:opacity-70 transition"
            style={{ color: '#C79A8B' }}
          >
            <LogOut size={20} />
            Выйти
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-soft p-8"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-terracotta to-accent-olive flex items-center justify-center text-white text-4xl font-lora shadow-logo overflow-hidden"
                style={{
                  backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!user.avatar_url && user.username[0].toUpperCase()}
              </div>
              
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer hover:opacity-80 transition"
                style={{ backgroundColor: '#6B705C' }}
              >
                <Camera size={20} className="text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isLoading}
                />
              </label>

              {user.avatar_url && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  className="absolute bottom-0 left-0 p-2 rounded-full hover:opacity-80 transition"
                  style={{ backgroundColor: '#C79A8B' }}
                  disabled={isLoading}
                >
                  <Trash2 size={20} className="text-white" />
                </button>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-lora font-semibold" style={{ color: '#2C2C2C' }}>
              {user.username}
            </h1>
            <p className="font-inter text-sm" style={{ color: '#8B8B8B' }}>
              {user.email}
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-lora italic text-[15px] mb-2" style={{ color: '#8B8B8B' }}>
                  Имя для отображения
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl font-inter transition-all"
                  style={{
                    backgroundColor: isEditing ? '#F9F9F7' : '#EFEFEF',
                    color: '#2C2C2C',
                    border: '2px solid transparent',
                  }}
                />
              </div>

              <div>
                <label className="block font-lora italic text-[15px] mb-2" style={{ color: '#8B8B8B' }}>
                  Никнейм
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl font-inter transition-all"
                  style={{
                    backgroundColor: isEditing ? '#F9F9F7' : '#EFEFEF',
                    color: '#2C2C2C',
                    border: '2px solid transparent',
                  }}
                />
              </div>

              <div>
                <label className="block font-lora italic text-[15px] mb-2" style={{ color: '#8B8B8B' }}>
                  Дата рождения
                </label>
                <input
                  type="date"
                  value={formData.birth_day}
                  onChange={(e) => setFormData({ ...formData, birth_day: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl font-inter transition-all"
                  style={{
                    backgroundColor: isEditing ? '#F9F9F7' : '#EFEFEF',
                    color: '#2C2C2C',
                    border: '2px solid transparent',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block font-lora italic text-[15px] mb-2" style={{ color: '#8B8B8B' }}>
                О себе
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3 rounded-xl font-inter transition-all resize-none"
                style={{
                  backgroundColor: isEditing ? '#F9F9F7' : '#EFEFEF',
                  color: '#2C2C2C',
                  border: '2px solid transparent',
                }}
                placeholder="Расскажите о себе..."
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl text-sm font-inter"
                style={{
                  backgroundColor: 'rgba(199, 154, 139, 0.1)',
                  color: '#C79A8B',
                  border: '2px solid #C79A8B',
                }}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl text-sm font-inter"
                style={{
                  backgroundColor: 'rgba(107, 112, 92, 0.1)',
                  color: '#6B705C',
                  border: '2px solid #6B705C',
                }}
              >
                {success}
              </motion.div>
            )}

            <div className="flex gap-4">
              {!isEditing ? (
                <motion.button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundColor: '#6B705C', color: 'white' }}
                  className="flex-1 py-3 px-6 rounded-full font-inter font-semibold hover:shadow-lg transition-all"
                >
                  Редактировать профиль
                </motion.button>
              ) : (
                <>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.95 }}
                    style={{ backgroundColor: '#6B705C', color: 'white' }}
                    className="flex-1 py-3 px-6 rounded-full font-inter font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{ backgroundColor: '#8B8B8B', color: 'white' }}
                    className="flex-1 py-3 px-6 rounded-full font-inter font-semibold hover:shadow-lg transition-all"
                  >
                    Отмена
                  </motion.button>
                </>
              )}
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-8 pt-8 border-t" style={{ borderColor: '#E5E5E5' }}>
            <h3 className="font-lora font-semibold mb-4" style={{ color: '#C79A8B' }}>
              Опасная зона
            </h3>
            <motion.button
              onClick={handleDeleteAccount}
              whileTap={{ scale: 0.95 }}
              style={{ backgroundColor: '#C79A8B', color: 'white' }}
              className="py-3 px-6 rounded-full font-inter font-semibold hover:shadow-lg transition-all"
            >
              Удалить аккаунт
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
