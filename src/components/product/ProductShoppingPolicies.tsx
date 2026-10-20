import { useId, useState } from 'react';
import { BadgeCheck, ChevronDown, RotateCcw, ShieldCheck, Truck, Wrench } from 'lucide-react';
import './ProductShoppingPolicies.css';

export function ProductShoppingPolicies({ storeName, policies }: {
  storeName: string;
  policies?: { genuineCommitment?: string; returnPolicy?: string; shipping?: string; warranty?: string };
}) {
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const items = [
    { key: 'origin', label: 'Nguồn gốc', title: 'Nguồn gốc sản phẩm', icon: BadgeCheck,
      content: policies?.genuineCommitment?.trim() || 'Liên hệ Shop để được cung cấp thông tin xuất xứ và chứng từ sản phẩm.' },
    { key: 'returns', label: 'Đổi trả', title: 'Đổi trả & hoàn tiền', icon: RotateCcw,
      content: policies?.returnPolicy?.trim() || 'Shop chưa công bố chính sách đổi trả riêng. Vui lòng liên hệ Shop để xác nhận điều kiện trước khi mua.' },
    { key: 'shipping', label: 'Giao nhận', title: 'Giao nhận & kiểm tra hàng', icon: Truck,
      content: policies?.shipping?.trim() || 'Phí và phương thức vận chuyển hiển thị khi thanh toán. Vui lòng xác nhận điều kiện kiểm tra hàng với Shop.' },
    { key: 'warranty', label: 'Bảo hành', title: 'Điều kiện bảo hành', icon: Wrench,
      content: policies?.warranty?.trim() || 'Shop chưa công bố điều kiện bảo hành riêng. Vui lòng liên hệ Shop để được tư vấn cho sản phẩm này.' },
  ];
  const active = items.find(item => item.key === selected);
  return <section className="product-shopping-policies" aria-labelledby={`${id}-heading`}>
    <header className="psp-heading">
      <span className="psp-heading-icon"><ShieldCheck size={18} /></span>
      <div><h3 id={`${id}-heading`}>An tâm mua sắm</h3><p>Chính sách của {storeName}</p></div>
      <button type="button" className="psp-toggle" aria-expanded={!!active} aria-controls={`${id}-details`}
        onClick={() => setSelected(active ? null : 'returns')}>{active ? 'Thu gọn' : 'Xem chi tiết'}</button>
    </header>
    <div className="psp-options">
      {items.map(item => <button key={item.key} type="button" className={`psp-option${selected === item.key ? ' is-selected' : ''}`}
        aria-expanded={selected === item.key} aria-controls={`${id}-details`}
        onClick={() => setSelected(selected === item.key ? null : item.key)}>
        <item.icon size={15} /><span>{item.label}</span><ChevronDown size={13} className="psp-chevron" />
      </button>)}
    </div>
    <div id={`${id}-details`} hidden={!active} className="psp-details" role="region" aria-labelledby={`${id}-detail-title`}>
      {active && <><h4 id={`${id}-detail-title`}>{active.title}</h4><p>{active.content}</p></>}
    </div>
  </section>;
}
