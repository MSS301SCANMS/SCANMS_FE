import { useState, type FormEvent } from 'react';
import { authService } from '../services/auth.service';
import { scanmsService } from '../services/scanms.service';

export default function BackendProfilePage() {
  const current = authService.getCurrentUser();
  const [fullName, setFullName] = useState(current?.fullName || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      await scanmsService.updateProfile({ fullName: fullName.trim() });
      await authService.getMe(); setMessage('Đã cập nhật hồ sơ.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không lưu được hồ sơ.'); }
    finally { setBusy(false); }
  }
  return <section className="max-w-xl rounded-2xl bg-white p-6 border border-[#EAE4D7] space-y-5"><h1 className="text-2xl font-black">Hồ sơ của tôi</h1><p className="text-[#7D715E]">Email: {current?.email}</p><p className="text-sm text-[#7D715E]">Vai trò: {current?.roles.join(', ')}</p><form onSubmit={save} className="space-y-4"><label className="block text-sm font-bold">Họ tên<input required minLength={2} maxLength={150} value={fullName} onChange={event => setFullName(event.target.value)} className="block w-full p-3 border rounded-xl mt-2" /></label>{error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status" className="text-green-700">{message}</p>}<button disabled={busy} className="px-5 py-3 rounded-xl bg-[#B88E4F] text-white font-bold disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></form></section>;
}
