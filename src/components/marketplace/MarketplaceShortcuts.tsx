import { Link } from 'react-router-dom';
import { Radio, ShoppingBag, Sparkles, Store } from 'lucide-react';

const shortcutClassName = 'inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-center transition-colors hover:bg-[#FBF5EB] hover:text-[#1A1612] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] [&>svg]:shrink-0';

export function MarketplaceShortcuts({ onOpenLive }: { onOpenLive: () => void }) {
  return (
    <nav aria-label="Khám phá SCANMS" className="border-b border-[#EAE4D7] bg-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 items-stretch gap-2 px-3 py-2 text-[11px] font-semibold text-[#7D715E] sm:grid-cols-4 sm:gap-3 sm:px-4 lg:px-6">
        <Link to="/" aria-current="page" className={`${shortcutClassName} bg-[#FBF5EB] text-[#1A1612]`}><ShoppingBag size={15} />Trang mua sắm</Link>
        <Link to="#featured-stores" className={shortcutClassName}><Store size={15} />Gian hàng đối tác</Link>
        <button type="button" onClick={onOpenLive} className={shortcutClassName}><Radio size={15} className="text-[#B88E4F]" />Khám phá Live KOC</button>
        <Link to="/search?commission=true" className={shortcutClassName}><Sparkles size={15} />Khám phá cùng KOC</Link>
      </div>
    </nav>
  );
}
