import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateUserName, updateUserEmail, updateOwnPassword } from '@/api/usersApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AdminProfile = () => {
  const { userId, fullName, role, email, setAuth, token } = useAuthStore();

  // Sectiunea de informatii generale
  const [nameValue, setNameValue] = useState(fullName ?? '');
  const [emailValue, setEmailValue] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Sectiunea de schimbare parola
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);

  const handleUpdateInfo = async () => {
    if (!userId) return;
    try {
      setInfoLoading(true);
      setInfoError(null);
      setInfoSuccess(false);

      // Actualizeaza numele doar daca s-a modificat
      if (nameValue !== fullName) {
        await updateUserName(userId, nameValue);
      }

      // Actualizeaza emailul doar daca a fost completat
      if (emailValue.trim() !== '') {
        await updateUserEmail(userId, emailValue);
      }

     // Actualizeaza store-ul cu noul nume si emailul curent
if (token && role && userId) {
  setAuth({
    token,
    userId,
    role,
    fullName: nameValue,
    email: emailValue.trim() !== '' ? emailValue : (email ?? ''),
  });
}

      setInfoSuccess(true);
      setEmailValue('');
    } catch {
      setInfoError('Failed to update profile.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!userId) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(false);
      await updateOwnPassword(userId, oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Current password is incorrect.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Header */}
      <div className="space-y-1">
        <h1
          className="text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          My Profile
        </h1>
        <p className="text-gray-400 text-sm">
          Manage your account information
        </p>
      </div>

      {/* Card informatii cont */}
      <div
        className="bg-white rounded-2xl p-8 space-y-6"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
      >
        {/* Avatar si rol */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: '#e85d04' }}
          >
            {fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {fullName}
            </p>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ background: '#fff7f0', color: '#e85d04' }}
            >
              {role}
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f3f4f6' }} className="pt-6 space-y-4">
          <h2
            className="text-lg font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Account Information
          </h2>

          {/* Camp nume */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Full Name
            </label>
            <Input
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
            />
          </div>

          {/* Email curent — doar afisare */}
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
    Current Email Address
  </label>
  <Input
    className="h-11 rounded-xl border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
    value={email ?? ''}
    readOnly
  />
</div>

{/* Email nou — editabil */}
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
    New Email Address
  </label>
  <Input
    type="email"
    placeholder="Leave blank to keep current email"
    className="h-11 rounded-xl border-gray-200 bg-gray-50"
    value={emailValue}
    onChange={(e) => setEmailValue(e.target.value)}
  />
</div>

          {infoError && <p className="text-xs text-red-500">{infoError}</p>}
          {infoSuccess && (
            <p className="text-xs" style={{ color: '#15803d' }}>
              Profile updated successfully.
            </p>
          )}

          <Button
            onClick={handleUpdateInfo}
            disabled={infoLoading}
            className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#e85d04' }}
          >
            {infoLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Card schimbare parola */}
      <div
        className="bg-white rounded-2xl p-8 space-y-6"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
      >
        <h2
          className="text-lg font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Change Password
        </h2>

        <div className="space-y-1.5">
  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
    Current Password
  </label>
  <div className="relative">
    <Input
      type={showOldPassword ? 'text' : 'password'}
      placeholder="Current password"
      className="h-11 rounded-xl border-gray-200 bg-gray-50 pr-12"
      value={oldPassword}
      onChange={(e) => setOldPassword(e.target.value)}
    />
    <button
      type="button"
      onClick={() => setShowOldPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
      style={{ color: '#9ca3af' }}
    >
      {showOldPassword ? 'Hide' : 'Show'}
    </button>
  </div>


          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              New Password
            </label>
            <Input
              type="password"
              placeholder="New password"
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="Confirm new password"
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          {passwordSuccess && (
            <p className="text-xs" style={{ color: '#15803d' }}>
              Password changed successfully.
            </p>
          )}

          <Button
            onClick={handleUpdatePassword}
            disabled={passwordLoading}
            className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#e85d04' }}
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </div>

    </div>
  );
};

export default AdminProfile;