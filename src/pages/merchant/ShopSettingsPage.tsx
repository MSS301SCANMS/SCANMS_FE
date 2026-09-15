import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ShieldAlert,
  Globe,
  Percent,
  Clock,
  Coins,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { storeService } from '../../services/store.service';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function ShopSettingsPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isShopOrAdmin =
    currentUser?.role === 'SHOP_MANAGER' ||
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'SYSTEM_MANAGER';

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [name, setName] = useState('Sora Skin Official Store');
  const [description, setDescription] = useState('Thương hiệu D2C mỹ phẩm phục hồi da sinh học.');
  const [logoUrl, setLogoUrl] = useState('/assets/serum-hero-optimized.jpg');
  const [websiteUrl, setWebsiteUrl] = useState('https://soraskin.vn');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(10);
  const [attributionWindowDays, setAttributionWindowDays] = useState<number>(30);
  const [minPayoutAmount, setMinPayoutAmount] = useState<number>(200000);

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const store = await storeService.getMyStore();
      if (store.name) setName(store.name);
      if (store.description) setDescription(store.description);
      if (store.logoUrl) setLogoUrl(store.logoUrl);
      if (store.websiteUrl) setWebsiteUrl(store.websiteUrl);
      if (store.defaultCommissionRate) setDefaultCommissionRate(Number(store.defaultCommissionRate));
      if (store.attributionWindowDays) setAttributionWindowDays(store.attributionWindowDays);
      if (store.minPayoutAmount) setMinPayoutAmount(Number(store.minPayoutAmount));
    } catch (err) {
      console.error('Lỗi tải cấu hình shop:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storeService.updateMyStore({
        name,
        description,
        logoUrl,
        websiteUrl,
        defaultCommissionRate: Number(defaultCommissionRate),
        attributionWindowDays: Number(attributionWindowDays),
        minPayoutAmount: Number(minPayoutAmount),
      });
      showToast('Lưu cấu hình gian hàng thành công!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (!isShopOrAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 text-center">
        <Card className="p-8 bg-white border border-[#EAE4D7] flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-[#1A1612] m-0">
            Khu Vực Dành Cho Chủ Gian Hàng
          </h2>
          <p className="text-xs sm:text-sm text-[#7D715E] leading-relaxed m-0">
            Cài đặt gian hàng, hạn mức rút tiền tối thiểu và thời hạn lưu vết cookie 30 ngày là tính năng quản trị dành riêng cho Chủ Shop (Sora Skin).
          </p>
          <Button
            variant="gold"
            size="md"
            onClick={() => navigate('/collaborator/dashboard')}
          >
            Về trang Tổng quan KOL
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto text-left">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#231D15] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
          Cài Đặt Gian Hàng &amp; Quy Tắc Tiếp Thị
        </h1>
        <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
          Thiết lập thông tin thương hiệu, tỷ lệ hoa hồng mặc định và cơ chế phân bổ cookie ghi nhận đơn hàng.
        </p>
      </header>

      <Card className="p-6 sm:p-7 bg-white border border-[#EAE4D7]">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
              Tên gian hàng / Thương hiệu
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1612] mb-1.5 block">
              Mô tả gian hàng
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 text-xs sm:text-sm text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#B88E4F]" />
                Website chính thức (Storefront)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#B88E4F]" />
                Tỷ lệ hoa hồng mặc định (%)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={defaultCommissionRate}
                onChange={(e) => setDefaultCommissionRate(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#B88E4F]" />
                Thời gian lưu vết Cookie (Ngày)
              </label>
              <div className="relative">
                <select
                  value={attributionWindowDays}
                  onChange={(e) => setAttributionWindowDays(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1A1612] appearance-none outline-none cursor-pointer hover:border-[#B88E4F]/50 transition"
                >
                  <option value={7}>7 ngày</option>
                  <option value={14}>14 ngày</option>
                  <option value={30}>30 ngày (Tiêu chuẩn Last-Click)</option>
                  <option value={60}>60 ngày</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#7D715E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] mb-1.5 block flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#B88E4F]" />
                Hạn mức rút tối thiểu (₫)
              </label>
              <input
                type="number"
                value={minPayoutAmount}
                onChange={(e) => setMinPayoutAmount(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="gold"
              size="lg"
              icon={<Save className="w-4 h-4" />}
              loading={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Đang lưu...' : 'Lưu cấu hình gian hàng'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
