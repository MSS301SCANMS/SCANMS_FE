import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, User, Camera, Loader2 } from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { customerService } from '../../services/customer.service';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';
import { Select } from '../../components/ui/Select';

export default function CreatorAccountDetails() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [nameInput, setNameInput] = useState(() => currentUser?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(() => currentUser?.phoneNumber || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // KOL profile metadata (Gender & Date of birth)
  const metaKey = `scanms_kol_meta_${currentUser?.id || 'kol'}`;
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>(() => {
    try {
      const saved = localStorage.getItem(metaKey);
      if (saved) return JSON.parse(saved).gender || 'MALE';
    } catch {}
    return 'MALE';
  });

  const [birthDay, setBirthDay] = useState(() => {
    try {
      const saved = localStorage.getItem(metaKey);
      if (saved) return JSON.parse(saved).birthDay || '02';
    } catch {}
    return '02';
  });

  const [birthMonth, setBirthMonth] = useState(() => {
    try {
      const saved = localStorage.getItem(metaKey);
      if (saved) return JSON.parse(saved).birthMonth || '01';
    } catch {}
    return '01';
  });

  const [birthYear, setBirthYear] = useState(() => {
    try {
      const saved = localStorage.getItem(metaKey);
      if (saved) return JSON.parse(saved).birthYear || '2000';
    } catch {}
    return '2000';
  });

  // Sync latest user profile on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const profile = await customerService.getProfile();
        if (isMounted && profile?.user) {
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
      });

      // Persist gender and birth date in localStorage
      localStorage.setItem(
        metaKey,
        JSON.stringify({ gender, birthDay, birthMonth, birthYear })
      );

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
    <div className="bg-white border border-[#EAE4D7] rounded-xl p-6 sm:p-8 shadow-2xs text-left">
      {/* Header */}
      <div className="pb-4 border-b border-[#EAE4D7]">
        <h1 className="text-xl font-bold text-[#1A1612] m-0 font-display">
          Hồ Sơ Của Tôi
        </h1>
        <p className="text-xs text-[#7D715E] mt-1 m-0">
          Quản lý thông tin hồ sơ để bảo mật tài khoản
        </p>
      </div>

      {/* Form & Avatar Body */}
      <div className="pt-6 flex flex-col-reverse md:flex-row items-start gap-8 lg:gap-12">
        {/* Left Column: Form Fields (SCANMS Style - Image 1) */}
        <form onSubmit={handleUpdateProfile} className="flex-1 w-full space-y-5">
          {/* 1. Tên đăng nhập */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
              Tên đăng nhập
            </label>
            <div className="flex-1">
              <span className="text-xs sm:text-sm text-[#1A1612] font-semibold">
                {username}
              </span>
              <p className="text-[11px] text-[#A89D8E] mt-0.5 m-0">
                Tên đăng nhập chỉ có thể thay đổi một lần.
              </p>
            </div>
          </div>

          {/* 2. Tên */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
              Tên
            </label>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                placeholder="Nhập họ và tên"
                className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58] rounded-md px-3.5 py-2 text-xs sm:text-sm text-[#1A1612] outline-none transition"
              />
            </div>
          </div>

          {/* 3. Email */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
              Email
            </label>
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs sm:text-sm text-[#1A1612]">
                {maskEmail(currentUser?.email)}
              </span>
              <button
                type="button"
                onClick={() => toast.info('Email đã được bảo mật theo chuẩn định danh')}
                className="text-xs text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
              >
                Thay Đổi
              </button>
            </div>
          </div>

          {/* 4. Số điện thoại */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
              Số điện thoại
            </label>
            <div className="flex-1">
              {isEditingPhone ? (
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0912345678"
                    className="w-full bg-white border border-[#C59B58] rounded-md px-3 py-1.5 text-xs text-[#1A1612] outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className="px-2.5 py-1.5 rounded bg-[#FAF5EB] text-xs font-semibold text-[#8C6226] border border-[#EEDFC6] hover:bg-[#C59B58] hover:text-white transition cursor-pointer shrink-0"
                  >
                    Xong
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm text-[#1A1612]">
                    {phoneInput ? maskPhone(phoneInput) : 'Chưa cập nhật'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                  >
                    Thay Đổi
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5. Giới tính */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0 flex items-center sm:justify-end gap-1">
              <span>Giới tính</span>
              <HelpCircle className="w-3 h-3 text-[#A89D8E]" />
            </label>
            <div className="flex items-center gap-5 text-xs sm:text-sm text-[#1A1612]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'MALE'}
                  onChange={() => setGender('MALE')}
                  className="accent-[#C59B58] w-4 h-4 cursor-pointer"
                />
                <span>Nam</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'FEMALE'}
                  onChange={() => setGender('FEMALE')}
                  className="accent-[#C59B58] w-4 h-4 cursor-pointer"
                />
                <span>Nữ</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'OTHER'}
                  onChange={() => setGender('OTHER')}
                  className="accent-[#C59B58] w-4 h-4 cursor-pointer"
                />
                <span>Khác</span>
              </label>
            </div>
          </div>

          {/* 6. Ngày sinh */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0 flex items-center sm:justify-end gap-1">
              <span>Ngày sinh</span>
              <HelpCircle className="w-3 h-3 text-[#A89D8E]" />
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-28 text-xs font-semibold"
              >
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                  <option key={d} value={d}>
                    Ngày {d}
                  </option>
                ))}
              </Select>
              <Select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-28 text-xs font-semibold"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </Select>
              <Select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-28 text-xs font-semibold"
              >
                {Array.from({ length: 70 }, (_, i) => String(2015 - i)).map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* 7. Nút Lưu (SCANMS Style) */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pt-3">
            <div className="sm:w-32 shrink-0" />
            <button
              type="submit"
              disabled={updatingProfile}
              className="px-8 py-2.5 rounded-md bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs flex items-center justify-center gap-2 self-start"
            >
              {updatingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Lưu</span>
            </button>
          </div>
        </form>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px bg-[#EAE4D7] self-stretch mx-2" />

        {/* Right Column: Avatar Upload (SCANMS Style - Image 1) */}
        <div className="w-full md:w-64 flex flex-col items-center justify-center py-4 px-2">
          <div className="relative group">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="w-28 h-28 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] overflow-hidden flex items-center justify-center relative shadow-xs cursor-pointer group hover:border-[#C59B58] transition"
              title="Bấm để chọn ảnh đại diện mới"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-8 h-8 text-[#B88E4F] animate-spin" />
              ) : currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-[#A89D8E]" />
              )}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-5 h-5 text-white drop-shadow" />
                <span className="text-[10px] font-bold mt-1">Đổi ảnh</span>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="mt-4 px-5 py-2 rounded-md border border-[#EAE4D7] hover:border-[#C59B58] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#1A1612] hover:text-[#C59B58] transition cursor-pointer shadow-2xs"
          >
            {uploadingAvatar ? 'Đang tải...' : 'Chọn Ảnh'}
          </button>

          <div className="mt-3 text-center text-[11px] text-[#7D715E] leading-relaxed space-y-0.5">
            <p className="m-0">Dụng lượng file tối đa 1 MB</p>
            <p className="m-0">Định dạng:.JPEG, .PNG</p>
          </div>

          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarFileSelected}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
