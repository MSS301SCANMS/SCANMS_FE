import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ShieldAlert,
  Globe,
  Percent,
  Clock,
  CheckCircle2,
  Store,
  Copy,
  ExternalLink,
  Upload,
  Loader2,
  ImageIcon,
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Pencil,
  X,
} from 'lucide-react';
import { storeService } from '../../services/store.service';
import { authService } from '../../services/auth.service';
import { uploadService } from '../../services/upload.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';

export default function ShopSettingsPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isShopManager = currentUser?.role === 'SHOP_MANAGER';
  const isPlatformAdmin =
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'SYSTEM_MANAGER';

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [policyReturn, setPolicyReturn] = useState('');
  const [policyWarranty, setPolicyWarranty] = useState('');
  const [policyShipping, setPolicyShipping] = useState('');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number | ''>('');
  const [attributionWindowDays, setAttributionWindowDays] = useState<number>(30);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [shopOwnerDetails, setShopOwnerDetails] = useState({
    representativeName: currentUser?.fullName || '',
    contactPhone: currentUser?.phoneNumber || '',
    contactEmail: currentUser?.email || '',
    businessType: '',
    taxCode: '',
    warehouseAddress: '',
  });
  const [ownerDetailsDraft, setOwnerDetailsDraft] = useState(shopOwnerDetails);
  const [isEditingOwnerDetails, setIsEditingOwnerDetails] = useState(false);
  const [savingOwnerDetails, setSavingOwnerDetails] = useState(false);
  const [shopVerificationStatus, setShopVerificationStatus] = useState('DRAFT');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const secureUrl = await uploadService.uploadImage(file, 'scanms/logos');
      setLogoUrl(secureUrl);
      showToast('Đã tải logo gian hàng lên Cloudinary thành công!');
    } catch (err: any) {
      console.error('Lỗi upload logo Cloudinary:', err);
      showToast(err?.response?.data?.message || err?.message || 'Không thể tải logo lên Cloudinary');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const loadStore = useCallback(async () => {
    try {
      const store = await storeService.getMyStore();
      if (store.name) setName(store.name);
      if (store.description) setDescription(store.description);
      if (store.logoUrl) setLogoUrl(store.logoUrl);
      if (store.slug) setStoreSlug(store.slug);
      setPolicyReturn(store.policyReturn || '');
      setPolicyWarranty(store.policyWarranty || '');
      setPolicyShipping(store.policyShipping || '');
      if (store.defaultCommissionRate != null && Number(store.defaultCommissionRate) > 0) {
        setDefaultCommissionRate(Number(store.defaultCommissionRate));
      }
      if (store.attributionWindowDays) setAttributionWindowDays(store.attributionWindowDays);

      const onboardingData = store.onboardingData || {};
      setShopOwnerDetails({
        representativeName:
          onboardingData.representativeName || store.owner?.fullName || currentUser?.fullName || '',
        contactPhone: onboardingData.contactPhone || store.owner?.phoneNumber || '',
        contactEmail: onboardingData.contactEmail || store.owner?.email || '',
        businessType: onboardingData.businessType || '',
        taxCode: onboardingData.taxCode || '',
        warehouseAddress: onboardingData.warehouseAddress || '',
      });
      setOwnerDetailsDraft({
        representativeName:
          onboardingData.representativeName || store.owner?.fullName || currentUser?.fullName || '',
        contactPhone: onboardingData.contactPhone || store.owner?.phoneNumber || '',
        contactEmail: onboardingData.contactEmail || store.owner?.email || '',
        businessType: onboardingData.businessType || '',
        taxCode: onboardingData.taxCode || '',
        warehouseAddress: onboardingData.warehouseAddress || '',
      });
      setShopVerificationStatus(store.onboardingStatus || (store.isVerified ? 'VERIFIED' : 'DRAFT'));
    } catch (err) {
      console.error('Lỗi tải cấu hình shop:', err);
    }
  }, [currentUser?.fullName]);

  useEffect(() => {
    if (isShopManager) void loadStore();
  }, [isShopManager, loadStore]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const storefrontPath = storeSlug ? `/shop/${encodeURIComponent(storeSlug)}` : '';
  const storefrontUrl = storefrontPath && typeof window !== 'undefined'
    ? new URL(storefrontPath, window.location.origin).toString()
    : '';

  const copyStorefrontUrl = async () => {
    if (!storefrontUrl) return;
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      showToast('Đã sao chép liên kết gian hàng.');
    } catch {
      showToast('Không thể sao chép tự động. Hãy chọn và sao chép đường dẫn.');
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();

    if (defaultCommissionRate === '' || !Number.isFinite(Number(defaultCommissionRate)) || Number(defaultCommissionRate) < 1 || Number(defaultCommissionRate) > 50) {
      showToast('Nhập tỷ lệ hoa hồng mặc định từ 1% đến 50%.');
      return;
    }

    if (!logoUrl?.trim()) {
      showToast('Logo gian hàng không được để trống (Bắt buộc)');
      return;
    }

    setSaving(true);
    try {
      await storeService.updateMyStore({
        name,
        description,
        logoUrl: logoUrl.trim(),
        websiteUrl: '',
        policyReturn,
        policyWarranty,
        policyShipping,
        defaultCommissionRate: Number(defaultCommissionRate),
        attributionWindowDays: Number(attributionWindowDays),
      });
      showToast('Đã lưu cấu hình gian hàng.');
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOwnerDetails = async () => {
    const details = {
      representativeName: ownerDetailsDraft.representativeName.trim(),
      businessType: ownerDetailsDraft.businessType,
      contactPhone: ownerDetailsDraft.contactPhone.trim(),
      contactEmail: ownerDetailsDraft.contactEmail.trim(),
      taxCode: ownerDetailsDraft.taxCode.trim(),
      warehouseAddress: ownerDetailsDraft.warehouseAddress.trim(),
    };

    if (!details.representativeName || !details.businessType || !details.taxCode ||
        !details.contactPhone || !details.contactEmail || !details.warehouseAddress) {
      showToast('Vui lòng bổ sung đầy đủ thông tin chủ shop.');
      return;
    }
    if (!/^[+]?([0-9().\-\s]){8,20}$/.test(details.contactPhone)) {
      showToast('Số điện thoại liên hệ chưa đúng định dạng.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.contactEmail)) {
      showToast('Email đối soát chưa đúng định dạng.');
      return;
    }

    setSavingOwnerDetails(true);
    try {
      await storeService.updateMyStore(details);
      setShopOwnerDetails(details);
      setOwnerDetailsDraft(details);
      setIsEditingOwnerDetails(false);
      showToast('Đã cập nhật thông tin chủ shop.');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Không thể lưu thông tin chủ shop.');
    } finally {
      setSavingOwnerDetails(false);
    }
  };

  if (!isShopManager) {
    return (
      <div className="max-w-lg mx-auto my-12 text-center">
        <Card className="p-8 bg-white border border-[#EAE4D7] flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-[#1A1612] m-0">
            Chỉ dành cho Chủ gian hàng
          </h2>
          <p className="text-xs sm:text-sm text-[#7D715E] leading-relaxed m-0">
            Đây là nơi quản lý thông tin và chính sách của một gian hàng cụ thể. Tài khoản quản trị sàn không dùng khu vực này để cấu hình chính sách toàn sàn.
          </p>
          <Button
            variant="gold"
            size="md"
            onClick={() => navigate(isPlatformAdmin ? '/admin/analytics' : '/collaborator/dashboard')}
          >
            {isPlatformAdmin ? 'Về trang quản trị sàn' : 'Về trang Tổng quan KOL'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 pb-10 pt-3 text-left sm:gap-5 sm:pt-4">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-white text-[#1A1612] px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 border border-[#EEDFC6] animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EAE4D7] bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(35,29,21,0.025)] sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F"><Store className="h-5 w-5" /></div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#B88E4F]">Thiết lập cửa hàng</span>
            <h1 className="m-0 mt-0.5 text-lg font-bold tracking-tight text-[#1A1612]">Cài đặt gian hàng</h1>
            <p className="m-0 mt-0.5 text-xs text-[#7D715E]">Quản lý thương hiệu, chính sách bán hàng và thông tin đối soát.</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${shopVerificationStatus === 'VERIFIED' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : shopVerificationStatus === 'REJECTED' ? 'border-red-200 bg-red-50 text-red-700' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${shopVerificationStatus === 'VERIFIED' ? 'bg-[#B88E4F]' : shopVerificationStatus === 'REJECTED' ? 'bg-red-500' : 'bg-[#A99D8A]'}`} />
          {shopVerificationStatus === 'VERIFIED' ? 'Đã xác minh' : shopVerificationStatus === 'PENDING_APPROVAL' ? 'Đang chờ duyệt' : shopVerificationStatus === 'NEEDS_INFO' ? 'Cần bổ sung hồ sơ' : shopVerificationStatus === 'REJECTED' ? 'Cần cập nhật hồ sơ' : 'Chưa xác minh'}
        </span>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.04fr_0.96fr] xl:gap-5">
        <div className="space-y-4 xl:space-y-5">
          <section className="space-y-3.5 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_10px_rgba(35,29,21,0.03)] sm:p-5">
            <div className="flex items-center gap-3 border-b border-[#EAE4D7] pb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <Store className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-sm font-bold text-[#1A1612] sm:text-base">Nhận diện thương hiệu</h2>
                <p className="m-0 mt-0.5 text-xs text-[#7D715E]">Logo và thông tin cơ bản của gian hàng</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1A1612]">
                Tên gian hàng / Thương hiệu <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Sora Skin Official Store"
                className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3.5 text-sm font-semibold text-[#1A1612] outline-none transition hover:border-[#B88E4F]/50 focus:border-[#C59B58]"
                required
              />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 sm:p-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1612]">
                <ImageIcon className="h-3.5 w-3.5 text-[#B88E4F]" />
                <span>Logo đại diện <strong className="text-rose-600">*</strong></span>
              </label>

              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E8D4B0] bg-[#F3EFE6]">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-5 w-5 text-[#7D715E]" />
                  )}
                </div>

                <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-3 text-center text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#FDFBF7]">
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#B88E4F]" />
                  ) : (
                    <Upload className="h-4 w-4 shrink-0 text-[#B88E4F]" />
                  )}
                  <span>{uploadingLogo ? 'Đang tải lên...' : 'Tải ảnh logo từ máy (PNG/JPG)'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    disabled={uploadingLogo}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#1A1612]">
                <Globe className="h-3.5 w-3.5 text-[#B88E4F]" />
                Liên kết gian hàng trên SCANMS
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={storefrontUrl}
                  readOnly
                  aria-label="Đường dẫn gian hàng trên SCANMS"
                  placeholder="Đang tải đường dẫn gian hàng..."
                  onFocus={(event) => event.currentTarget.select()}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 text-sm text-[#1A1612] outline-none focus:border-[#C59B58]"
                />
                <div className="flex shrink-0 gap-2">
                  <a
                    href={storefrontPath || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!storefrontPath}
                    className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition sm:flex-none ${storefrontPath
                      ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C] hover:bg-[#F3EFE6]'
                      : 'pointer-events-none border-[#EAE4D7] bg-[#F3EFE6] text-[#7D715E]/50'
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Mở gian hàng
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyStorefrontUrl()}
                    disabled={!storefrontUrl}
                    className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    <Copy className="h-4 w-4 text-[#B88E4F]" />
                    Sao chép
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-[#7D715E]">
                Link này mở trang giới thiệu và sản phẩm của shop ngay trên SCANMS.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1A1612]">
                Mô tả giới thiệu gian hàng
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Giới thiệu xuất xứ, dòng sản phẩm thế mạnh và cam kết chất lượng của thương hiệu..."
                className="min-h-[92px] w-full resize-y rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm text-[#1A1612] outline-none transition hover:border-[#B88E4F]/50 focus:border-[#C59B58]"
              />
            </div>
          </section>

          <section className="space-y-3.5 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_10px_rgba(35,29,21,0.03)] sm:p-5">
            <div className="flex items-center gap-3 border-b border-[#EAE4D7] pb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-sm font-bold text-[#1A1612] sm:text-base">Chính sách công khai</h2>
                <p className="m-0 mt-0.5 text-xs text-[#7D715E]">Hiển thị với khách trước khi thanh toán</p>
              </div>
            </div>

            <div className="space-y-3">
              {([
                ['Chính sách Đổi trả & Hoàn tiền', policyReturn, setPolicyReturn, 'Cam kết đổi trả trong 7-14 ngày nếu lỗi nhà sản xuất...'],
                ['Chính sách Bảo hành & Cam kết chất lượng', policyWarranty, setPolicyWarranty, 'Cam kết 100% hàng chính hãng có tem niêm phong...'],
                ['Chính sách Giao nhận & Đồng kiểm', policyShipping, setPolicyShipping, 'Hỗ trợ đồng kiểm khi nhận hàng, giao nhanh 2-3 ngày...'],
              ] as const).map(([label, value, setValue, placeholder]) => (
                <div key={label}>
                  <label className="mb-1.5 block text-xs font-semibold text-[#1A1612]">
                    {label}
                  </label>
                  <textarea
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder={placeholder}
                    className="min-h-[88px] w-full resize-y rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-sm text-[#1A1612] outline-none transition focus:border-[#C59B58] focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:space-y-5">
          <section className="space-y-3.5 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_10px_rgba(35,29,21,0.03)] sm:p-5">
            <div className="flex items-center gap-3 border-b border-[#EAE4D7] pb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <Percent className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-sm font-bold text-[#1A1612] sm:text-base">Tiếp thị liên kết</h2>
                <p className="m-0 mt-0.5 text-xs text-[#7D715E]">Mức hoa hồng và thời hạn ghi nhận đơn</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1.5 flex min-h-7 items-start gap-1.5 text-xs font-semibold text-[#1A1612]">
                  <Percent className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                  Hoa hồng mặc định (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={defaultCommissionRate}
                  onChange={(e) => setDefaultCommissionRate(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ví dụ: 10"
                  className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3.5 text-sm font-semibold text-[#1A1612] outline-none transition hover:border-[#B88E4F]/50 focus:border-[#C59B58]"
                  required
                />
              </div>

              <div className="min-w-0">
                <label className="mb-1.5 flex min-h-7 items-start gap-1.5 text-xs font-semibold text-[#1A1612]">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                  Thời hạn ghi nhận đơn qua link affiliate
                </label>
                <Select
                  value={String(attributionWindowDays)}
                  onChange={(e) => setAttributionWindowDays(Number(e.target.value))}
                  className="h-11 w-full"
                >
                  <option value="7">7 ngày</option>
                  <option value="14">14 ngày</option>
                  <option value="30">30 ngày (Tiêu chuẩn)</option>
                  <option value="60">60 ngày</option>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_10px_rgba(35,29,21,0.03)] sm:p-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4D7] pb-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="m-0 text-sm font-bold text-[#1A1612] sm:text-base">Hồ sơ chủ shop</h3>
                      <p className="m-0 mt-0.5 text-xs text-[#7D715E]">Thông tin liên hệ và pháp lý</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isEditingOwnerDetails ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingOwnerDetails(false)}
                        disabled={savingOwnerDetails}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-semibold text-[#7D715E] transition hover:border-[#C59B58] hover:text-[#1A1612] disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Hủy
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerDetailsDraft({ ...shopOwnerDetails });
                          setIsEditingOwnerDetails(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-xs font-semibold text-[#8A642C] transition hover:border-[#C59B58]"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Sửa thông tin
                      </button>
                    )}
                  </div>
              </div>

                {isEditingOwnerDetails ? (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-[#1A1612]">
                        Người đại diện <span className="text-rose-600">*</span>
                        <input
                          value={ownerDetailsDraft.representativeName}
                          maxLength={150}
                          onChange={(event) => setOwnerDetailsDraft({ ...ownerDetailsDraft, representativeName: event.target.value })}
                          placeholder="Nhập tên người đại diện"
                          className="mt-1.5 h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-sm font-normal outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58]"
                        />
                      </label>
                      <div>
                        <span className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                          Loại hình kinh doanh <span className="text-rose-600">*</span>
                        </span>
                        <Select
                          value={ownerDetailsDraft.businessType}
                          onChange={(event) => setOwnerDetailsDraft({ ...ownerDetailsDraft, businessType: event.target.value })}
                          className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#C59B58]"
                        >
                          <option value="">Chọn loại hình kinh doanh</option>
                          <option value="INDIVIDUAL">Cá nhân</option>
                          <option value="HOUSEHOLD">Hộ kinh doanh</option>
                          <option value="ENTERPRISE">Doanh nghiệp</option>
                        </Select>
                      </div>
                      <label className="block text-xs font-semibold text-[#1A1612]">
                        Điện thoại liên hệ <span className="text-rose-600">*</span>
                        <input
                          type="tel"
                          value={ownerDetailsDraft.contactPhone}
                          maxLength={20}
                          onChange={(event) => setOwnerDetailsDraft({ ...ownerDetailsDraft, contactPhone: event.target.value })}
                          placeholder="Ví dụ: 0902345678"
                          className="mt-1.5 h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-sm font-normal outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58]"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#1A1612]">
                        Email nhận đối soát <span className="text-rose-600">*</span>
                        <input
                          type="email"
                          value={ownerDetailsDraft.contactEmail}
                          maxLength={255}
                          onChange={(event) => setOwnerDetailsDraft({ ...ownerDetailsDraft, contactEmail: event.target.value })}
                          placeholder="Ví dụ: shop@example.vn"
                          className="mt-1.5 h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-sm font-normal outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58]"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#1A1612] sm:col-span-2">
                        Mã số thuế <span className="text-rose-600">*</span>
                        <input
                          value={ownerDetailsDraft.taxCode}
                          maxLength={30}
                          onChange={(event) => setOwnerDetailsDraft({ ...ownerDetailsDraft, taxCode: event.target.value })}
                          placeholder="Nhập mã số thuế cá nhân, hộ kinh doanh hoặc doanh nghiệp"
                          className="mt-1.5 h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-sm font-normal outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58]"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#1A1612] sm:col-span-2">
                        Địa chỉ kho hàng <span className="text-rose-600">*</span>
                        <textarea
                          value={ownerDetailsDraft.warehouseAddress}
                          maxLength={500}
                          rows={2}
                          onChange={(event) => setOwnerDetailsDraft({ ...ownerDetailsDraft, warehouseAddress: event.target.value })}
                          placeholder="Nhập địa chỉ kho hàng đầy đủ"
                          className="mt-1.5 w-full resize-y rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm font-normal outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58]"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAE4D7] pt-3">
                      <p className="m-0 text-[11px] text-[#7D715E]">Các mục có dấu * cần được điền đầy đủ.</p>
                      <button
                        type="button"
                        onClick={handleSaveOwnerDetails}
                        disabled={savingOwnerDetails}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#C59B58] px-4 text-xs font-bold text-white transition hover:bg-[#B88E4F] disabled:cursor-wait disabled:opacity-60"
                      >
                        {savingOwnerDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {savingOwnerDetails ? 'Đang lưu...' : 'Lưu thông tin'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex min-h-[64px] min-w-0 items-start gap-2.5 rounded-xl border border-[#F0EAE0] bg-[#FAF8F5] p-3">
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" />
                      <div className="min-w-0">
                        <p className="m-0 text-[11px] text-[#7D715E]">Người đại diện</p>
                        <p className="m-0 mt-0.5 break-words text-sm font-semibold text-[#1A1612]">{shopOwnerDetails.representativeName || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex min-h-[64px] min-w-0 items-start gap-2.5 rounded-xl border border-[#F0EAE0] bg-[#FAF8F5] p-3">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" />
                      <div className="min-w-0">
                        <p className="m-0 text-[11px] text-[#7D715E]">Loại hình kinh doanh</p>
                        <p className="m-0 mt-0.5 text-sm font-semibold text-[#1A1612]">
                          {shopOwnerDetails.businessType === 'INDIVIDUAL'
                            ? 'Cá nhân'
                            : shopOwnerDetails.businessType === 'HOUSEHOLD'
                              ? 'Hộ kinh doanh'
                              : shopOwnerDetails.businessType === 'ENTERPRISE'
                                ? 'Doanh nghiệp'
                                : shopOwnerDetails.businessType || 'Chưa cập nhật'}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-h-[64px] min-w-0 items-start gap-2.5 rounded-xl border border-[#F0EAE0] bg-[#FAF8F5] p-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" />
                      <div className="min-w-0">
                        <p className="m-0 text-[11px] text-[#7D715E]">Điện thoại liên hệ</p>
                        <p className="m-0 mt-0.5 break-words text-sm font-semibold text-[#1A1612]">{shopOwnerDetails.contactPhone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex min-h-[64px] min-w-0 items-start gap-2.5 rounded-xl border border-[#F0EAE0] bg-[#FAF8F5] p-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" />
                      <div className="min-w-0">
                        <p className="m-0 text-[11px] text-[#7D715E]">Email nhận đối soát</p>
                        <p className="m-0 mt-0.5 break-all text-sm font-semibold text-[#1A1612]">{shopOwnerDetails.contactEmail || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex min-h-[64px] min-w-0 items-start gap-2.5 rounded-xl border border-[#F0EAE0] bg-[#FAF8F5] p-3">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" />
                      <div className="min-w-0">
                        <p className="m-0 text-[11px] text-[#7D715E]">Mã số thuế</p>
                        <p className="m-0 mt-0.5 break-words font-mono text-sm font-semibold text-[#1A1612]">{shopOwnerDetails.taxCode || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex min-h-[64px] min-w-0 items-start gap-2.5 rounded-xl border border-[#F0EAE0] bg-[#FAF8F5] p-3 sm:col-span-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" />
                      <div className="min-w-0">
                        <p className="m-0 text-[11px] text-[#7D715E]">Địa chỉ kho hàng</p>
                        <p className="m-0 mt-0.5 break-words text-sm font-semibold text-[#1A1612]">{shopOwnerDetails.warehouseAddress || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </section>

        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5] py-3 lg:col-span-2">
          <p className="m-0 text-[11px] text-[#7D715E]">Thay đổi của bạn sẽ được áp dụng lên trang gian hàng.</p>
          <Button
            type="submit"
            variant="gold"
            size="lg"
            icon={<Save className="w-4 h-4" />}
            loading={saving}
            className="h-11 rounded-xl px-6 text-sm font-semibold shadow-sm"
          >
            {saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình gian hàng'}
          </Button>
        </div>
      </form>
    </div>
  );
}
