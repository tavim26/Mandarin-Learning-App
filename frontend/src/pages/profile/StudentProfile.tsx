import { useStudentProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChangePasswordCard from '@/components/ChangePasswordCard';

const StudentProfile = () => {
  const {
    nameValue, setNameValue,
    emailValue, setEmailValue,
    nicknameValue, setNicknameValue,
    studentStats,
    infoLoading, infoError, infoSuccess,
    saveInfo,
    fullName, role, email, userId,
  } = useStudentProfile();

  return (
    <div className="space-y-8 max-w-2xl">

      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          My Profile
        </h1>
        <p className="text-gray-400 text-sm">Manage your account information</p>
      </div>

      <div className="bg-white rounded-2xl p-8 space-y-6" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: '#e85d04' }}
          >
            {fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {fullName}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: '#f0fdf4', color: '#15803d' }}>
                {role}
              </span>
              {studentStats !== null && (
                <>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: '#fff7f0', color: '#e85d04' }}>
                    Level {studentStats.level}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: '#fff7f0', color: '#e85d04' }}>
                    {studentStats.xpTotal} XP
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f3f4f6' }} className="pt-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Account Information
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nickname</label>
            <Input
              placeholder="Your display nickname"
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={nicknameValue}
              onChange={(e) => setNicknameValue(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Email Address</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" value={email ?? ''} readOnly />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Email Address</label>
            <Input
              type="email"
              placeholder="Leave blank to keep current email"
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
            />
          </div>

          {infoError && <p className="text-xs text-red-500">{infoError}</p>}
          {infoSuccess && <p className="text-xs" style={{ color: '#15803d' }}>Profile updated successfully.</p>}

          <Button
            onClick={saveInfo}
            disabled={infoLoading}
            className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#e85d04' }}
          >
            {infoLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <ChangePasswordCard userId={userId} />
    </div>
  );
};

export default StudentProfile;