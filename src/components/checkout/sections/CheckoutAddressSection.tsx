import React from 'react';
import {
  MapPin,
  Lock,
  LogIn,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { GoogleOfficialButton } from '../../auth/GoogleOfficialButton';
import { CustomSelect } from '../../ui/CustomSelect';
import { AddressLocationPicker, type AddressLocationResult } from '../../customer/AddressLocationPicker';
import type { CustomerAddress } from '../../../services/customer.service';
import type { ShippingProvince } from '../../../services/order-address.service';

interface CheckoutAddressSectionProps {
  currentUser: any;
  isSignedIn: boolean;
  loginError: string | null;
  isLoggingIn: boolean;
  showPasswordLogin: boolean;
  setShowPasswordLogin: (show: boolean) => void;
  loginIdentifier: string;
  setLoginIdentifier: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  onGoogleSuccess: (idToken: string) => void;
  onPasswordLogin: (e: React.FormEvent) => void;
  onGoogleError: (errMsg: string) => void;

  hasCompleteShippingAddress: boolean;
  fullShippingAddressString: string;
  isEditingAddress: boolean;
  setIsEditingAddress: React.Dispatch<React.SetStateAction<boolean>>;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
  shippingAddress: string;
  setShippingAddress: (addr: string) => void;

  customerAddresses: CustomerAddress[];
  selectedSavedAddressId: string;
  onSelectSavedAddress: (id: string) => void;
  onStartNewAddress: () => void;
  addressToDelete: CustomerAddress | null;
  setAddressToDelete: (addr: CustomerAddress | null) => void;
  isDeletingAddress: boolean;
  onConfirmDeleteAddress: (addr: CustomerAddress) => void;

  shippingProvinces: ShippingProvince[];
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  selectedProvince?: ShippingProvince;
  selectedDistrict?: any;
  selectedWard?: any;
  addressLoading: boolean;
  addressError: string | null;
  onProvinceChange: (code: string) => void;
  onDistrictChange: (code: string) => void;
  onWardChange: (code: string) => void;
  onRetryLoadAddresses: () => void;

  deliveryLocation: { latitude: number; longitude: number } | null;
  mapResetKey: number;
  mappedAddress: AddressLocationResult | null;
  onLocationChange: (result: AddressLocationResult) => void;

  saveToAddressBook: boolean;
  setSaveToAddressBook: (val: boolean) => void;
  setAsDefaultAddress: boolean;
  setSetAsDefaultAddress: (val: boolean) => void;
  addressValidationField: string | null;
  markAddressEdited: (dirtyShipping?: boolean) => void;
  isPhoneValid: (phone: string) => boolean;
}

/**
 * Quản lý địa chỉ giao hàng và xác thực tài khoản khách hàng khi thanh toán.
 * Tách biệt theo quy chuẩn Component Decomposition của Nam (UI Architecture).
 */
export const CheckoutAddressSection: React.FC<CheckoutAddressSectionProps> = ({
  currentUser,
  isSignedIn,
  loginError,
  isLoggingIn,
  showPasswordLogin,
  setShowPasswordLogin,
  loginIdentifier,
  setLoginIdentifier,
  loginPassword,
  setLoginPassword,
  onGoogleSuccess,
  onPasswordLogin,
  onGoogleError,

  hasCompleteShippingAddress,
  fullShippingAddressString,
  isEditingAddress,
  setIsEditingAddress,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  shippingAddress,
  setShippingAddress,

  customerAddresses,
  selectedSavedAddressId,
  onSelectSavedAddress,
  onStartNewAddress,
  addressToDelete,
  setAddressToDelete,
  isDeletingAddress,
  onConfirmDeleteAddress,

  shippingProvinces,
  provinceCode,
  districtCode,
  wardCode,
  selectedProvince,
  selectedDistrict,
  selectedWard,
  addressLoading,
  addressError,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  onRetryLoadAddresses,

  deliveryLocation,
  mapResetKey,
  mappedAddress,
  onLocationChange,

  saveToAddressBook,
  setSaveToAddressBook,
  setAsDefaultAddress,
  setSetAsDefaultAddress,
  addressValidationField,
  markAddressEdited,
  isPhoneValid,
}) => {
  return (
    <>
      {/* 1. Gate xác thực tài khoản nếu khách chưa đăng nhập */}
      {!currentUser && (
        <div
          id="mandatory-auth-gate"
          className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FBF5EB] to-[#FAF8F5] border-2 border-[#C59B58] shadow-sm text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C59B58] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#EEDFC6] text-[10px] font-bold text-[#B88E4F] uppercase tracking-wider mb-1">
                XÁC THỰC TÀI KHOẢN KHÁCH HÀNG
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#1A1612]">
                Đăng nhập để tiếp tục thanh toán
              </h3>
              <p className="text-xs text-[#7D715E] mt-1 leading-relaxed">
                Vui lòng xác thực tài khoản Google hoặc Email để quản lý đơn mua và kích hoạt bảo hộ Escrow 14 ngày.
              </p>

              {loginError && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className={`shrink-0 min-w-[220px] ${isLoggingIn ? 'pointer-events-none opacity-60' : ''}`}>
                  <GoogleOfficialButton
                    onSuccess={onGoogleSuccess}
                    text="continue_with"
                    onError={onGoogleError}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                    className="px-3.5 py-2.5 bg-white border border-[#EAE4D7] hover:border-[#1A1612] text-[#1A1612] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#7D715E]" />
                    <span>{showPasswordLogin ? 'Đóng đăng nhập bằng mật khẩu' : 'Đăng nhập bằng mật khẩu'}</span>
                  </button>
                </div>
              </div>

              {showPasswordLogin && (
                <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-[#EAE4D7] space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      autoComplete="username"
                      aria-label="Email hoặc số điện thoại đã đăng ký"
                      placeholder="Email hoặc số điện thoại"
                      maxLength={254}
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-lg text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                    />
                    <input
                      type="password"
                      placeholder="Mật khẩu"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-lg text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#7D715E]">
                      Chưa có tài khoản? Nhấn nút Google ở trên để đăng ký 1 chạm.
                    </span>
                    <button
                      type="button"
                      disabled={isLoggingIn}
                      onClick={onPasswordLogin}
                      className="px-4 py-2 bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {isLoggingIn && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Đăng nhập ngay</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Thẻ hiển thị / Sửa đổi địa chỉ nhận hàng */}
      <div
        className="checkout-section checkout-address min-w-0 border border-[#EAE4D7] rounded-[14px] bg-[color:#FFFFFF] text-left border-t-[3px] border-t-[#C59B58] p-[0_24px_22px] [&_>_.checkout-section-heading]:pl-0 [&_>_.checkout-section-heading]:pr-0 [&_input:not([type='checkbox']):not([type='radio'])]:min-h-[42px] [&_input:not([type='checkbox']):not([type='radio'])]:border-[#EAE4D7] [&_input:not([type='checkbox']):not([type='radio'])]:rounded-[8px] [&_select]:min-h-[42px] [&_select]:border-[#EAE4D7] [&_select]:rounded-[8px] [@media_(max-width:639px)]:p-[0_16px_18px]"
        aria-labelledby="checkout-address-title"
      >
        <header className="checkout-section-heading flex items-center justify-between flex-wrap gap-[10px_16px] min-w-0 p-[18px_24px] border-b border-b-[#EAE4D7] [&_h2]:[font-family:inherit]! [&_h2]:text-[16px] [&_h2]:font-[650] [&_h2]:leading-[1.5] [&_h2]:[font-style:inherit] [&_h2]:[font-variant:inherit] [&_h2]:[font-stretch:inherit] [&_h2]:flex [&_h2]:items-center [&_h2]:gap-[9px] [&_h2]:min-w-0 [&_h2]:m-0 [&_h2_>_svg]:shrink-0 [&_h2_>_svg]:text-[color:#B88E4F]! [@media_(max-width:639px)]:p-[16px] [@media_(max-width:639px)]:[&_h2]:text-[15px]">
          <h2 id="checkout-address-title">
            <MapPin size={19} aria-hidden="true" />
            Địa chỉ nhận hàng
          </h2>
        </header>

        <div className="checkout-address-body">
          <div className="checkout-address-summary flex items-start justify-between gap-[16px] pt-[18px] [@media_(max-width:639px)]:gap-[10px]">
            <div className="checkout-address-summary-info flex flex-col items-start gap-[7px] min-w-0 text-[13px] leading-[1.65] [&_strong]:font-[600] [&_>_span]:text-[color:#7D715E]! [&_>_span]:[overflow-wrap:anywhere] [&_.checkout-address-label]:inline-flex [&_.checkout-address-label]:p-[2px_7px] [&_.checkout-address-label]:border [&_.checkout-address-label]:border-[#EEDFC6] [&_.checkout-address-label]:rounded-[5px] [&_.checkout-address-label]:bg-[color:#FBF5EB] [&_.checkout-address-label]:text-[color:#8A642C]! [&_.checkout-address-label]:text-[10px] [&_.checkout-address-label]:font-[550] [@media_(max-width:639px)]:text-[12px]">
              <strong>{customerName ? `${customerName} · ${customerPhone || 'Chưa có SĐT'}` : 'Chưa nhập thông tin nhận hàng'}</strong>
              <span>
                {hasCompleteShippingAddress
                  ? fullShippingAddressString
                  : fullShippingAddressString
                  ? `Đang nhập địa chỉ: ${fullShippingAddressString}`
                  : 'Thêm địa chỉ để tính phí vận chuyển và nhận hàng.'}
              </span>
              {hasCompleteShippingAddress && customerAddresses.find((a) => a.id === selectedSavedAddressId)?.isDefault ? (
                <span className="checkout-address-label">Mặc định</span>
              ) : hasCompleteShippingAddress && !selectedSavedAddressId ? (
                <span className="checkout-address-label">Địa chỉ giao mới</span>
              ) : null}
            </div>

            <button
              type="button"
              className="checkout-address-change [font-family:inherit]! text-[12px] font-[550] leading-[inherit] [font-style:inherit] [font-variant:inherit] [font-stretch:inherit] inline-flex items-center justify-center shrink-0 gap-[6px] min-h-[44px] p-[8px_12px] border border-[#EAE4D7] rounded-[8px] bg-[color:#FFFFFF] text-[color:#8A642C]! cursor-pointer [&:hover]:border-[#EEDFC6] [&:hover]:bg-[color:#FBF5EB] disabled:cursor-not-allowed disabled:opacity-50 [@media_(max-width:639px)]:p-[8px] [@media_(max-width:639px)]:text-[11px]"
              disabled={isEditingAddress && !hasCompleteShippingAddress}
              onClick={() => setIsEditingAddress((prev) => !prev)}
            >
              {isEditingAddress ? (hasCompleteShippingAddress ? 'Thu gọn' : 'Đang nhập') : 'Thay Đổi'}
            </button>
          </div>

          {/* Form chi tiết địa chỉ */}
          {(!hasCompleteShippingAddress || isEditingAddress) && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3.5 animate-in fade-in duration-150">
              {/* Sổ địa chỉ đã lưu */}
              {customerAddresses.length > 0 && (
                <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B88E4F] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#B88E4F]" />
                      Chọn từ sổ địa chỉ đã lưu ({customerAddresses.length} địa chỉ)
                    </span>
                    <button
                      type="button"
                      onClick={onStartNewAddress}
                      className="px-2.5 py-1 text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB] rounded-md border border-[#EEDFC6] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Giao đến địa chỉ khác</span>
                    </button>
                  </div>

                  {!selectedSavedAddressId && (
                    <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50/90 text-amber-900 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <MapPin className="w-4 h-4 text-[#C59B58] shrink-0" />
                        Đang sử dụng địa chỉ giao hàng mới bên dưới
                      </span>
                      <span className="text-[11px] text-[#7D715E]">
                        (Bấm vào thẻ địa chỉ ở trên nếu muốn dùng lại)
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {customerAddresses.map((a) => {
                      const isSelected = selectedSavedAddressId === a.id;
                      return (
                        <div
                          key={a.id}
                          onClick={() => onSelectSavedAddress(a.id)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#FBF5EB] border-[#C59B58] ring-1 ring-[#C59B58] shadow-2xs'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="space-y-1 text-xs min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-[#C59B58] bg-[#C59B58]' : 'border-gray-300 bg-white'
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <strong className="text-[#1A1612] font-bold">{a.fullName}</strong>
                              <span className="text-gray-500 font-mono">({a.phoneNumber})</span>
                              {a.isDefault && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-[#B88E4F] border border-[#EEDFC6] bg-[#FBF5EB]">
                                  Mặc Định
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 pl-5.5 leading-relaxed text-[11px]">
                              {a.detailAddress}, {a.wardName}, {a.districtName}, {a.provinceName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 self-center">
                            {isSelected && (
                              <span className="text-[11px] font-bold text-[#B88E4F]">
                                Đang dùng ✓
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddressToDelete(a);
                              }}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[#DC2626] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer active:scale-90 shrink-0"
                              title="Xóa địa chỉ này"
                              aria-label="Xóa địa chỉ"
                            >
                              <Trash2 className="w-4 h-4 text-[#DC2626]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Thông tin người nhận: Họ tên, SĐT, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="checkout-customer-name" className="block text-xs font-bold text-[#1A1612] mb-1">
                    Họ và tên người nhận <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="checkout-customer-name"
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàng Minh Tuấn"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      markAddressEdited();
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58] transition"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-customer-phone" className="block text-xs font-bold text-[#1A1612] mb-1">
                    Số điện thoại nhận hàng <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="checkout-customer-phone"
                    type="tel"
                    required
                    placeholder="Ví dụ: 0987654321"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      markAddressEdited();
                    }}
                    className={`w-full px-3.5 py-2 bg-white border rounded-md text-xs text-[#1A1612] focus:outline-none transition font-mono ${
                      customerPhone && !isPhoneValid(customerPhone)
                        ? 'border-[#DC2626] focus:border-[#DC2626]'
                        : 'border-gray-300 focus:border-[#C59B58]'
                    }`}
                  />
                  {customerPhone && !isPhoneValid(customerPhone) && (
                    <span className="text-[10px] text-[#DC2626] mt-1 block">
                      Số điện thoại chưa đúng định dạng Việt Nam (10 chữ số).
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="checkout-customer-email" className="block text-xs font-bold text-[#1A1612] mb-1">
                    Email nhận xác nhận đơn
                  </label>
                  <input
                    id="checkout-customer-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="Ví dụ: khachhang@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58] transition"
                  />
                  <p className="mt-1 mb-0 text-[10px] leading-relaxed text-[#7D715E]">
                    Tự động gửi thông tin đơn hàng. Để trống sẽ dùng email tài khoản đang đăng nhập.
                  </p>
                </div>
              </div>

              {/* Địa chỉ 3 cấp: Tỉnh / Quận / Phường */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CustomSelect
                  id="checkout-province"
                  required
                  value={provinceCode}
                  disabled={addressLoading}
                  onChange={onProvinceChange}
                  placeholder={addressLoading ? 'Đang tải Tỉnh/Thành...' : 'Chọn Tỉnh/Thành phố *'}
                  options={shippingProvinces.map((province) => ({
                    value: String(province.code),
                    label: province.name,
                  }))}
                />

                <CustomSelect
                  id="checkout-district"
                  required
                  value={districtCode}
                  disabled={!selectedProvince || addressLoading}
                  onChange={onDistrictChange}
                  placeholder="Chọn Quận/Huyện *"
                  options={(selectedProvince?.districts || []).map((district: any) => ({
                    value: String(district.code),
                    label: district.name,
                  }))}
                />

                <CustomSelect
                  id="checkout-ward"
                  required
                  value={wardCode}
                  disabled={!selectedDistrict || addressLoading}
                  onChange={onWardChange}
                  placeholder="Chọn Phường/Xã *"
                  options={(selectedDistrict?.wards || []).map((ward: any) => ({
                    value: String(ward.code),
                    label: ward.name,
                  }))}
                />
              </div>

              {addressError && (
                <p role="alert" className="text-[11px] text-[#DC2626] font-medium">
                  {addressError}{' '}
                  <button
                    type="button"
                    onClick={onRetryLoadAddresses}
                    className="ml-1 underline underline-offset-2 text-[#8A642C] cursor-pointer"
                  >
                    Tải lại danh mục
                  </button>
                </p>
              )}

              <div>
                <textarea
                  id="checkout-shipping-address"
                  required
                  rows={2}
                  placeholder="Số nhà, tên đường, ngõ/tổ, tòa nhà, căn hộ... *"
                  value={shippingAddress}
                  aria-invalid={addressValidationField === 'detail'}
                  aria-describedby={addressValidationField === 'detail' ? 'checkout-error' : undefined}
                  onChange={(e) => {
                    setShippingAddress(e.target.value);
                    markAddressEdited(true);
                  }}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58] transition resize-none"
                />
                {shippingAddress.trim().length > 0 && shippingAddress.trim().length < 5 && (
                  <p role="status" className="mt-1.5 text-[11px] text-[#795A2D]">
                    Vui lòng bổ sung địa chỉ chi tiết, ít nhất 5 ký tự, để tính phí giao hàng.
                  </p>
                )}
              </div>

              {/* Bản đồ chọn vị trí */}
              <AddressLocationPicker
                nationwide
                latitude={deliveryLocation?.latitude}
                longitude={deliveryLocation?.longitude}
                resetKey={mapResetKey}
                addressQuery={[
                  shippingAddress,
                  selectedWard?.name,
                  selectedDistrict?.name,
                  selectedProvince?.name,
                  'Việt Nam',
                ]
                  .filter(Boolean)
                  .join(', ')}
                onChange={onLocationChange}
              />

              {mappedAddress && (!selectedProvince || !selectedDistrict || !selectedWard) && (
                <p role="status" className="text-[11px] leading-relaxed text-[#7D715E]">
                  Đã ghim vị trí.{' '}
                  {addressLoading
                    ? 'Đang tải danh mục địa chỉ…'
                    : 'Một số địa danh chưa khớp với danh mục. Vui lòng chọn lại Tỉnh/Thành phố, Quận/Huyện và Phường/Xã trước khi đặt hàng.'}
                </p>
              )}

              {/* Checkbox lưu vào sổ địa chỉ */}
              {isSignedIn && !selectedSavedAddressId && (
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1A1612]">
                    <input
                      type="checkbox"
                      checked={saveToAddressBook}
                      onChange={(e) => setSaveToAddressBook(e.target.checked)}
                      className="rounded border-gray-300 text-[#C59B58] focus:ring-[#C59B58]"
                    />
                    <span>Lưu địa chỉ này vào sổ địa chỉ để dùng lại lần sau</span>
                  </label>
                  {saveToAddressBook && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1A1612]">
                      <input
                        type="checkbox"
                        checked={setAsDefaultAddress}
                        onChange={(e) => setSetAsDefaultAddress(e.target.checked)}
                        className="rounded border-gray-300 text-[#C59B58] focus:ring-[#C59B58]"
                      />
                      <span>Đặt làm địa chỉ mặc định</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal xác nhận xóa địa chỉ */}
      {addressToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isDeletingAddress && setAddressToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="delete-address-title" className="text-base font-bold text-[#1A1612]">
                  Xóa địa chỉ nhận hàng?
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5 leading-relaxed">
                  Địa chỉ này sẽ bị xóa khỏi sổ địa chỉ của bạn. Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 mb-5 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#1A1612] mb-1">
                <span>{addressToDelete.fullName}</span>
                <span className="text-gray-400">|</span>
                <span className="font-mono text-gray-600 font-medium">{addressToDelete.phoneNumber}</span>
                {addressToDelete.isDefault && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-[#B88E4F] border border-[#EEDFC6] bg-[#FBF5EB]">
                    Mặc định
                  </span>
                )}
              </div>
              <div className="text-gray-600 leading-relaxed text-[11px]">
                {[
                  addressToDelete.detailAddress,
                  addressToDelete.wardName,
                  addressToDelete.districtName,
                  addressToDelete.provinceName,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={() => setAddressToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition cursor-pointer select-none active:scale-95 disabled:opacity-50"
              >
                Trở lại
              </button>
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={() => onConfirmDeleteAddress(addressToDelete)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-rose-700 rounded-lg transition cursor-pointer select-none active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingAddress ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
