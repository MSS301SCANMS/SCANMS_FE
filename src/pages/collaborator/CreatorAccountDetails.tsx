import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Loader2, Save, ShieldCheck } from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { customerService } from '../../services/customer.service';
import { uploadService } from '../../services/upload.service';
import { Select } from '../../components/ui/Select';
import { toast } from '../../utils/toast';

export default function CreatorAccountDetails() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [nameInput, setNameInput] = useState(() => currentUser?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(() => currentUser?.phoneNumber || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('OTHER');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  // Sync latest user profile on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const profile = await customerService.getProfile();
        if (isMounted && profile?.user) {
          if (profile.user.gender) setGender(profile.user.gender);
          if (profile.user.dateOfBirth) {
            const [year, month, day] = profile.user.dateOfBirth.split('-');
            setBirthDay(day); setBirthMonth(month); setBirthYear(year);
          }
          if (profile.user.fullName) setNameInput(profile.user.fullName);
          if (profile.user.phoneNumber) setPhoneInput(profile.user.phoneNumber);
        }
      } catch {
        // Fallback to authService user
        const u = authService.getCurrentUser();
        if (isMounted && u) {
          setNameInput(u.fullName || '');
          setPhoneInput(u.phoneNumber || '');
        }
      }
    };
    loadProfile();

    const handleUserSync = () => {
      const u = authService.getCurrentUser();
      setCurrentUser(u);
      if (u?.fullName) setNameInput(u.fullName);
      if (u?.phoneNumber) setPhoneInput(u.phoneNumber);
    };

    window.addEventListener('auth-user-updated', handleUserSync);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-user-updated', handleUserSync);
    };
  }, []);

  // Masking helpers matching SCANMS Profile Image 1
  const maskEmail = (email?: string) => {
    if (!email) return 'chua-co-email@scanms.vn';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const visible = name.slice(0, 2);
    return `${visible}***********@${parts[1]}`;
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return 'Chưa cập nhật';
    const clean = phone.trim();
    if (clean.length < 4) return clean;
    const last2 = clean.slice(-2);
    return `*********${last2}`;
  };

  const username =
    currentUser?.email?.split('@')[0] ||
    'kol_creator';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await customerService.updateProfile({
        fullName: nameInput.trim(),
        phoneNumber: phoneInput.trim(),
        gender,
        ...(birthDay && birthMonth && birthYear ? { dateOfBirth: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}` } : {}),
      });

      // Refresh auth session
      await authService.getMe();
      window.dispatchEvent(new Event('auth-user-updated'));
      toast.success('Cập nhật thông tin hồ sơ KOL thành công!');
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      toast.error(err?.response?.data?.message || 'Không thể cập nhật thông tin hồ sơ');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (.JPEG, .PNG, .WEBP)');
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Dung lượng file tối đa là 1 MB theo quy định hồ sơ');
      return;
    }

    try {
      setUploadingAvatar(true);
      const secureUrl = await uploadService.uploadImage(file, 'scanms/avatars');
      await authService.updateAvatar(secureUrl);
      await customerService.updateProfile({ avatarUrl: secureUrl });
      await authService.getMe();
      window.dispatchEvent(new Event('auth-user-updated'));
      toast.success('Cập nhật ảnh đại diện KOL thành công!');
    } catch (error: any) {
      console.error('Lỗi khi tải ảnh đại diện:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Không thể tải ảnh đại diện lên');
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <section className="bg-white border border-[#EAE4D7] rounded-xl text-[#1A1612] shadow-sm overflow-hidden text-left" aria-labelledby="creator-account-title">
      <header className="flex items-center gap-2.5 p-4 sm:px-5 border-b border-[#EAE4D7]">
        <span className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-lg bg-[#FBF5EB] text-[#B88E4F]"><User size={18} /></span>
        <div>
          <h1 id="creator-account-title" className="text-base sm:text-lg font-semibold text-[#1A1612] tracking-tight">Hồ sơ của tôi</h1>
          <p className="text-xs text-[#7D715E] mt-0.5">Cập nhật thông tin cá nhân và ảnh đại diện của bạn.</p>
        </div>
      </header>

      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_225px] gap-6 items-start">
        <form onSubmit={handleUpdateProfile} className="min-w-0" id="creator-account-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-start">
            <div className="min-w-0 border-0 p-0 m-0">
              <span className="block mb-1.5 text-xs font-medium text-[#7D715E]">Tên đăng nhập</span>
              <div className="flex items-center min-h-[38px] px-3 py-2 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-xs font-medium text-[#1A1612] break-all">{username}</div>
              <p className="mt-1.5 text-[10px] text-[#7D715E]">Tên đăng nhập chỉ có thể thay đổi một lần.</p>
            </div>
            <div className="min-w-0 border-0 p-0 m-0">
              <label htmlFor="creator-account-name" className="block mb-1.5 text-xs font-medium text-[#7D715E]">Họ và tên</label>
              <input
                id="creator-account-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                autoComplete="name"
                placeholder="Nhập họ và tên"
                className="w-full min-w-0 h-[38px] px-3 py-2 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs transition-colors focus:border-[#C59B58] focus:outline-none focus:ring-2 focus:ring-[#C59B58]/20 placeholder:text-[#A89D8E]"
              />
            </div>
            <div className="min-w-0 border-0 p-0 m-0">
              <span className="block mb-1.5 text-xs font-medium text-[#7D715E]">Email</span>
              <div className="flex items-center justify-between gap-2.5 min-h-[38px] pl-3 pr-1.5 py-1 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5]">
                <span className="flex-1 min-w-0 text-xs font-medium text-[#1A1612] break-all">{maskEmail(currentUser?.email)}</span>
                <button
                  type="button"
                  onClick={() => toast.info('Email đã được bảo mật theo chuẩn định danh')}
                  className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-2 py-1 border border-[#EAE4D7] rounded-md bg-white text-[#7D715E] text-[11px] font-medium hover:bg-[#FBF5EB] hover:border-[#EEDFC6] hover:text-[#1A1612] transition-colors"
                >
                  <ShieldCheck size={13} className="text-[#B88E4F]" /> Bảo mật
                </button>
              </div>
            </div>
            <div className="min-w-0 border-0 p-0 m-0">
              <label htmlFor={isEditingPhone ? 'creator-account-phone' : undefined} className="block mb-1.5 text-xs font-medium text-[#7D715E]">Số điện thoại</label>
              {isEditingPhone ? (
                <div className="flex items-center gap-1.5">
                  <input
                    id="creator-account-phone"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0912345678"
                    autoComplete="tel"
                    autoFocus
                    className="flex-1 min-w-0 h-[38px] px-3 py-2 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs transition-colors focus:border-[#C59B58] focus:outline-none focus:ring-2 focus:ring-[#C59B58]/20 placeholder:text-[#A89D8E]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className="inline-flex items-center justify-center shrink-0 h-[38px] px-3 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-xs font-medium hover:bg-[#FAF8F5] transition-colors"
                  >
                    Xong
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2.5 min-h-[38px] pl-3 pr-1.5 py-1 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5]">
                  <span className="flex-1 min-w-0 text-xs font-medium text-[#1A1612] break-all">{phoneInput ? maskPhone(phoneInput) : 'Chưa cập nhật'}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-2 py-1 border border-[#EAE4D7] rounded-md bg-white text-[#7D715E] text-[11px] font-medium hover:bg-[#FBF5EB] hover:border-[#EEDFC6] hover:text-[#1A1612] transition-colors"
                  >
                    Thay đổi
                  </button>
                </div>
              )}
            </div>
            <fieldset className="min-w-0 border-0 p-0 m-0">
              <legend className="block mb-1.5 text-xs font-medium text-[#7D715E]">Giới tính</legend>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['MALE', 'Nam'], ['FEMALE', 'Nữ'], ['OTHER', 'Khác'],
                ] as const).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center justify-center gap-2 min-h-[38px] p-2 border rounded-lg text-xs cursor-pointer transition-colors border-[#EAE4D7] text-[#7D715E] hover:border-[#C59B58]/50 has-[:checked]:bg-[#FBF5EB] has-[:checked]:border-[#EEDFC6] has-[:checked]:text-[#1A1612] has-[:checked]:font-medium"
                  >
                    <input type="radio" name="gender" value={value} checked={gender === value} onChange={() => setGender(value)} className="w-3.5 h-3.5 accent-[#C59B58] cursor-pointer" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0 border-0 p-0 m-0">
              <legend className="block mb-1.5 text-xs font-medium text-[#7D715E]">Ngày sinh</legend>
              <div className="grid grid-cols-3 gap-2">
                <Select aria-label="Ngày sinh" value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                    <option key={d} value={d}>Ngày {d}</option>
                  ))}
                </Select>
                <Select aria-label="Tháng sinh" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </Select>
                <Select aria-label="Năm sinh" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                  {Array.from({ length: 70 }, (_, i) => String(2015 - i)).map((y) => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </Select>
              </div>
            </fieldset>
          </div>
        </form>

        <aside className="flex flex-col items-center justify-center gap-3 p-4 border border-[#EAE4D7] rounded-xl bg-[#FAF8F5]" aria-label="Ảnh đại diện">
          <h2 className="text-xs font-medium text-[#7D715E]">Ảnh đại diện</h2>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative grid place-items-center shrink-0 w-[86px] h-[86px] border border-[#EAE4D7] rounded-full bg-white text-[#B88E4F] hover:border-[#C59B58] transition-colors overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Chọn ảnh đại diện mới"
          >
            {uploadingAvatar ? <Loader2 className="animate-spin" size={24} /> : currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Ảnh đại diện của bạn" className="w-full h-full object-cover rounded-full" />
            ) : <User size={36} />}
            {!uploadingAvatar && (
              <span className="absolute right-0.5 bottom-0.5 grid place-items-center w-6 h-6 border border-[#EEDFC6] rounded-full bg-[#FBF5EB] text-[#B88E4F] shadow-sm">
                <Camera size={13} />
              </span>
            )}
          </button>
          <div className="flex flex-col items-center gap-1.5">
            <button
              className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-3 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs font-medium hover:bg-[#FBF5EB] hover:border-[#C59B58] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <Camera size={14} className="text-[#B88E4F]" /> {uploadingAvatar ? 'Đang tải...' : 'Chọn ảnh'}
            </button>
            <p className="text-[10px] text-[#7D715E] text-center">JPEG, PNG, WEBP · Tối đa 1 MB</p>
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarFileSelected}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            aria-label="Tải ảnh đại diện"
          />
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-5 border-t border-[#EAE4D7] bg-[#FAF8F5]/50">
        <span className="flex items-center gap-1.5 text-xs text-[#7D715E]">
          <ShieldCheck size={14} className="text-[#B88E4F] shrink-0" /> Thông tin liên hệ được ẩn để bảo vệ tài khoản.
        </span>
        <button
          type="submit"
          form="creator-account-form"
          disabled={updatingProfile}
          className="inline-flex items-center justify-center gap-2 min-h-[36px] px-5 border border-[#EEDFC6] rounded-lg bg-[#C59B58] text-white text-xs font-medium hover:bg-[#B88E4F] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {updatingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {updatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </footer>
    </section>
  );
}
