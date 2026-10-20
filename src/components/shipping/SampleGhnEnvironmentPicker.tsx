import { useId, useState } from 'react';
import { CheckCircle2, ChevronDown, CreditCard, FlaskConical, Loader2, Truck } from 'lucide-react';
import './SampleShippingPayment.css';
import api from '../../services/api';
import { SandboxSampleReceipt } from './SandboxSampleReceipt';
import { sandboxSampleStatusLabel, useSandboxSampleState } from './useSandboxSampleState';

export function SampleGhnEnvironmentPicker({ value, onChange, allowLive = true, disabled = false }: {
  value: 'LIVE' | 'TEST';
  onChange: (value: 'LIVE' | 'TEST') => void;
  allowLive?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-xs font-bold text-[#1A1612]">Môi trường vận đơn GHN</label>
    <select id={id} disabled={disabled} value={value} onChange={event => onChange(event.target.value as 'LIVE' | 'TEST')} className="w-full rounded-xl border border-[#EEDFC6] bg-white px-3 py-3 text-sm text-[#1A1612]">
      <option value="LIVE" disabled={!allowLive}>GHN thật</option>
      <option value="TEST">GHN sandbox</option>
    </select>
    <p className="text-xs leading-relaxed text-[#7D715E]">{value === 'TEST'
      ? 'Tạo mã vận đơn mẫu. Shop có thể xác nhận nhận hàng trên thẻ mẫu để KOL nộp video; trạng thái và hạn nộp được quản lý trong SCANMS.'
      : 'Tạo yêu cầu vận chuyển thật. Shop chịu phí ship; chỉ bấm nếu có kiện hàng để bàn giao.'}</p>
  </div>;
}

export interface SampleWaybillCharge { environment?: string; trackingNumber: string; amount?: string | number | null }

function SandboxShippingPayment({ code, amount, role }: { code: string; amount?: string | number | null; role: 'shop' | 'kol' }) {
  const { state, setState, error: trackingError } = useSandboxSampleState(code);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const payment = state?.shippingPayment;
  const paid = payment?.status === 'PAID_SIMULATED';
  const fee = paid ? payment.amount : (typeof amount === 'number' || typeof amount === 'string' && amount.trim() !== '') ? Number(amount) : NaN;
  const knownFee = Number.isFinite(fee) && fee >= 0;
  async function pay() {
    if (busy || paid) return;
    setBusy(true); setError('');
    try {
      const response: any = await api.post(`/shipping/ghn/sandbox-sample/${encodeURIComponent(code)}/pay-shipping`, {});
      setState(response?.data?.data || response?.data || response);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Chưa lưu được thanh toán thử. Vui lòng thử lại.';
      setError(Array.isArray(message) ? message.join(' ') : String(message));
    } finally { setBusy(false); }
  }
  return <div aria-label="Phí vận chuyển hàng mẫu" className="sample-freight">
    <div className="sample-freight__row">
      <dl className="sample-freight__amounts">
        <div><dt>Shop chịu 100% phí ship</dt><dd className={!knownFee ? 'sample-freight__unknown' : undefined}>{role === 'shop' ? knownFee ? <>{fee.toLocaleString('vi-VN')} <span>đ</span></> : 'Chờ GHN xác nhận cước' : 'Shop thanh toán'}</dd></div>
        <div><dt>Thu hộ COD từ KOL</dt><dd>0 <span>đ</span></dd></div>
      </dl>
      {role === 'shop' && !paid && <button type="button" onClick={() => void pay()} disabled={busy || !state || Boolean(trackingError) || !knownFee} className="sample-freight__pay">{busy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}{busy ? 'Đang lưu…' : 'Thanh toán cước thử'}</button>}
      {paid && <p role="status" className="sample-freight__paid"><CheckCircle2 size={15} />Shop đã thanh toán cước mô phỏng</p>}
    </div>
    {paid && <p className="sample-freight__reference">Mã xác nhận: <code>{payment.reference}</code><span>{new Date(payment.paidAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span></p>}
    {role !== 'shop' && <p className="sample-freight__note"><FlaskConical size={12} aria-hidden="true" /><span>Bạn nhận mẫu miễn phí, không phải trả tiền hàng hoặc phí ship.</span></p>}
    {error && <p role="alert" className="sample-freight__error">{error}</p>}
  </div>;
}

export function SampleSandboxStatus({ charges }: { charges?: SampleWaybillCharge[] }) {
  const code = charges?.find(charge => charge.environment === 'TEST')?.trackingNumber;
  return code ? <SandboxStatusText key={code} code={code} /> : null;
}

function SandboxStatusText({ code }: { code: string }) {
  const { state, error } = useSandboxSampleState(code);
  return <span data-sandbox-status={code} className={state?.status === 'OVERDUE' && !state.videoUrl ? 'text-[#DC2626]' : undefined}>
    {error ? 'Chưa cập nhật trạng thái' : sandboxSampleStatusLabel(state)}
  </span>;
}

export function isSandboxShipment(sample: {
  status: string;
  trackingNumber?: string | null;
  trackingCode?: string | null;
  shippingCharges?: SampleWaybillCharge[];
}) {
  return sample.status === 'APPROVED' && !sample.trackingNumber && !sample.trackingCode &&
    Boolean(sample.shippingCharges?.some(charge => charge.environment === 'TEST'));
}

export function sampleDisplayStatus(sample: Parameters<typeof isSandboxShipment>[0]) {
  return isSandboxShipment(sample) ? 'SHIPPED' : sample.status;
}

export function SampleSandboxWaybills({ charges, role = 'kol', productId, productTitle, sampleRequestId }: {
  charges?: SampleWaybillCharge[];
  primary?: boolean;
  role?: 'shop' | 'kol';
  productId?: string;
  productTitle?: string;
  sampleRequestId?: string;
}) {
  const [open, setOpen] = useState(false);
  const tests = charges?.filter(charge => charge.environment === 'TEST') || [];
  if (!tests.length) return null;
  const code = tests[0].trackingNumber;

  return <section className="mt-3 min-w-0 rounded-xl border border-[#EAE4D7] bg-white" aria-label="Vận đơn mẫu GHN sandbox">
    <div className="flex items-center justify-between gap-3 px-3.5 pb-1.5 pt-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FBF5EB] text-[#B88E4F]"><Truck size={18} aria-hidden="true" /></span>
        <div className="min-w-0">
          <div className="flex items-center gap-2"><h4 className="m-0 text-xs font-bold text-[#231D15]">Giao Hàng Nhanh</h4><span className="text-[10px] font-medium text-[#8C6B32]">Sandbox</span></div>
          <code className="mt-0.5 block text-[11px] font-semibold tracking-wide text-[#7D715E]">{code}</code>
        </div>
      </div>
      <button type="button" aria-label={open ? 'Thu gọn' : role === 'kol' ? 'Theo dõi hành trình bưu kiện' : 'Xem hành trình'} title={open ? 'Thu gọn hành trình' : 'Xem hành trình giao hàng'} aria-expanded={open} onClick={() => setOpen(!open)} className={`inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 border border-[#EAE4D7] bg-[#FAF8F5] text-[11px] font-semibold text-[#795A2D] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58] ${role === 'kol' ? 'rounded-lg px-2.5 py-2' : 'h-9 w-9 rounded-full'}`}>
        {role === 'kol' && <span>{open ? 'Thu gọn' : 'Theo dõi hành trình bưu kiện'}</span>}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
    </div>
    <div className="px-3.5 pb-3">
      <SandboxSampleReceipt key={code} code={code} role={role} productId={productId} productTitle={productTitle} sampleRequestId={sampleRequestId} expanded={open} />
      <SandboxShippingPayment key={code} code={code} amount={tests[0].amount} role={role} />
    </div>
  </section>;
}
