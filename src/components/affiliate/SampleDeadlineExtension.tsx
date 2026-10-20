import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarPlus, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';
import { getPendingSampleReport, type SampleModerationRequest } from '../../utils/sampleModeration';
import './SampleViolationAction.css';

export default function SampleDeadlineExtension({ request, onSuccess }: { request: SampleModerationRequest; onSuccess: () => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const current = request.revisionDeadlineAt || request.deadlineAt;
  if (!['RECEIVED', 'REVISION_REQUIRED', 'OVERDUE'].includes(request.status) || !current) return null;
  if (getPendingSampleReport(request)) return <span className="sample-violation-state">Gia hạn: đề nghị Admin xử lý báo cáo đang chờ</span>;
  const validDate = date && new Date(date).getTime() > Math.max(Date.now(), Date.parse(current));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !validDate || !reason.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/sample-requests/${request.id}/extend-deadline`, { deadlineAt: new Date(date).toISOString(), reason: reason.trim() });
      toast.success('Đã gia hạn và gửi thông báo cho KOL.');
      setOpen(false); setDate(''); setReason(''); onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gia hạn. Vui lòng tải lại và thử lại.');
    } finally { setSaving(false); }
  };
  return <>
    <button type="button" className="sample-violation-button" onClick={() => setOpen(true)}><CalendarPlus size={14} />Gia hạn nộp video</button>
    {open && createPortal(<div className="sample-violation-overlay" onKeyDown={event => { if (event.key === 'Escape' && !saving) setOpen(false); }}>
      <form className="sample-violation-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onSubmit={submit}>
        <header><span className="sample-violation-modal-icon"><CalendarPlus size={19} /></span><div><h2 id={`${id}-title`}>Gia hạn {request.revisionDeadlineAt ? 'sửa' : 'nộp'} video</h2><p>Mẫu #{request.id.slice(0, 8).toUpperCase()}</p></div><button type="button" aria-label="Đóng gia hạn" disabled={saving} onClick={() => setOpen(false)}><X size={18} /></button></header>
        <p className="sample-violation-explanation">Hạn hiện tại: {new Date(current).toLocaleString('vi-VN')}. Hạn mới phải muộn hơn hạn hiện tại và thời điểm bây giờ. Gia hạn được lưu lịch sử, thông báo cho KOL và không tự mở khóa quyền xin mẫu.</p>
        <label htmlFor={`${id}-date`}>Hạn mới <span>*</span></label>
        <input className="sample-deadline-input" id={`${id}-date`} type="datetime-local" required autoFocus value={date} onChange={event => setDate(event.target.value)} />
        {date && !validDate && <p className="sample-deadline-error">Chọn thời điểm muộn hơn hạn hiện tại và bây giờ.</p>}
        <label htmlFor={`${id}-reason`}>Lý do gia hạn <span>*</span></label>
        <textarea id={`${id}-reason`} required maxLength={500} rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Ghi lý do đã thống nhất với KOL…" />
        <small>{reason.length}/500 ký tự</small>
        <footer><button type="button" disabled={saving} onClick={() => setOpen(false)}>Hủy bỏ</button><button type="submit" disabled={saving || !validDate || !reason.trim()}>{saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Đang lưu…' : 'Xác nhận gia hạn'}</button></footer>
      </form>
    </div>, document.body)}
  </>;
}
