import { ChevronDown, Copy, ExternalLink, Globe, Link2 } from 'lucide-react';
import './StorefrontSettingsSection.css';

export function StorefrontSettingsSection({ url, path, description, onDescriptionChange, onCopy }: {
  url: string; path: string; description: string;
  onDescriptionChange: (value: string) => void;
  onCopy: () => void;
}) {
  return <details className="sf-settings">
    <summary className="sf-settings-heading">
      <span className="sf-settings-icon"><Globe size={19} /></span>
      <span className="sf-settings-title"><strong>Trang gian hàng</strong><small>Đường dẫn chia sẻ và giới thiệu thương hiệu</small></span>
      <ChevronDown className="sf-settings-chevron" size={18} />
    </summary>
    <div className="sf-settings-body">
      <div className="sf-settings-link-heading"><span><Link2 size={15} /> Đường dẫn trên SCANMS</span><small>Công khai</small></div>
      <div className="sf-settings-url">
        <input type="text" readOnly value={url} aria-label="Đường dẫn gian hàng trên SCANMS"
          placeholder="Đang tải đường dẫn…" onFocus={event => event.currentTarget.select()} />
        <button type="button" aria-label="Sao chép đường dẫn gian hàng" title="Sao chép đường dẫn" disabled={!url} onClick={onCopy}><Copy size={16} /></button>
      </div>
      <div className="sf-settings-link-footer"><p>Chia sẻ đường dẫn này để khách ghé thăm Shop.</p>
        {path && <a href={path} target="_blank" rel="noopener noreferrer">Mở gian hàng <ExternalLink size={13} /></a>}
      </div>
      <div className="sf-settings-description">
        <label htmlFor="storefront-description">Giới thiệu gian hàng</label>
        <p>Giúp khách hiểu thương hiệu, sản phẩm nổi bật và cam kết của Shop.</p>
        <textarea id="storefront-description" value={description} rows={4}
          placeholder="Kể ngắn gọn về thương hiệu và điều khiến gian hàng của bạn khác biệt…"
          onChange={event => onDescriptionChange(event.target.value)} />
        <div className="sf-settings-description-footer"><span>Bấm “Lưu thay đổi” để cập nhật giới thiệu.</span><span>{description.length.toLocaleString('vi-VN')} ký tự</span></div>
      </div>
    </div>
  </details>;
}
