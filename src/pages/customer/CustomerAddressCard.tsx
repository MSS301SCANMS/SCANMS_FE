import { CheckCircle2, Edit2, MapPin, Trash2 } from 'lucide-react';
import type { CustomerAddress } from '../../services/customer.service';
import './CustomerAddressCard.css';

interface CustomerAddressCardProps {
  address: CustomerAddress;
  onEdit: (address: CustomerAddress) => void;
  onDelete: (address: CustomerAddress) => void;
  onSetDefault: (id: string) => void;
}

export function CustomerAddressCard({ address, onEdit, onDelete, onSetDefault }: CustomerAddressCardProps) {
  const locality = [address.wardName, address.districtName, address.provinceName].filter(Boolean).join(', ');

  return (
    <article className="customer-address-card" data-default={address.isDefault} aria-label={`Địa chỉ của ${address.fullName}`}>
      <div className="customer-address-content">
        <span className="customer-address-pin" aria-hidden="true"><MapPin size={19} /></span>
        <div className="customer-address-info">
          <div className="customer-address-heading">
            <h3>{address.fullName}</h3>
            {address.isDefault && (
              <span className="customer-address-default"><CheckCircle2 size={12} aria-hidden="true" />Mặc định</span>
            )}
          </div>
          <p className="customer-address-phone">{address.phoneNumber}</p>
          <div className="customer-address-location">
            <p className="customer-address-street">{address.detailAddress}</p>
            {locality && <p className="customer-address-locality">{locality}</p>}
          </div>
        </div>
      </div>
      <footer className="customer-address-footer">
        {!address.isDefault && (
          <button type="button" className="customer-address-set-default" onClick={() => onSetDefault(address.id)}>
            Đặt làm mặc định
          </button>
        )}
        <div className="customer-address-actions">
          <button type="button" className="customer-address-edit" onClick={() => onEdit(address)} aria-label={`Sửa địa chỉ của ${address.fullName}`}>
            <Edit2 size={14} aria-hidden="true" />Chỉnh sửa
          </button>
          <button type="button" className="customer-address-delete" onClick={() => onDelete(address)} aria-label={`Xóa địa chỉ của ${address.fullName}`}>
            <Trash2 size={14} aria-hidden="true" />Xóa
          </button>
        </div>
      </footer>
    </article>
  );
}
