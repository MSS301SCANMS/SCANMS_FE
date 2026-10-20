import { Link } from 'react-router-dom';
import { ArrowRight, Bath, Droplets, HeartPulse, Palette, Sparkles, Tag } from 'lucide-react';
import { HOME_CATEGORY_GROUPS } from '@/utils/marketplace-category.utils';

const icons = { skin: Droplets, makeup: Palette, body: Bath, health: HeartPulse };
const categories = [
  ...HOME_CATEGORY_GROUPS.map((group) => ({ label: group.label, Icon: icons[group.id], href: `/search?categoryGroup=${group.id}` })),
  { label: 'Khám phá cùng KOC', Icon: Sparkles, href: '/search?commission=true' },
  { label: 'Sản phẩm giảm giá', Icon: Tag, href: '/search?discount=true&inStock=true' },
];

export function CategoryQuickNav() {
  return (
    <section aria-labelledby="category-quick-nav-title" className="bg-[#FAF8F5] py-5 text-left sm:py-7">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">
        <div className="rounded-3xl border border-[#EAE4D7] bg-white px-4 py-6 sm:px-6 sm:py-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#B88E4F]">BẮT ĐẦU TỪ ĐIỀU BẠN THÍCH</p><h2 id="category-quick-nav-title" className="m-0 text-xl font-black tracking-tight sm:text-2xl">Mua sắm theo ngành hàng</h2></div>
          <Link to="/search" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#7D715E] hover:text-[#B88E4F]">Tất cả<ArrowRight size={15} /></Link>
        </div>
        <nav aria-label="Ngành hàng mua sắm" className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-4">
          {categories.map(({ label, Icon, href }) => (
            <Link key={href} to={href} className="group flex flex-col items-center gap-3 rounded-2xl px-1 py-3 text-center transition hover:bg-[#FBF5EB] focus-visible:outline-[#C59B58]">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] transition group-hover:border-[#C59B58] group-hover:bg-[#F3EFE6] motion-safe:group-hover:-translate-y-1 sm:h-20 sm:w-20"><Icon className="h-7 w-7" strokeWidth={1.5} /></span>
              <span className="max-w-28 text-xs font-bold leading-5 text-[#1A1612]">{label}</span>
            </Link>
          ))}
        </nav>
        </div>
      </div>
    </section>
  );
}
