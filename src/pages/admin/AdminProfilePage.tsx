import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { Loader2, UserRound, ShieldCheck, Camera, LockKeyhole, Eye, EyeOff, Check, Mail, Phone, Save } from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { customerService } from '../../services/customer.service';
import { uploadService } from '../../services/upload.service';

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(authService.getCurrentUser);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const avatarInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const roleLabel = user?.role === 'SYSTEM_MANAGER' ? 'Vận hành & tuân thủ' : 'Ban quản trị tối cao';
  const busy = saving || uploading || loading || loadFailed;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setError('');
    authService.getMe().then(profile => {
      if (!active) return;
      if (!profile?.id) throw new Error('Không thể tải hồ sơ cá nhân.');
      setUser(profile);
      setFullName(profile.fullName || '');
      setPhone(profile.phoneNumber || '');
    }).catch(() => {
      if (active) { setLoadFailed(true); setError('Không thể tải hồ sơ. Vui lòng thử lại.'); }
    }).finally(() => { if (active) setLoading(false); });
    const sync = () => setUser(authService.getCurrentUser());
    window.addEventListener('auth-user-updated', sync);
    return () => { active = false; window.removeEventListener('auth-user-updated', sync); };
  }, [reload]);

  const dirty = fullName.trim() !== (user?.fullName || '') || phone.trim() !== (user?.phoneNumber || '');
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
    if (!fullName.trim()) { setError('Vui lòng nhập họ và tên.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const result = await customerService.updateProfile({ fullName: fullName.trim(), phoneNumber: phone.trim() });
      const savedUser = result?.user || result;
      if (!(savedUser?.userId || savedUser?.id)) throw new Error('Máy chủ chưa xác nhận cập nhật hồ sơ.');
      const updated = { ...(authService.getCurrentUser() || user), ...savedUser, id: savedUser.userId || savedUser.id } as UserProfile;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated); setFullName(updated.fullName); setPhone(updated.phoneNumber || '');
      window.dispatchEvent(new Event('auth-user-updated'));
      setSaved(true);
    } catch (err) { setError(getError(err, 'Không thể lưu hồ sơ. Vui lòng thử lại.')); }
    finally { setSaving(false); }
  }

  function getError(err: any, fallback: string) {
    const message = err?.response?.data?.message;
    return Array.isArray(message) ? message.join(' ') : message || err?.message || fallback;
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    setAvatarMessage(''); setAvatarError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setAvatarError('Chọn ảnh JPG, PNG hoặc WEBP, tối đa 5 MB.'); return;
    }
    setUploading(true);
    try {
      const url = await uploadService.uploadImage(file, 'scanms/avatars');
      await authService.updateAvatar(url);
      setUser(authService.getCurrentUser());
      setAvatarMessage('Đã cập nhật ảnh đại diện.');
    } catch (err) { setAvatarError(getError(err, 'Không thể cập nhật ảnh đại diện.')); }
    finally { setUploading(false); }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (changingPassword || busy) return;
    setPasswordError(''); setPasswordSaved(false);
    if (passwords.next.length < 6) { setPasswordError('Mật khẩu mới cần ít nhất 6 ký tự.'); return; }
    if (passwords.next !== passwords.confirm) { setPasswordError('Mật khẩu xác nhận chưa khớp.'); return; }
    if (passwords.next === passwords.current) { setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại.'); return; }
    setChangingPassword(true);
    try {
      await customerService.changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' }); setShowPasswords(false); setPasswordSaved(true);
    } catch (err) { setPasswordError(getError(err, 'Không thể đổi mật khẩu.')); }
    finally { setChangingPassword(false); }
  }

  return (
    <section className="w-full max-w-[1320px] mx-auto text-[#1A1612]" aria-label="Hồ sơ cá nhân">
      {loading ? <div className="flex items-center gap-2 p-6 text-xs text-[#7D715E]" role="status"><Loader2 size={18} className="animate-spin text-[#B88E4F]" /> Đang tải hồ sơ…</div> : (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-5 items-start">
          <aside className="flex flex-col items-center p-6 sm:p-7 border border-[#EAE4D7] rounded-2xl bg-white text-center shadow-2xs">
            <div className="relative w-20 h-20 mx-auto mb-3.5">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="Ảnh đại diện" className="w-20 h-20 rounded-full object-cover border border-[#EEDFC6] bg-[#FBF5EB]" /> : <span className="grid place-items-center w-20 h-20 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] text-2xl font-semibold">{user?.fullName?.charAt(0).toUpperCase() || 'A'}</span>}
              <button type="button" className="grid place-items-center absolute -bottom-0.5 -right-0.5 w-7 h-7 border border-[#EAE4D7] rounded-full bg-white text-[#B88E4F] hover:bg-[#FBF5EB] transition-colors cursor-pointer shadow-xs" onClick={() => avatarInput.current?.click()} disabled={busy} aria-label="Đổi ảnh đại diện">{uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}</button>
            </div>
            <h2 className="m-0 mb-1.5 text-base font-semibold text-[#1A1612] break-all">{user?.fullName || 'Tài khoản quản trị'}</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 border border-[#EEDFC6] rounded-md bg-[#FBF5EB] text-[#B88E4F] text-[11px] font-medium"><ShieldCheck size={12} /> {roleLabel}</span>
            <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadAvatar} />
            <button type="button" className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs font-medium hover:bg-[#FBF5EB] hover:text-[#1A1612] transition-colors cursor-pointer disabled:opacity-50" disabled={busy} onClick={() => avatarInput.current?.click()}>{uploading ? 'Đang tải ảnh…' : 'Đổi ảnh đại diện'}</button>
            <p className="m-0 mt-2 mb-5 text-[11px] text-[#7D715E]">JPG, PNG, WEBP · Tối đa 5 MB</p>
            {avatarError && <p className="text-xs text-red-600 mb-3" role="alert">{avatarError}</p>}
            {avatarMessage && <p className="text-xs text-[#059669] mb-3" role="status">{avatarMessage}</p>}
            <div className="w-full border-y border-[#EAE4D7] py-4 my-2 flex flex-col gap-2.5 text-left text-xs text-[#7D715E]">
              <div className="flex items-center gap-2"><Mail size={14} className="text-[#B88E4F] shrink-0" /><span className="truncate">{user?.email || 'Chưa cập nhật email'}</span></div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-[#B88E4F] shrink-0" /><span className="truncate">{user?.phoneNumber || 'Chưa cập nhật số điện thoại'}</span></div>
            </div>
            <div className="w-full flex items-start gap-2 pt-3 text-[11px] text-[#7D715E] leading-relaxed text-left"><LockKeyhole size={13} className="text-[#B88E4F] shrink-0 mt-0.5" /><p className="m-0">Email đăng nhập và vai trò được quản lý bởi hệ thống.</p></div>
          </aside>
          <div className="flex flex-col gap-4 min-w-0">
            <form onSubmit={save} className="flex flex-col p-5 sm:p-6 border border-[#EAE4D7] rounded-2xl bg-white shadow-2xs">
              <div className="flex items-center gap-2.5 mb-5"><span className="w-8 h-8 grid place-items-center shrink-0 border border-[#EAE4D7] rounded-lg text-[#B88E4F] bg-[#FBF5EB]"><UserRound size={16} /></span><div><h2 className="m-0 text-base font-semibold text-[#1A1612]">Thông tin cá nhân</h2><p className="m-0 mt-0.5 text-xs text-[#7D715E]">Cập nhật tên hiển thị và thông tin liên hệ.</p></div></div>
              {error && <p className="text-xs text-red-600 mb-3" role="alert">{error}</p>}
              {loadFailed && <button type="button" className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 mb-4 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs font-medium hover:bg-[#FBF5EB]" onClick={() => setReload(value => value + 1)}>Tải lại hồ sơ</button>}
              <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0 m-0 mb-6">
                <label className="block text-xs font-medium text-[#1A1612]">Họ và tên <span className="text-red-500">*</span><input name="fullName" autoComplete="name" required maxLength={150} value={fullName} onChange={event => { setFullName(event.target.value); setSaved(false); }} className="block w-full h-10 mt-1.5 px-3 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E4F]" /></label>
                <label className="block text-xs font-medium text-[#1A1612]">Số điện thoại<input name="phoneNumber" autoComplete="tel" type="tel" maxLength={20} placeholder="Nhập số điện thoại" value={phone} onChange={event => { setPhone(event.target.value); setSaved(false); }} className="block w-full h-10 mt-1.5 px-3 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E4F]" /></label>
                <label className="block text-xs font-medium text-[#1A1612]">Email đăng nhập<span className="inline-flex items-center gap-1 float-right text-[10px] text-[#7D715E] font-normal"><LockKeyhole size={10} /> Chỉ xem</span><input value={user?.email || ''} readOnly type="email" className="block w-full h-10 mt-1.5 px-3 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#7D715E] text-xs sm:text-sm cursor-not-allowed" /></label>
                <label className="block text-xs font-medium text-[#1A1612]">Vai trò tài khoản<span className="inline-flex items-center gap-1 float-right text-[10px] text-[#7D715E] font-normal"><LockKeyhole size={10} /> Chỉ xem</span><input value={roleLabel} readOnly className="block w-full h-10 mt-1.5 px-3 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#7D715E] text-xs sm:text-sm cursor-not-allowed" /></label>
              </fieldset>
              <footer className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-[#EAE4D7]">
                <span className="inline-flex items-center gap-1 text-xs text-[#7D715E]" role="status">{saved ? <><Check size={13} className="text-[#059669]" /> Đã lưu thông tin.</> : dirty ? 'Có thay đổi chưa lưu' : 'Thông tin đã được đồng bộ'}</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs font-semibold hover:bg-[#FAF8F5] hover:text-[#1A1612] transition-colors cursor-pointer disabled:opacity-50" disabled={busy || !dirty} onClick={() => { setFullName(user?.fullName || ''); setPhone(user?.phoneNumber || ''); setError(''); setSaved(false); }}>Hủy thay đổi</button>
                  <button type="submit" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-[#B88E4F] rounded-lg bg-[#C59B58] text-white text-xs font-semibold hover:bg-[#B88E4F] transition-colors cursor-pointer disabled:opacity-50 shadow-xs" disabled={busy || !dirty || !fullName.trim()}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
                </div>
              </footer>
            </form>
            <details className="border border-[#EAE4D7] rounded-2xl bg-white shadow-2xs group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none hover:bg-[#FAF8F5]/50 transition-colors">
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 grid place-items-center shrink-0 border border-[#EAE4D7] rounded-lg text-[#B88E4F] bg-[#FBF5EB]"><LockKeyhole size={16} /></span>
                  <div><strong className="block text-sm font-semibold text-[#1A1612]">Bảo mật tài khoản</strong><small className="block text-[11px] text-[#7D715E]">Đổi mật khẩu đăng nhập</small></div>
                </span>
                <span className="text-xs font-medium text-[#B88E4F] group-open:rotate-90 transition-transform">Đổi mật khẩu ›</span>
              </summary>
              <form onSubmit={changePassword} className="border-t border-[#EAE4D7] p-5">
                <fieldset disabled={changingPassword || busy} className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-0 p-0 m-0 mb-3">
                  {(['current', 'next', 'confirm'] as const).map(key => (
                    <label key={key} className="block text-xs font-medium text-[#1A1612]">
                      {key === 'current' ? 'Mật khẩu hiện tại' : key === 'next' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu mới'}
                      <input name={key + 'Password'} type={showPasswords ? 'text' : 'password'} autoComplete={key === 'current' ? 'current-password' : 'new-password'} required minLength={key === 'current' ? undefined : 6} value={passwords[key]} onChange={event => { setPasswords(previous => ({ ...previous, [key]: event.target.value })); setPasswordSaved(false); }} className="block w-full h-10 mt-1.5 px-3 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E4F]" />
                    </label>
                  ))}
                </fieldset>
                <div className="flex items-center justify-between gap-2 mb-3 text-xs text-[#7D715E]">
                  <span>Ít nhất 6 ký tự.</span>
                  <button type="button" className="inline-flex items-center gap-1 text-xs text-[#7D715E] hover:text-[#1A1612] cursor-pointer" aria-pressed={showPasswords} onClick={() => setShowPasswords(value => !value)}>{showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}{showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button>
                </div>
                {passwordError && <p className="text-xs text-red-600 mb-3" role="alert">{passwordError}</p>}
                {passwordSaved && <p className="inline-flex items-center gap-1 text-xs text-[#059669] mb-3" role="status"><Check size={13} /> Đã đổi mật khẩu thành công.</p>}
                <button type="submit" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-[#B88E4F] rounded-lg bg-[#C59B58] text-white text-xs font-semibold hover:bg-[#B88E4F] transition-colors cursor-pointer disabled:opacity-50 shadow-xs" disabled={changingPassword || busy || !passwords.current || !passwords.next || !passwords.confirm}>{changingPassword && <Loader2 size={14} className="animate-spin" />}{changingPassword ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}</button>
              </form>
            </details>
          </div>
        </div>
      )}
    </section>
  );
}
