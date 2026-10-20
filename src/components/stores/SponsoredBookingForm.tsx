import { useState, type FormEventHandler } from 'react';
import { ArrowRight, CalendarDays, Check, Megaphone, MousePointer2, Store } from 'lucide-react';
import { Button } from '../ui/Button';
import './SponsoredBookingForm.css';
import { SponsorshipDateTimePicker } from './SponsorshipDateTimePicker';

export const sponsorshipMoney = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;
type Pricing = { dailyRate: number; billingHours: number; minHours: number; maxDays: number };

export function SponsoredBookingForm({ pricing, pending, onSubmit, renewal, onCancelRenewal }: {
  pricing?: Pricing; pending: boolean; onSubmit: FormEventHandler<HTMLFormElement>;
  renewal?: { headline: string; startsAt: string; endsAt: string } | null;
  onCancelRenewal?: () => void;
}) {
  const [headline, setHeadline] = useState(renewal?.headline ?? '');
  const [startsAt, setStartsAt] = useState(renewal?.startsAt ?? '');
  const [endsAt, setEndsAt] = useState(renewal?.endsAt ?? '');
  const duration = Date.parse(endsAt) - Date.parse(startsAt);
  const valid = !!pricing && duration >= pricing.minHours * 3600000
    && duration <= pricing.maxDays * 86400000 && Date.parse(endsAt) > Date.now();
  const days = valid ? Math.ceil(duration / (pricing!.billingHours * 3600000)) : 0;
  const amount = days * (pricing?.dailyRate ?? 0);
  const pickDays = (count: number) => {
    const start = startsAt && Number.isFinite(Date.parse(startsAt)) ? new Date(startsAt) : new Date(Date.now() + 3600000);
    const local = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setStartsAt(local(start));
    setEndsAt(local(new Date(start.getTime() + count * 86400000)));
  };
  return <div className="sp-booking">
    <form className="sp-booking-fields" onSubmit={onSubmit} onReset={() => { setHeadline(''); setStartsAt(''); setEndsAt(''); }}>
      <div className="sp-section-label"><CalendarDays size={17} /> {renewal ? 'Đăng ký gia hạn quảng cáo' : 'Lịch quảng bá'}</div>
      {renewal && <div className="sp-renewal-info"><p>Gói cũ đã hết hạn. Lịch và phí bên dưới là cho lượt quảng cáo mới, cần thanh toán và được Admin duyệt lại.</p><button type="button" onClick={onCancelRenewal}>Bỏ gia hạn</button></div>}
      <label>Tiêu đề trên banner <span aria-hidden="true">*</span>
        <input name="headline" required minLength={5} maxLength={160} value={headline}
          placeholder="VD: Sora Skin — Ưu đãi chăm sóc da" onChange={e => setHeadline(e.target.value)} />
      </label>
      <div className="sp-dates">
        <SponsorshipDateTimePicker name="startsAt" label="Bắt đầu" value={startsAt} onChange={setStartsAt} />
        <SponsorshipDateTimePicker name="endsAt" label="Kết thúc" value={endsAt} onChange={setEndsAt} />
      </div>
      <div className="sp-presets"><span>Chọn nhanh</span>{[1, 3, 7].map(count =>
        <button type="button" key={count} onClick={() => pickDays(count)}>{count} ngày</button>)}</div>
      {startsAt && endsAt && !valid && pricing && <p className="sp-date-error" role="alert">Chọn lịch còn hiệu lực, dài từ {pricing.minHours} giờ đến {pricing.maxDays} ngày.</p>}
      <div className="sp-preview-section">
      <div className="sp-preview-heading"><span>Xem trước banner</span><small>Chưa đăng lên trang chủ</small></div>
      <div className="sp-banner-preview" aria-label="Xem trước banner">
        <span className="sp-preview-icon"><Store size={25} /></span>
        <div><span className="sp-preview-tag"><Megaphone size={11} /> Được tài trợ</span>
          <strong>{headline || 'Tiêu đề quảng bá của gian hàng'}</strong><small>Nội dung minh họa cách banner hiển thị</small></div>
      </div>
      <p className="sp-preview-note">Bản xem trước không có liên kết. Banner thật chỉ hiển thị sau khi xác nhận thanh toán, được duyệt và đến lịch chạy.</p>
      </div>
      <div className="sp-booking-footer">
        <div className="sp-mobile-total"><span>Tổng phí quảng cáo</span><strong>{days ? sponsorshipMoney(amount) : 'Chưa chọn lịch'}</strong></div>
        <p>Gửi đăng ký chưa trừ tiền. Admin xác nhận thanh toán trước khi quảng cáo hiển thị.</p>
        <input type="hidden" name="quotedAmount" value={amount} />
        <Button type="submit" variant="gold" loading={pending} disabled={!valid} icon={<ArrowRight size={16} />} iconPosition="right">{renewal ? 'Gửi đăng ký gia hạn' : 'Gửi đăng ký'}</Button>
      </div>
    </form>
    <aside className="sp-booking-summary" aria-label="Bảng phí quảng cáo">
      <div className="sp-section-label">Vị trí tài trợ · Trang chủ</div>
      <div className="sp-rate">{pricing ? sponsorshipMoney(pricing.dailyRate) : 'Đang tải phí…'}<span>/ {pricing?.billingHours ?? 24} giờ</span></div>
      <p className="sp-rate-note">Tính theo thời gian hiển thị, phần lẻ làm tròn lên mỗi 24 giờ.</p>
      <ul className="sp-benefits">
        <li><Check size={15} /><span>Banner riêng trên trang chủ mua sắm SCANMS</span></li>
        <li><Check size={15} /><span>Hiển thị logo, tên Shop và tiêu đề quảng bá</span></li>
        <li><MousePointer2 size={15} /><span>Nút truy cập trực tiếp vào gian hàng</span></li>
      </ul>
      <div className="sp-price-breakdown" aria-live="polite">
        <div><span>Thời gian tính phí</span><strong>{days ? `${days} ngày` : 'Chưa chọn lịch'}</strong></div>
        <div className="sp-total"><span>Tổng phí quảng cáo</span><strong>{days ? sponsorshipMoney(amount) : '—'}</strong></div>
      </div>
      <p className="sp-summary-note">Tối đa 6 vị trí cùng lúc. Lịch chạy cần được duyệt; không cam kết lượt xem hoặc doanh số. Hủy gói không tự hoàn phí.</p>
    </aside>
  </div>;
}
