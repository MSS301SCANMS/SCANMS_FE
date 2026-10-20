import type { FormEvent } from 'react';
import { Loader2, Lock, MapPin, Shield, ShieldCheck, User } from 'lucide-react';
import './CustomerIdentityForm.css';

interface CustomerIdentityFormProps {
  fullName: string;
  idNumber: string;
  address: string;
  submitting: boolean;
  onNameChange: (value: string) => void;
  onIdNumberChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CustomerIdentityForm({ fullName, idNumber, address, submitting, onNameChange, onIdNumberChange, onAddressChange, onSubmit }: CustomerIdentityFormProps) {
  return (
    <form className="customer-identity-form" onSubmit={onSubmit} aria-label="Thông tin định danh">
      <div className="customer-identity-fields">
        <div className="customer-identity-field">
          <label htmlFor="customer-identity-name">Họ và tên <span aria-hidden="true">*</span></label>
          <div className="customer-identity-input">
            <User size={16} aria-hidden="true" />
            <input id="customer-identity-name" type="text" autoComplete="name" aria-required="true" aria-describedby="customer-identity-name-hint"
              value={fullName} onChange={event => onNameChange(event.target.value)} placeholder="Nhập họ và tên trên CCCD" />
          </div>
          <p className="customer-identity-hint" id="customer-identity-name-hint">Nhập đầy đủ, đúng như trên CCCD.</p>
        </div>

        <div className="customer-identity-field">
          <label htmlFor="customer-identity-number">Số CCCD <span aria-hidden="true">*</span></label>
          <div className="customer-identity-input">
            <Shield size={16} aria-hidden="true" />
            <input id="customer-identity-number" type="text" inputMode="numeric" autoComplete="off" maxLength={12} aria-required="true"
              aria-describedby="customer-identity-number-hint" value={idNumber} onChange={event => onIdNumberChange(event.target.value.replace(/\D/g, ''))}
              placeholder="Nhập 12 chữ số trên CCCD" />
          </div>
          <p className="customer-identity-hint" id="customer-identity-number-hint">Gồm 12 chữ số, không có khoảng trắng.</p>
        </div>

        <div className="customer-identity-field customer-identity-address">
          <label htmlFor="customer-identity-address">Địa chỉ thường trú <span aria-hidden="true">*</span></label>
          <div className="customer-identity-input customer-identity-input--multiline">
            <MapPin size={16} aria-hidden="true" />
            <textarea id="customer-identity-address" rows={3} autoComplete="street-address" maxLength={200} aria-required="true"
              aria-describedby="customer-identity-address-hint customer-identity-address-count" value={address}
              onChange={event => onAddressChange(event.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố theo CCCD" />
          </div>
          <div className="customer-identity-address-help">
            <p className="customer-identity-hint" id="customer-identity-address-hint">Ghi đầy đủ địa chỉ thường trú trên CCCD.</p>
            <span id="customer-identity-address-count">{address.length}/200</span>
          </div>
        </div>
      </div>

      <footer className="customer-identity-footer">
        <p className="customer-identity-privacy"><Lock size={15} aria-hidden="true" /><span>Thông tin được bảo mật theo chính sách SCANMS.</span></p>
        <button type="submit" className="customer-identity-submit" disabled={submitting || !fullName.trim() || !idNumber.trim() || !address.trim()} aria-busy={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
          {submitting ? 'Đang xác nhận…' : 'Xác nhận thông tin'}
        </button>
      </footer>
    </form>
  );
}
