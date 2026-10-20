import { useState, type FormEvent } from 'react';
import { useReturnAction } from '../../hooks/useReturnDetail';
import { returnService, type PickupBookingInput, type ReturnDetail } from '../../services/return.service';

const inputClass = 'mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm text-[#1A1612] outline-none focus:border-[#C59B58]';

export function PickupBookingForm({ request }: { request: ReturnDetail }) {
  const [form, setForm] = useState<PickupBookingInput>({
    name: request.order.customerName || '',
    phone: request.order.customerPhone || '',
    address: request.order.shippingAddress || '',
    wardName: '',
    provinceName: '',
    districtName: '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
  });
  const booking = useReturnAction(request.id, returnService.bookPickup);
  const update = (field: keyof PickupBookingInput, value: string | number) =>
    setForm((current) => ({ ...current, [field]: value }));
  const overdue = Boolean(request.shipByAt && new Date(request.shipByAt).getTime() <= Date.now());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await booking.mutateAsync({
        ...form,
        name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(),
        wardName: form.wardName.trim(), provinceName: form.provinceName.trim(),
        districtName: form.districtName?.trim() || undefined,
      });
    } catch { /* Keep the form values; show the API error below. */ }
  }

  return <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 sm:p-5">
    <div>
      <h3 className="font-bold text-[#1A1612]">Đặt shipper đến lấy hàng trả</h3>
      <p className="mt-1 text-sm text-[#7D715E]">Xác nhận nơi lấy hàng. Shipper sẽ lấy tại địa chỉ này và chuyển về Shop.</p>
      {request.pickupProviderMode === 'mock' && <p className="mt-2 text-xs text-[#8A6736]">Chế độ demo: tạo vận đơn mô phỏng, không có shipper thật.</p>}
      {request.pickupProviderMode === 'staging' && <p className="mt-2 text-xs text-[#8A6736]">GHN Staging chỉ dùng để thử tích hợp; vận đơn này không điều phối shipper thật.</p>}
      {request.pickupProviderMode === 'disabled' && <p role="alert" className="mt-2 text-xs text-[#DC2626]">Dịch vụ lấy hàng chưa được cấu hình. Vui lòng liên hệ hỗ trợ.</p>}
      {request.shipByAt && <p className="mt-2 text-xs font-semibold text-[#8A6736]">Hạn đặt lấy hàng: {new Date(request.shipByAt).toLocaleString('vi-VN')}</p>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Tên người giao hàng cho shipper<input required minLength={2} maxLength={150} value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} /></label>
      <label className="text-sm">Số điện thoại<input required pattern="\+?[0-9]{9,15}" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} /></label>
      <label className="text-sm sm:col-span-2">Địa chỉ lấy hàng<input required minLength={10} maxLength={500} value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} /></label>
      <label className="text-sm">Tỉnh / thành phố<input required minLength={2} maxLength={100} value={form.provinceName} onChange={(e) => update('provinceName', e.target.value)} className={inputClass} /></label>
      <label className="text-sm">Phường / xã<input required minLength={2} maxLength={100} value={form.wardName} onChange={(e) => update('wardName', e.target.value)} className={inputClass} /></label>
      <label className="text-sm sm:col-span-2">Quận / huyện (nếu địa chỉ cũ)<input maxLength={100} value={form.districtName || ''} onChange={(e) => update('districtName', e.target.value)} className={inputClass} /></label>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(['weight', 'length', 'width', 'height'] as const).map((key) => <label key={key} className="text-sm">
        {{ weight: 'Khối lượng (g)', length: 'Dài (cm)', width: 'Rộng (cm)', height: 'Cao (cm)' }[key]}
        <input type="number" required min={1} max={key === 'weight' ? 19999 : 200} value={form[key] || ''}
          onChange={(e) => update(key, Number(e.target.value))} className={inputClass} />
      </label>)}
    </div>
    <p className="text-xs text-[#7D715E]">Đóng gói hàng trước khi shipper đến. Khối lượng và kích thước cần đúng với kiện thực tế.</p>
    {overdue && <p role="alert" className="text-sm text-[#DC2626]">Đã quá hạn đặt lấy hàng. Vui lòng liên hệ hỗ trợ.</p>}
    {booking.error && <p role="alert" className="text-sm text-[#DC2626]">{booking.error instanceof Error ? booking.error.message : 'Không đặt được lấy hàng. Vui lòng thử lại.'}</p>}
    <button type="submit" disabled={booking.isPending || overdue || request.pickupProviderMode === 'disabled'} className="rounded-xl bg-[#C59B58] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50">
      {booking.isPending ? 'Đang tạo vận đơn…' : 'Xác nhận đặt lấy hàng'}
    </button>
  </form>;
}
