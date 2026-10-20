import { useEffect, useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'scanms:sample-delivery-sandbox:v1';
const CHANGE_EVENT = 'scanms:sample-sandbox-change';
const DAY = 86400000;
const milestones = ['Chờ lấy hàng', 'Bưu tá đã lấy hàng tại kho Shop', 'Nhập kho trung chuyển', 'Shipper đang giao', 'Giao hàng thành công'];
type Trial = { step: number; times: string[]; receivedAt: string | null; videoUrl: string };

function readTrial(): Trial | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || !Number.isInteger(value.step) || value.step < 0 || value.step > 4 ||
      !Array.isArray(value.times) || value.times.length !== value.step + 1 ||
      !value.times.every((time: unknown) => typeof time === 'string' && Number.isFinite(Date.parse(time))) ||
      typeof value.videoUrl !== 'string' ||
      (value.step === 4 ? value.receivedAt !== value.times[4] : value.receivedAt !== null)) return null;
    return value;
  } catch { return null; }
}

/** Local development fixture only. Never writes sample records or calls shipping APIs. */
export default function SampleDeliverySandbox({ role }: { role: 'shop' | 'kol' }) {
  const [open, setOpen] = useState(false);
  const [trial, setTrial] = useState<Trial | null>(readTrial);
  const [video, setVideo] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => setTrial(readTrial());
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  const save = (next: Trial | null) => {
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
      setTrial(next);
      setError('');
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch { setError('Trình duyệt không cho lưu dữ liệu thử. Vui lòng cho phép bộ nhớ trang web.'); }
  };
  const start = () => { setVideo(''); save({ step: 0, times: [new Date().toISOString()], receivedAt: null, videoUrl: '' }); };
  const advance = () => {
    if (!trial || trial.step >= 4) return;
    const now = new Date().toISOString();
    const step = trial.step + 1;
    save({ ...trial, step, times: [...trial.times, now], receivedAt: step === 4 ? now : null });
  };
  const deadline = trial?.receivedAt ? new Date(Date.parse(trial.receivedAt) + 14 * DAY) : null;
  const format = (value: string | Date) => new Date(value).toLocaleString('vi-VN');
  const button = 'rounded-xl border border-[#EEDFC6] bg-white px-3 py-2 text-sm font-semibold text-[#1A1612] hover:bg-[#FBF5EB] disabled:opacity-50';

  return (
    <section className="rounded-2xl border border-[#EEDFC6] bg-white p-4 text-[#1A1612]" data-testid="sample-delivery-sandbox">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2 font-semibold"><FlaskConical size={18} className="text-[#B88E4F]" />Kiểm thử hàng mẫu</span>
        <span className="rounded-full bg-[#FBF5EB] px-3 py-1 text-xs font-semibold text-[#8C6226]">Dữ liệu kiểm thử · {open ? 'Thu gọn' : 'Mở'}</span>
      </button>
      {open && <div className="mt-4 space-y-4">
        <p className="text-sm text-[#7D715E]">Mẫu thử riêng trên trình duyệt này. Không gọi GHN, không điều bưu tá, không thay đổi đơn thật, hạn nộp thật hay số suất mẫu. Chỉ xuất hiện khi chạy bản phát triển.</p>
        {role === 'shop' && <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={start}>{trial ? 'Tạo lại mẫu kiểm thử' : 'Tạo mẫu kiểm thử'}</button>
          {trial && <button type="button" className={button} onClick={() => { save(null); setVideo(''); }}><span className="flex items-center gap-2"><RotateCcw size={14} />Xóa dữ liệu kiểm thử</span></button>}
        </div>}
        {!trial ? <p className="text-sm text-[#7D715E]">{role === 'shop' ? 'Bấm Tạo mẫu kiểm thử để bắt đầu.' : 'Chưa có mẫu thử. Mở tab Hàng mẫu bên Shop trên cùng trình duyệt và cùng địa chỉ web để tạo mẫu kiểm thử.'}</p> : <>
          <div className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-4">
            <p className="text-xs font-semibold text-[#8C6226]">DỮ LIỆU KIỂM THỬ · MẪU RIÊNG · KHÔNG PHẢI VẬN ĐƠN GHN</p>
            <h4 className="mt-2 font-bold">Sản phẩm mẫu kiểm thử</h4>
            <p className="mt-1 font-semibold" role="status">{trial.videoUrl ? 'Đã nộp video kiểm thử' : trial.receivedAt ? 'Đã nhận · chờ video' : milestones[trial.step]}</p>
            {trial.step === 3 && <p className="mt-2 text-sm text-[#7D715E]">Shipper mẫu: Nguyễn Văn Kiểm Thử · SĐT mẫu: 09xx xxx xxx (không liên hệ được)</p>}
            <ol className="mt-3 space-y-2 text-sm">
              {trial.times.map((time, index) => <li key={index} className="border-l-2 border-[#C59B58] pl-3"><span className="font-medium">{milestones[index]}</span><span className="block text-xs text-[#7D715E]">{format(time)}</span></li>)}
            </ol>
          </div>
          {role === 'shop' && trial.step < 4 && <button type="button" className="rounded-xl bg-[#C59B58] px-4 py-2.5 text-sm font-semibold text-[#1A1612] hover:bg-[#B88E4F]" onClick={advance}>Chuyển mốc thử: {milestones[trial.step + 1]}</button>}
          {deadline ? <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 text-sm">
            <p>Nhận hàng thử: <strong>{format(trial.receivedAt!)}</strong></p>
            <p>Hạn nộp video thử: <strong>{format(deadline)}</strong> (14 ngày)</p>
            {trial.videoUrl ? <p className="mt-3 break-all font-semibold">Đã lưu video kiểm thử: {trial.videoUrl}</p> : <form className="mt-3 space-y-2" onSubmit={event => {
              event.preventDefault();
              try { const url = new URL(video.trim()); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
              catch { setError('Nhập liên kết video hợp lệ bắt đầu bằng https:// hoặc http://.'); return; }
              save({ ...trial, videoUrl: video.trim() });
            }}>
              <label className="block font-medium" htmlFor={`sample-trial-video-${role}`}>Link Video Review kiểm thử</label>
              <input id={`sample-trial-video-${role}`} type="url" required value={video} onChange={event => setVideo(event.target.value)} placeholder="https://www.youtube.com/watch?v=video-thu" className="w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2" />
              <button type="submit" className={button}>Nộp Link Video Review thử</button>
              <p className="text-xs text-[#7D715E]">Chỉ lưu link thử tại trình duyệt; không gửi video cho Shop và không tạo hoa hồng.</p>
            </form>}
          </div> : <p className="text-sm text-[#7D715E]">Chưa mở nộp video và chưa bắt đầu 14 ngày. Shop cần chuyển đến mốc thử Giao hàng thành công.</p>}
          <p className="text-xs text-[#7D715E]">Mẫu thử cục bộ dùng chung, không gắn với Shop/KOL thật. Để xem bên KOL: mở Hợp tác & Nhận mẫu Shop → chọn Shop → Hàng mẫu → Kiểm thử hàng mẫu. Dùng cùng trình duyệt và cùng địa chỉ (không trộn localhost với 127.0.0.1). Đăng xuất/đổi vai trò vẫn giữ mẫu thử cho đến khi xóa.</p>
        </>}
        {error && <p role="alert" className="text-sm text-[#DC2626]">{error}</p>}
      </div>}
    </section>
  );
}
