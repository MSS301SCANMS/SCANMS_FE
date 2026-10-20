import { ChevronRight, House } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ProductBreadcrumbs.css';

export function ProductBreadcrumbs({ title, category }: { title: string; category?: string | null }) {
  return (
    <nav className="product-breadcrumbs" aria-label="Đường dẫn sản phẩm">
      <ol className="product-breadcrumbs__list">
        <li className="product-breadcrumbs__ancestor">
          <Link to="/marketplace" className="product-breadcrumbs__home">
            <span className="product-breadcrumbs__home-icon"><House size={14} aria-hidden="true" /></span>
            <span>Sàn SCANMS</span>
          </Link>
        </li>
        {category && <li className="product-breadcrumbs__ancestor product-breadcrumbs__category">
          <ChevronRight size={13} aria-hidden="true" className="product-breadcrumbs__separator" />
          <Link to={`/search?category=${encodeURIComponent(category)}`} title={category}>{category}</Link>
        </li>}
        <li className="product-breadcrumbs__current">
          <ChevronRight size={13} aria-hidden="true" className="product-breadcrumbs__separator" />
          <span aria-current="page" title={title}>{title}</span>
        </li>
      </ol>
    </nav>
  );
}
