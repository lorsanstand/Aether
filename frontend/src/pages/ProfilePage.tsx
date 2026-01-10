import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Trash2, LogOut, ArrowLeft, Settings, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';
import type { UserUpdate } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import miniLogo from '../assets/mini-logo.png';
import VerificationBanner from '../components/common/VerificationBanner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Пароль должен быть минимум 8 символов');
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword(oldPassword, newPassword);
      setPasswordSuccess('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Ошибка изменения пароля');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 font-inter font-medium hover:opacity-70 transition"
            style={{ color: 'var(--accent-primary)' }}
          >
            <ArrowLeft size={20} />
            Назад к чатам
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 font-inter font-medium hover:opacity-70 transition"
              style={{ color: 'var(--text-secondary)' }}
              title="Настройки"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 font-inter font-medium hover:opacity-70 transition"
              style={{ color: 'var(--error-color)' }}
            >
              <LogOut size={20} />
              Выйти
            </button>
          </div>
        </div>

        {/* Verification Banner */}
        {!user.is_verified && (
          <VerificationBanner userEmail={user.email} />
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl shadow-soft p-8"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div
                className="w-32 h-32 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: user.avatar_url ? '50%' : '0',
                }}
              >
                {!user.avatar_url && (
                  <img src={miniLogo} alt="Avatar" className="w-full h-full object-contain" />
                )}
              </div>
              
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer hover:opacity-80 transition"
                style={{ backgroundColor: 'var(--accent-primary)' }}
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
                  style={{ backgroundColor: 'var(--error-color)' }}
                  disabled={isLoading}
                >
                  <Trash2 size={20} className="text-white" />
                </button>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-lora font-semibold" style={{ color: 'var(--text-primary)' }}>
              {user.username}
            </h1>
            <p className="font-inter text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user.email}
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Имя для отображения
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl font-inter transition-all"
                  style={{
                    backgroundColor: isEditing ? 'var(--bg-input)' : 'var(--bg-input-disabled)',
                    color: 'var(--text-primary)',
                    border: '2px solid transparent',
                  }}
                />
              </div>

              <div>
                <label className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Никнейм
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl font-inter transition-all"
                  style={{
                    backgroundColor: isEditing ? 'var(--bg-input)' : 'var(--bg-input-disabled)',
                    color: 'var(--text-primary)',
                    border: '2px solid transparent',
                  }}
                />
              </div>

              <div>
                <label className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Дата рождения
                </label>
                <input
                  type="date"
                  value={formData.birth_day}
                  onChange={(e) => setFormData({ ...formData, birth_day: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl font-inter transition-all"
                  style={{
                    backgroundColor: isEditing ? 'var(--bg-input)' : 'var(--bg-input-disabled)',
                    color: 'var(--text-primary)',
                    border: '2px solid transparent',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                О себе
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3 rounded-xl font-inter transition-all resize-none"
                style={{
                  backgroundColor: isEditing ? 'var(--bg-input)' : 'var(--bg-input-disabled)',
                  color: 'var(--text-primary)',
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
                  backgroundColor: 'var(--error-soft)',
                  color: 'var(--error-color)',
                  border: '2px solid var(--error-color)',
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
                  backgroundColor: 'var(--accent-primary-soft)',
                  color: 'var(--accent-primary)',
                  border: '2px solid var(--accent-primary)',
                }}
              >
                {success}
              </motion.div>
            )}

            <div className="flex gap-4">
              {!isEditing ? (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditing(true);
                  }}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
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
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                    className="flex-1 py-3 px-6 rounded-full font-inter font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(false);
                      setError('');
                      // Восстанавливаем оригинальные данные при отмене
                      if (user) {
                        setFormData({
                          display_name: user.display_name || '',
                          username: user.username,
                          description: user.description || '',
                          birth_day: user.birth_day || '',
                        });
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{ backgroundColor: 'var(--text-secondary)', color: 'white' }}
                    className="flex-1 py-3 px-6 rounded-full font-inter font-semibold hover:shadow-lg transition-all"
                  >
                    Отмена
                  </motion.button>
                </>
              )}
            </div>
          </form>

          {/* Password Change Section */}
          <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-lora font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Безопасность
            </h3>

            {!isChangingPassword ? (
              <motion.button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                whileTap={{ scale: 0.95 }}
                className="py-3 px-6 rounded-full font-inter font-semibold transition hover:shadow-lg"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--accent-primary)' }}
              >
                Изменить пароль
              </motion.button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Старый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl font-inter transition-all"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '2px solid transparent',
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      className="w-full px-4 py-3 pr-12 rounded-xl font-inter transition-all"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '2px solid transparent',
                      }}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-lora italic text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Подтвердите новый пароль
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите новый пароль"
                    className="w-full px-4 py-3 rounded-xl font-inter transition-all"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '2px solid transparent',
                    }}
                    required
                  />
                </div>

                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl text-sm font-inter"
                    style={{
                      backgroundColor: 'var(--error-soft)',
                      color: 'var(--error-color)',
                      border: '2px solid var(--error-color)',
                    }}
                  >
                    {passwordError}
                  </motion.div>
                )}

                {passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl text-sm font-inter"
                    style={{
                      backgroundColor: 'var(--accent-primary-soft)',
                      color: 'var(--accent-primary)',
                      border: '2px solid var(--accent-primary)',
                    }}
                  >
                    {passwordSuccess}
                  </motion.div>
                )}

                <div className="flex gap-4">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 px-6 rounded-full font-inter font-semibold transition hover:shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                  >
                    {isLoading ? 'Сохранение...' : 'Изменить пароль'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 px-6 rounded-full font-inter font-semibold transition hover:shadow-lg"
                    style={{ backgroundColor: 'var(--text-secondary)', color: 'white' }}
                  >
                    Отмена
                  </motion.button>
                </div>
              </form>
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-lora font-semibold mb-4" style={{ color: 'var(--error-color)' }}>
              Опасная зона
            </h3>
            <motion.button
              onClick={handleDeleteAccount}
              whileTap={{ scale: 0.95 }}
              style={{ backgroundColor: 'var(--error-color)', color: 'white' }}
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
