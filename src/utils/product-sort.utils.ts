interface SortableProduct {
  id: string; price: number; createdAt?: string;
  soldCount?: number; viewCount?: number;
}

export function sortCatalogProducts<T extends SortableProduct>(products: T[], sortBy: string): T[] {
  const date = (value?: string) => {
    const timestamp = value ? Date.parse(value) : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  return [...products].sort((a, b) => {
    let difference = 0;
    if (sortBy === 'popular') difference = (b.viewCount ?? 0) - (a.viewCount ?? 0);
    else if (sortBy === 'sales') difference = (b.soldCount ?? 0) - (a.soldCount ?? 0);
    else if (sortBy === 'price_asc' || sortBy === 'price-asc') difference = a.price - b.price;
    else if (sortBy === 'price_desc' || sortBy === 'price-desc') difference = b.price - a.price;
    return difference || date(b.createdAt) - date(a.createdAt) || a.id.localeCompare(b.id);
  });
}
