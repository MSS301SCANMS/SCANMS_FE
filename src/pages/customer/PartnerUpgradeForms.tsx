import type {
  Dispatch,
  FormEventHandler,
  InputHTMLAttributes,
  ReactNode,
  SetStateAction,
} from 'react';
import {
  ChevronDown,
  Info,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { BankSelectTrigger } from '../../components/bank/BankSelectTrigger';
import type { ApplyKolData, ApplyShopData } from '../../services/kyc.service';

function Field({
  label,
  id,
  children,
  full = false,
  wide = false,
  required = false,
  hint,
}: {
  label: string;
  id?: string;
  children: ReactNode;
  full?: boolean;
  wide?: boolean;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-[7px] min-w-0 ${full ? 'col-span-full' : ''} ${wide ? 'col-span-1 md:col-span-2' : ''}`}
    >
      <label htmlFor={id} className="text-[12px] font-[550] text-[#1A1612] leading-[1.5]">
        {label}
        {required && <span className="text-[#B88E4F]"> *</span>}
      </label>
      {children}
      {hint && <span className="text-[11px] text-[#7D715E] leading-[1.6]">{hint}</span>}
    </div>
  );
}

function TextField({
  label,
  full,
  wide,
  hint,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  full?: boolean;
  wide?: boolean;
  hint?: string;
}) {
  return (
    <Field
      label={label}
      id={input.id}
      full={full}
      wide={wide}
      required={input.required}
      hint={hint}
    >
      <input
        {...input}
        className="w-full min-w-0 h-[44px] p-[10px_13px] border border-[#EAE4D7] rounded-[11px] bg-white text-[13px] text-[#1A1612] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#A39783] placeholder:font-[400] focus:border-[#C59B58] focus:shadow-[0_0_0_3px_#FBF5EB] max-[640px]:text-[16px]"
      />
    </Field>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-start gap-[10px] mb-[17px]">
        <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] border border-[#EEDFC6] rounded-[8px] bg-[#FBF5EB] text-[#B88E4F] text-[12px] font-[600]">
          {number}
        </span>
        <div>
          <h4 className="m-0 text-[14px] leading-[1.6] font-[650] text-[#1A1612]">{title}</h4>
          <p className="m-[2px_0_0] text-[11px] text-[#7D715E] leading-[1.6]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function FormHeader({ shop = false }: { shop?: boolean }) {
  return (
    <header className="flex items-center justify-between gap-[18px] p-[20px_22px] border-b border-[#EAE4D7] max-[640px]:flex-wrap max-[640px]:p-[17px]">
      <div className="flex items-center gap-[12px] min-w-0">
        <span className="w-[40px] h-[40px] border border-[#EEDFC6] rounded-[12px] bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center shrink-0">
          {shop ? <Store size={20} /> : <Sparkles size={20} />}
        </span>
        <div>
          <h3 className="m-0 text-[17px] font-[650] tracking-[-0.4px] leading-[1.5] text-[#1A1612] max-[640px]:text-[15px]">
            {shop ? 'Hồ sơ mở gian hàng' : 'Hồ sơ đăng ký KOL'}
          </h3>
          <p className="m-[3px_0_0] text-[12px] text-[#7D715E] leading-[1.6]">
            {shop
              ? 'Thông tin kinh doanh, giấy tờ và tài khoản nhận doanh thu.'
              : 'Thông tin kênh, giấy tờ định danh và tài khoản nhận hoa hồng.'}
          </p>
        </div>
      </div>
    </header>
  );
}

function FormFooter({
  submitting,
  shop = false,
}: {
  submitting: boolean;
  shop?: boolean;
}) {
  return (
    <footer className="border-t border-[#EAE4D7] p-[17px_22px] flex items-center justify-between gap-[20px] max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-[13px] max-[640px]:p-[17px]">
      <p className="flex items-center gap-[9px] text-[11px] text-[#7D715E] leading-[1.6] m-0">
        <ShieldCheck size={18} className="text-[#B88E4F] shrink-0" />
        <span>
          Thông tin dùng để xác minh hồ sơ và đối soát.
          <br />
          Các mục có dấu * là bắt buộc.
        </span>
      </p>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-[9px] bg-[#C59B58] hover:bg-[#B88E4F] text-white border border-[#C59B58] rounded-[11px] p-[11px_18px] text-[12px] font-[650] whitespace-nowrap cursor-pointer transition-[background] duration-150 disabled:opacity-55 disabled:cursor-wait max-[640px]:w-full"
      >
        <Send size={15} />
        {submitting
          ? 'Đang gửi hồ sơ…'
          : shop
            ? 'Gửi hồ sơ mở gian hàng'
            : 'Gửi hồ sơ KOL'}
      </button>
    </footer>
  );
}

function ShopReviewGuide() {
  return (
    <details className="border border-[#EAE4D7] rounded-[11px] bg-white text-[12px] text-[#7D715E] leading-[1.6] [&[open]_.shop-guide-arrow]:rotate-180">
      <summary className="flex items-center gap-[9px] p-[11px_13px] cursor-pointer list-none select-none max-[640px]:flex-wrap [&::-webkit-details-marker]:none">
        <ShieldCheck aria-hidden="true" size={17} className="text-[#B88E4F] shrink-0" />
        <span className="font-[550] text-[#1A1612]">Hồ sơ được xét duyệt trước khi mở quyền bán hàng</span>
        <span className="ml-auto inline-flex items-center gap-[6px] text-[#8F682E] font-[600] whitespace-nowrap text-[12px] max-[640px]:ml-[26px]">
          <span>Xem quy trình</span>
          <ChevronDown aria-hidden="true" size={14} className="shop-guide-arrow transition-transform duration-200" />
        </span>
      </summary>
      <div className="grid grid-cols-2 gap-[18px] p-[13px] border-t border-[#EAE4D7] max-[640px]:grid-cols-1 max-[640px]:gap-[12px]">
        <div>
          <strong className="block text-[#1A1612] text-[12px] font-[600] mb-[4px]">1. Xác minh gian hàng</strong>
          <p className="m-0 leading-[1.6]">
            Đối chiếu thông tin kinh doanh, giấy tờ người đại diện, kho hàng và
            tài khoản nhận tiền.
          </p>
        </div>
        <div>
          <strong className="block text-[#1A1612] text-[12px] font-[600] mb-[4px]">2. Kiểm tra sản phẩm</strong>
          <p className="m-0 leading-[1.6]">
            Giấy tờ nguồn gốc và các tài liệu liên quan được kiểm tra khi gian
            hàng đăng sản phẩm.
          </p>
        </div>
      </div>
    </details>
  );
}

type BankFields = Pick<
  ApplyKolData,
  'bankName' | 'bankAccountNumber' | 'bankAccountName'
>;
function BankDetails({
  form,
  onChange,
  prefix,
}: {
  form: BankFields;
  onChange: (key: keyof BankFields, value: string) => void;
  prefix: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-[7px] min-w-0 col-span-full">
        <span className="text-[12px] font-[550] text-[#1A1612] leading-[1.5]">
          Ngân hàng thụ hưởng <span className="text-[#B88E4F]">*</span>
        </span>
        <BankSelectTrigger
          value={form.bankName}
          onChange={(value) => onChange('bankName', value)}
          placeholder="Chọn ngân hàng"
          required
        />
      </div>
      <TextField
        id={`${prefix}-account`}
        label="Số tài khoản"
        inputMode="numeric"
        autoComplete="off"
        required
        value={form.bankAccountNumber}
        onChange={(event) => onChange('bankAccountNumber', event.target.value)}
        placeholder="Nhập số tài khoản"
      />
      <TextField
        id={`${prefix}-account-name`}
        label="Tên chủ tài khoản"
        required
        value={form.bankAccountName}
        onChange={(event) =>
          onChange('bankAccountName', event.target.value.toUpperCase())
        }
        placeholder="Nhập tên chủ tài khoản"
      />
    </>
  );
}

export function KolUpgradeForm({
  form,
  setForm,
  onSubmit,
  submitting,
  rejectionReason,
}: {
  form: ApplyKolData;
  setForm: Dispatch<SetStateAction<ApplyKolData>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitting: boolean;
  rejectionReason?: string;
}) {
  const patch = <K extends keyof ApplyKolData>(
    key: K,
    value: ApplyKolData[K],
  ) => setForm((previous) => ({ ...previous, [key]: value }));
  return (
    <form
      id="partner-upgrade-form"
      className="min-w-0 border border-[#EAE4D7] rounded-[18px] bg-white overflow-visible"
      autoComplete="off"
      onSubmit={onSubmit}
    >
      <FormHeader />
      <div className="p-[22px] grid gap-[22px] max-[640px]:p-[17px] max-[640px]:gap-[20px]">
        {rejectionReason && (
          <div className="flex items-start gap-[10px] border border-[#EEDFC6] rounded-[12px] p-[12px_14px] bg-[#FBF5EB] text-[12px] text-[#7D715E] leading-[1.7]">
            <Info size={17} className="text-[#B88E4F] shrink-0 mt-[2px]" />
            <div>
              <strong className="block text-[#8F682E] font-[600]">Ghi chú xét duyệt</strong>
              {rejectionReason}
            </div>
          </div>
        )}
        <Section
          number={1}
          title="Kênh truyền thông"
          description="Cung cấp kênh chính và ảnh xác nhận quyền quản trị."
        >
          <div className="grid gap-[15px] grid-cols-3 max-[640px]:grid-cols-1">
            <Field label="Nền tảng chính" id="kol-platform" required>
              <CustomSelect
                id="kol-platform"
                value={form.platform || ''}
                onChange={(value) =>
                  patch('platform', value as ApplyKolData['platform'])
                }
                options={[
                  { value: 'TIKTOK', label: 'TikTok' },
                  { value: 'FACEBOOK', label: 'Facebook' },
                  { value: 'YOUTUBE', label: 'YouTube' },
                  { value: 'INSTAGRAM', label: 'Instagram' },
                  { value: 'LEMON8', label: 'Lemon8' },
                  { value: 'OTHER', label: 'Nền tảng khác' },
                ]}
                placeholder="Chọn nền tảng"
                required
              />
            </Field>
            <TextField
              id="kol-channel-name"
              label="Tên kênh"
              required
              value={form.channelName}
              onChange={(event) => patch('channelName', event.target.value)}
              placeholder="Nhập tên kênh"
            />
            <TextField
              id="kol-followers"
              label="Số người theo dõi"
              type="number"
              min={0}
              required
              value={form.followerCount}
              onChange={(event) =>
                patch(
                  'followerCount',
                  event.target.value === ''
                    ? ('' as unknown as number)
                    : Number(event.target.value),
                )
              }
              placeholder="Nhập số người theo dõi"
            />
            <TextField
              id="kol-channel-url"
              label="Liên kết kênh"
              type="url"
              full
              required
              value={form.channelUrl}
              onChange={(event) => patch('channelUrl', event.target.value)}
              placeholder="Nhập liên kết kênh"
            />
          </div>
          <div className="mt-[14px]">
            <ImageUploadDropzone
              variant="document"
              label="Ảnh trang quản trị kênh"
              helperText="Ảnh trang quản trị (TikTok Studio, Meta Business Suite…); hiển thị tên kênh và quyền quản trị."
              value={form.channelProofUrl}
              onChange={(value) => patch('channelProofUrl', value)}
              iconType="camera"
              folder="scanms/kyc/proofs"
            />
          </div>
        </Section>
        <div className="grid grid-cols-2 gap-[20px] pt-[22px] border-t border-[#EAE4D7] max-[1100px]:grid-cols-1">
          <Section
            number={2}
            title="Định danh cá nhân"
            description="Ảnh rõ nét, đầy đủ bốn góc của giấy tờ."
          >
            <div className="grid gap-[15px] grid-cols-2 max-[640px]:grid-cols-1">
              <TextField
                id="kol-id"
                label="Số CCCD / CMND"
                inputMode="numeric"
                maxLength={12}
                required
                value={form.idCardNumber}
                onChange={(event) => patch('idCardNumber', event.target.value)}
                placeholder="Nhập 9–12 chữ số"
              />
              <TextField
                id="kol-tax"
                label="Mã số thuế cá nhân"
                inputMode="numeric"
                value={form.taxCode || ''}
                onChange={(event) => patch('taxCode', event.target.value)}
                placeholder="Không bắt buộc"
              />
              <ImageUploadDropzone
                variant="document"
                label="CCCD mặt trước"
                value={form.frontCardUrl}
                onChange={(value) => patch('frontCardUrl', value)}
                iconType="idcard"
                folder="scanms/kyc/idcards"
                required
              />
              <ImageUploadDropzone
                variant="document"
                label="CCCD mặt sau"
                value={form.backCardUrl}
                onChange={(value) => patch('backCardUrl', value)}
                iconType="idcard"
                folder="scanms/kyc/idcards"
                required
              />
            </div>
          </Section>
          <Section
            number={3}
            title="Tài khoản nhận hoa hồng"
            description="Tên chủ tài khoản cần khớp với thông tin định danh."
          >
            <div className="grid gap-[15px] grid-cols-2 max-[640px]:grid-cols-1">
              <BankDetails prefix="kol" form={form} onChange={patch} />
              <Field label="Giới thiệu & ngành hàng thế mạnh" id="kol-bio" full>
                <textarea
                  id="kol-bio"
                  rows={2}
                  className="w-full min-w-0 p-[10px_13px] border border-[#EAE4D7] rounded-[11px] bg-white text-[13px] text-[#1A1612] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#A39783] placeholder:font-[400] focus:border-[#C59B58] focus:shadow-[0_0_0_3px_#FBF5EB] resize-y min-h-[78px] max-[640px]:text-[16px]"
                  value={form.bio || ''}
                  onChange={(event) => patch('bio', event.target.value)}
                  placeholder="Nội dung bạn sáng tạo và ngành hàng phù hợp…"
                />
              </Field>
            </div>
          </Section>
        </div>
      </div>
      <FormFooter submitting={submitting} />
    </form>
  );
}

export function ShopUpgradeForm({
  form,
  setForm,
  onSubmit,
  submitting,
  reviewNote,
}: {
  form: ApplyShopData;
  setForm: Dispatch<SetStateAction<ApplyShopData>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitting: boolean;
  reviewNote?: string | null;
}) {
  const patch = <K extends keyof ApplyShopData>(
    key: K,
    value: ApplyShopData[K],
  ) => setForm((previous) => ({ ...previous, [key]: value }));
  return (
    <form
      id="partner-upgrade-form"
      className="min-w-0 border border-[#EAE4D7] rounded-[18px] bg-white overflow-visible"
      autoComplete="off"
      onSubmit={onSubmit}
    >
      <FormHeader shop />
      <div className="p-[22px] grid gap-[22px] max-[640px]:p-[17px] max-[640px]:gap-[20px]">
        <ShopReviewGuide />
        {reviewNote && (
          <div className="flex items-start gap-[10px] border border-[#EEDFC6] rounded-[12px] p-[12px_14px] bg-[#FBF5EB] text-[12px] text-[#7D715E] leading-[1.7]">
            <Info size={17} className="text-[#B88E4F] shrink-0 mt-[2px]" />
            <div>
              <strong className="block text-[#8F682E] font-[600]">Ghi chú từ Ban Quản Trị</strong>
              {reviewNote}
            </div>
          </div>
        )}
        <Section
          number={1}
          title="Gian hàng & liên hệ"
          description="Thông tin kinh doanh và liên hệ để xét duyệt hồ sơ."
        >
          <div className="grid gap-[15px] grid-cols-3 max-[640px]:grid-cols-1">
            <div className="col-span-2 max-[640px]:col-span-1">
              <TextField
                id="shop-name"
                label="Tên gian hàng / thương hiệu"
                required
                value={form.shopName}
                onChange={(event) => patch('shopName', event.target.value)}
                placeholder="Nhập tên gian hàng"
              />
            </div>
            <Field
              id="shop-business-type"
              label="Hình thức kinh doanh"
              required
            >
              <CustomSelect
                id="shop-business-type"
                value={form.businessType}
                onChange={(value) =>
                  patch('businessType', value as ApplyShopData['businessType'])
                }
                options={[
                  { value: 'ENTERPRISE', label: 'Doanh nghiệp / Công ty' },
                  { value: 'HOUSEHOLD', label: 'Hộ kinh doanh' },
                  { value: 'INDIVIDUAL', label: 'Cá nhân kinh doanh' },
                ]}
                placeholder="Chọn hình thức"
                required
              />
            </Field>
            <TextField
              id="shop-tax"
              label="Mã số thuế"
              required
              value={form.taxCode}
              onChange={(event) => patch('taxCode', event.target.value)}
              placeholder="Nhập mã số thuế"
            />
            <TextField
              id="shop-phone"
              label="Điện thoại liên hệ"
              type="tel"
              required
              value={form.contactPhone}
              onChange={(event) => patch('contactPhone', event.target.value)}
              placeholder="Nhập số điện thoại"
            />
            <TextField
              id="shop-email"
              label="Email đối soát"
              type="email"
              required
              value={form.contactEmail}
              onChange={(event) => patch('contactEmail', event.target.value)}
              placeholder="Nhập email đối soát"
            />
            <TextField
              id="shop-warehouse"
              label="Địa chỉ kho xuất hàng"
              full
              required
              value={form.warehouseAddress}
              onChange={(event) =>
                patch('warehouseAddress', event.target.value)
              }
              placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
              hint="Địa chỉ thực tế để xử lý vận chuyển và đối soát."
            />
          </div>
        </Section>
        <div className="grid grid-cols-2 gap-[20px] pt-[22px] border-t border-[#EAE4D7] max-[1100px]:grid-cols-1">
          <Section
            number={2}
            title="Giấy tờ kinh doanh & định danh"
            description="Tải ảnh chụp hoặc bản scan rõ nét, đầy đủ thông tin."
          >
            <div className="grid gap-[15px] grid-cols-2 max-[640px]:grid-cols-1">
              <TextField
                id="shop-owner-id"
                label="CCCD người đại diện"
                inputMode="numeric"
                maxLength={12}
                full
                required
                value={form.idCardNumber || ''}
                onChange={(event) =>
                  patch('idCardNumber', event.target.value.replace(/\D/g, ''))
                }
                placeholder="Nhập 9–12 chữ số"
              />
              <ImageUploadDropzone
                variant="document"
                label="CCCD mặt trước"
                value={form.frontCardUrl || ''}
                onChange={(value) => patch('frontCardUrl', value)}
                iconType="idcard"
                folder="scanms/kyc/shop_idcards"
                required
              />
              <ImageUploadDropzone
                variant="document"
                label="CCCD mặt sau"
                value={form.backCardUrl || ''}
                onChange={(value) => patch('backCardUrl', value)}
                iconType="idcard"
                folder="scanms/kyc/shop_idcards"
                required
              />
              <ImageUploadDropzone
                variant="document"
                label="Giấy đăng ký kinh doanh"
                value={form.businessLicenseUrl || ''}
                onChange={(value) => patch('businessLicenseUrl', value)}
                iconType="file"
                folder="scanms/kyc/licenses"
                required
              />
              <ImageUploadDropzone
                variant="document"
                label="Ủy quyền thương hiệu"
                helperText="Không bắt buộc. Có thể dùng hợp đồng phân phối."
                value={form.brandAuthorizationUrl || ''}
                onChange={(value) => patch('brandAuthorizationUrl', value)}
                iconType="file"
                folder="scanms/kyc/authorizations"
              />
            </div>
          </Section>
          <Section
            number={3}
            title="Tài khoản nhận doanh thu"
            description="Thông tin nhận tiền sau khi đơn hàng được đối soát."
          >
            <div className="grid gap-[15px] grid-cols-2 max-[640px]:grid-cols-1">
              <BankDetails prefix="shop" form={form} onChange={patch} />
              <Field label="Giới thiệu gian hàng" id="shop-description" full>
                <textarea
                  id="shop-description"
                  rows={3}
                  className="w-full min-w-0 p-[10px_13px] border border-[#EAE4D7] rounded-[11px] bg-white text-[13px] text-[#1A1612] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#A39783] placeholder:font-[400] focus:border-[#C59B58] focus:shadow-[0_0_0_3px_#FBF5EB] resize-y min-h-[78px] max-[640px]:text-[16px]"
                  value={form.description || ''}
                  onChange={(event) => patch('description', event.target.value)}
                  placeholder="Ngành hàng chính và giới thiệu ngắn về gian hàng…"
                />
              </Field>
            </div>
          </Section>
        </div>
      </div>
      <FormFooter shop submitting={submitting} />
    </form>
  );
}

