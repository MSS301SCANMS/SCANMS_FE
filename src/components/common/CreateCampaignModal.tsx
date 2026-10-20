import { useState, useRef } from 'react';
import api from '../../services/api';
import type { Campaign } from '@/types/campaigns.types';
import { DateTimePicker } from './DateTimePicker';

export function CreateCampaignModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (campaign: Campaign) => void }) {
  const [form, setForm] = useState({ name: '', bonusCommissionRate: '1', bonusBudgetTotal: 1000000, startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const datePopoverRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bonusCommissionRate = Number(form.bonusCommissionRate);
    if (!Number.isFinite(bonusCommissionRate) || bonusCommissionRate < 1 || bonusCommissionRate > 2) {
      setError('Hoa hồng thưởng thêm chỉ được nhập từ 1% đến 2%.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response: any = await api.post('/campaigns', { ...form, bonusCommissionRate });
      onSuccess(response?.data || response);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo chiến dịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] shadow-2xl overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1A1612]">🎯 Tạo Chiến Dịch Mới</h2>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
            onClick={onClose}
            id="btn-close-create-campaign"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên chiến dịch</label>
            <input
              id="campaign-name"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
              placeholder="VD: Flash Sale Tháng 9 — Dành riêng Top KOL"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1.5">% Hoa hồng thưởng thêm</label>
            <div className="flex items-center bg-white border border-[#EAE4D7] rounded-xl overflow-hidden focus-within:border-[#B88E4F] focus-within:ring-2 focus-within:ring-[#B88E4F]/15">
              <input
                id="campaign-rate"
                type="number"
                min={1}
                max={2}
                step="0.01"
                inputMode="decimal"
                className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-xs text-[#1A1612] outline-none"
                value={form.bonusCommissionRate}
                onChange={(e) => setForm((f) => ({ ...f, bonusCommissionRate: e.target.value }))}
                required
              />
              <span className="px-3.5 text-xs font-bold text-[#7D715E] bg-[#F3EFE6] py-2.5 border-l border-[#EAE4D7]">
                %
              </span>
            </div>
            <small className="text-[11px] text-[#7D715E] mt-1 block">
              Nhập thủ công trong khoảng từ 1% đến 2%.
            </small>
          </div>
          <label className="block text-xs font-bold text-[#1A1612]">Ngân sách trần cho hoa hồng thưởng (VNĐ)
            <input type="number" min={1} step={1000} required value={form.bonusBudgetTotal} onChange={(e) => setForm((f) => ({ ...f, bonusBudgetTotal: Number(e.target.value) }))} className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 py-2.5" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Ngày bắt đầu</label>
              <DateTimePicker
                id="campaign-start"
                mode="date"
                value={form.startDate}
                onChange={(val) => setForm((f) => ({ ...f, startDate: val }))}
                placeholder="Chọn ngày bắt đầu"
                inlinePopoverRef={datePopoverRef}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Ngày kết thúc</label>
              <DateTimePicker
                id="campaign-end"
                mode="date"
                value={form.endDate}
                minDateTime={form.startDate}
                onChange={(val) => setForm((f) => ({ ...f, endDate: val }))}
                placeholder="Chọn ngày kết thúc"
                inlinePopoverRef={datePopoverRef}
                required
              />
            </div>
          </div>
          <div ref={datePopoverRef} />
          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{error}</div>}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              id="btn-create-campaign"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '⏳ Đang tạo...' : '🚀 Tạo chiến dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
