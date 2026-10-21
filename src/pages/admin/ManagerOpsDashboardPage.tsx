import { useEffect, useState } from 'react';
import { Radio, ShoppingBag, Store, Users } from 'lucide-react';
import api from '../../services/api';

type OpsSummary = {
  stores: number;
  collaborators: number;
  orders: number;
  livestreams: number;
};

/** Dashboard Manager: tổng quan shop / KOL / đơn / live (best-effort từ BE hiện có). */
export default function ManagerOpsDashboardPage() {
  const [summary, setSummary] = useState<OpsSummary>({ stores: 0, collaborators: 0, orders: 0, livestreams: 0 });
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [storesRes, collabRes, ordersRes, liveRes]: any[] = await Promise.all([
          api.get('/stores/marketplace').catch(() => null),
          api.get('/collaborators').catch(() => null),
          api.get('/orders').catch(() => null),
          api.get('/livestreams').catch(() => null),
        ]);
        if (!alive) return;
        const stores = storesRes?.result ?? storesRes?.data ?? storesRes;
        const collabs = collabRes?.result ?? collabRes?.data ?? collabRes;
        const orders = ordersRes?.result ?? ordersRes?.data ?? ordersRes;
        const lives = liveRes?.result ?? liveRes?.data ?? liveRes;
        setSummary({
          stores: Array.isArray(stores) ? stores.length : stores?.items?.length || 0,
          collaborators: Array.isArray(collabs) ? collabs.length : 0,
          orders: Array.isArray(orders) ? orders.length : orders?.items?.length || 0,
          livestreams: Array.isArray(lives) ? lives.length : lives?.items?.length || 0,
        });
      } catch {
        if (alive) setNote('Không tải được một phần số liệu — kiểm tra gateway/services.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const cards = [
    { label: 'Gian hàng', value: summary.stores, icon: Store },
    { label: 'KOL / CTV', value: summary.collaborators, icon: Users },
    { label: 'Đơn hàng', value: summary.orders, icon: ShoppingBag },
    { label: 'Livestream', value: summary.livestreams, icon: Radio },
  ];

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pb-10">
      {note && <p className="text-xs text-[#6F768A]">{note}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" aria-busy={loading}>
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[#D0D4E4] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-[#6F768A]">
              <c.icon className="w-4 h-4 text-[#3F4C6B]" />
              {c.label}
            </div>
            <strong className="mt-2 block text-2xl tabular-nums text-[#1A1612]">
              {loading ? '…' : c.value.toLocaleString('vi-VN')}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
