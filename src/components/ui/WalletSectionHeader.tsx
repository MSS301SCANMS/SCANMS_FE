import type { LucideIcon } from 'lucide-react';
import { ChevronDown, RefreshCw } from 'lucide-react';

export function WalletSectionHeader({ id, title, description, count, icon: Icon, expanded, onToggle, onRefresh, refreshing }: {
  id: string; title: string; description: string; count: string; icon: LucideIcon;
  expanded: boolean; onToggle: () => void; onRefresh?: () => void; refreshing?: boolean;
}) {
  return <div className={`wallet-section-header${expanded ? ' is-open' : ''}`}>
    <h2 className="wallet-section-heading">
      <button type="button" className="wallet-section-toggle" aria-expanded={expanded} aria-controls={id} onClick={onToggle}>
        <span className="wallet-section-icon"><Icon size={19} strokeWidth={1.6} /></span>
        <span className="wallet-section-copy"><span className="wallet-section-title">{title}<span className="wallet-section-count">{count}</span></span><span className="wallet-section-description">{description}</span></span>
        <ChevronDown className="wallet-section-chevron" size={17} aria-hidden="true" />
      </button>
    </h2>
    {onRefresh && <button type="button" className="wallet-section-refresh" disabled={refreshing} onClick={onRefresh} title="Làm mới dữ liệu" aria-label={`Làm mới ${title.toLowerCase()}`}><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /><span>Làm mới</span></button>}
  </div>;
}
