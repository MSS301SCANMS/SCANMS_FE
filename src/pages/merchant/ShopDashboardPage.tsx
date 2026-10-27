import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  Coins,
  ShoppingBag,
  MousePointerClick,
  ArrowRight,
  RefreshCw,
  Box,
  ChevronDown,
  ChevronUp,
  Store,
  Loader2,
} from 'lucide-react';
import { storeService, MissingOwnedStoreError } from '../../services/store.service';
import {
  analyticsService,
  type DashboardOverviewResponse,
  type TimeSeriesPoint,
} from '../../services/analytics.service';
import { productService, type Product } from '../../services/product.service';
import { orderService, type StoreOrderRecord } from '../../services/order.service';

import { StatCard } from '../../components/ui/StatCard';
import { ListPagination } from '../../components/ui/ListPagination';
import ShopApplicationPage from './ShopApplicationPage';

const DASHBOARD_PRODUCT_PAGE_SIZE = 5;

export default function ShopDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [recentOrders, setRecentOrders] = useState<StoreOrderRecord[]>([]);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [storeStatus, setStoreStatus] = useState<'unknown' | 'missing' | 'ready'>('unknown');
  const requestSequence = useRef(0);
  const productRequestSequence = useRef(0);

  const loadProducts = useCallback(async (currentStoreId: string, page: number, fresh = true) => {
    if (!currentStoreId) return;
    const request = ++productRequestSequence.current;
    setProductsLoading(true);
    try {
      const productsData = await productService.getProducts(
        { storeId: currentStoreId, page, limit: DASHBOARD_PRODUCT_PAGE_SIZE },
        fresh,
      );
      if (request !== productRequestSequence.current) return;
      setTopProducts(productsData?.items || []);
      setProductTotal(productsData?.pagination?.total || 0);
      setProductTotalPages(productsData?.pagination?.totalPages || 1);
      setProductPage(productsData?.pagination?.page || page);
    } catch (err) {
      if (request !== productRequestSequence.current) return;
      console.error('Lỗi tải sản phẩm Dashboard Shop:', err);
    } finally {
      if (request === productRequestSequence.current) setProductsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    const request = ++requestSequence.current;
    setLoading(true);
    setLoadError('');
    try {
      const currentStore = await storeService.getMyStore(true);
      if (request !== requestSequence.current) return;
      if (!currentStore?.id) throw new Error('Không xác định được gian hàng. Vui lòng thử lại.');
      setStoreStatus('ready');
      setStoreId(currentStore.id);

      const [overviewData, seriesData, ordersData] = await Promise.all([
        analyticsService.getRealtimeOverview({ days: 30, storeId: currentStore.id }, true),
        analyticsService.getTimeSeries({ days: 7, interval: 'daily', storeId: currentStore.id }, true),
        orderService.getMyStoreOrders({ storeId: currentStore.id, page: 1, limit: 10 }, true),
      ]);
      if (request !== requestSequence.current) return;

      if (overviewData) setOverview(overviewData);
      if (seriesData) setTimeSeries(seriesData);
      if (ordersData?.items) setRecentOrders(ordersData.items);
      await loadProducts(currentStore.id, 1, true);
    } catch (err) {
      if (request !== requestSequence.current) return;
      if (err instanceof MissingOwnedStoreError) {
        setStoreStatus('missing');
        setOverview(null); setTimeSeries([]); setTopProducts([]); setRecentOrders([]);
        setProductTotal(0); setProductTotalPages(1); setProductPage(1); setStoreId('');
        return;
      }
      setLoadError(err instanceof Error ? err.message : 'Chưa tải được dữ liệu gian hàng. Vui lòng thử lại.');
      console.error('Lỗi tải dữ liệu Dashboard Shop:', err);
    } finally {
      if (request === requestSequence.current) setLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    void loadData();
    const requests = requestSequence;
    const productRequests = productRequestSequence;
    return () => { requests.current++; productRequests.current++; };
  }, [loadData]);

  const metrics = overview?.metrics;
  const chartSeries = timeSeries.slice(-7);
  const maxRevenue = Math.max(...chartSeries.flatMap(t => [t.revenue, t.commission]), 1);

  if (loading && storeStatus !== 'ready') {
    return <div role="status" className="flex items-center justify-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-10 text-sm text-[#7D715E]"><Loader2 size={18} className="animate-spin" />Đang kiểm tra gian hàng của bạn…</div>;
  }

  if (storeStatus === 'missing' && !loadError) {
    return <ShopApplicationPage onCheckStore={() => void loadData()} checkingStore={loading} />;
  }

  if (storeStatus !== 'ready') {
    return <section aria-label="Thiết lập gian hàng" className="grid justify-items-start gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-5 text-left text-[#1A1612] sm:p-7">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Store size={23} /></span>
      <div className="max-w-2xl"><h1 className="m-0 text-lg font-bold">Chưa tải được thông tin gian hàng</h1><p className="mb-0 mt-2 text-sm leading-6 text-[#7D715E]">Vui lòng kiểm tra kết nối và thử tải lại.</p></div>
      {loadError && <p role="alert" className="m-0 text-sm text-red-700">{loadError}</p>}
      <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] px-4 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Kiểm tra lại</button>
    </section>;
  }

  return (
    <div className="shop-overview flex flex-col gap-4 text-left pb-6">
      {loadError && <p role="alert" className="rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm text-[#DC2626]">{loadError}</p>}
      {/* 2. Metric Cards Chuẩn Hóa */}
      <div className="shop-overview-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Doanh thu liên kết (30 ngày)"
          value={`${(metrics?.grossRevenue || 0).toLocaleString('vi-VN')} ₫`}
          growth={metrics?.growthRevenue}
          note={metrics?.growthRevenue ? 'so với kỳ trước' : 'Dữ liệu thời gian thực'}
          icon={<TrendingUp className="w-4 h-4" />}
        />

        <StatCard
          title="Hoa hồng KOL ghi nhận"
          value={`${(metrics?.totalCommission || 0).toLocaleString('vi-VN')} ₫`}
          note={metrics?.grossRevenue ? `${((metrics.totalCommission / metrics.grossRevenue) * 100).toFixed(1)}% doanh thu` : '0% doanh thu'}
          icon={<Coins className="w-4 h-4" />}
        />

        <StatCard
          title="Đơn chốt thành công"
          value={`${metrics?.completedOrders || 0} / ${metrics?.totalOrders || 0}`}
          trendText={`${(metrics?.conversionRate || 0).toFixed(1)}% chuyển đổi`}
          icon={<ShoppingBag className="w-4 h-4" />}
        />

        <StatCard
          title="Lượt click tiếp thị"
          value={(metrics?.totalClicks || 0).toLocaleString('vi-VN')}
          note={`${metrics?.activeReferralLinks || 0} link đang hoạt động`}
          icon={<MousePointerClick className="w-4 h-4" />}
        />
      </div>

      {/* Main Content Grid: Chart & Real Activities */}
      <div className="shop-overview-content grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Doanh thu 7 ngày gần nhất (Biểu đồ thực tế) */}
        <div className="shop-overview-chart lg:col-span-8 p-4 bg-white border border-[#EAE4D7] rounded-2xl flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-[#1A1612] m-0">Doanh thu và hoa hồng 7 ngày qua</h2>
              <p className="text-xs text-[#7D715E] m-0 mt-0.5">Doanh thu và hoa hồng ghi nhận theo ngày.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#7D715E] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs shrink-0 bg-[#EEDFC6] border border-[#C59B58]" /> Doanh thu (GMV)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs shrink-0 bg-[#F3EFE6] border border-[#EAE4D7]" /> Hoa hồng KOL
              </span>
            </div>
          </div>

          {chartSeries.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-xs text-[#7D715E]">
              <TrendingUp className="w-8 h-8 text-[#EAE4D7] mb-2" />
              Chưa có dữ liệu giao dịch trong 7 ngày gần nhất.
            </div>
          ) : (
            <div className="grid gap-2 min-w-0 pt-2.5" style={{ gridTemplateColumns: `repeat(${chartSeries.length}, minmax(0, 1fr))` }}>
              {chartSeries.map((col, idx) => {
                const revHeight = Math.max(0, (col.revenue / maxRevenue) * 140);
                const commHeight = Math.max(0, (col.commission / maxRevenue) * 140);
                return (
                  <div key={idx} className="min-w-0 text-center">
                    <div className="flex h-[150px] items-end justify-center gap-1 border-b border-[#EAE4D7] bg-[#FAF8F5]/30">
                      <div
                        style={{ height: `${revHeight}px` }}
                        title={`Doanh thu: ${col.revenue.toLocaleString('vi-VN')} ₫`}
                        className="w-full max-w-[20px] shrink-0 rounded-t-md bg-[#EEDFC6] border border-[#C59B58] border-b-0 transition-colors hover:border-[#B88E4F]"
                      />
                      <div
                        style={{ height: `${commHeight}px` }}
                        title={`Hoa hồng: ${col.commission.toLocaleString('vi-VN')} ₫`}
                        className="w-full max-w-[20px] shrink-0 rounded-t-md bg-[#F3EFE6] border border-[#EAE4D7] border-b-0 transition-colors hover:border-[#B88E4F]"
                      />
                    </div>
                    <span className="block mt-2 text-[#7D715E] text-[11px] truncate" title={col.label}>{col.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Đơn hàng mới nhất (Dữ liệu thật) */}
        <div className="shop-overview-orders lg:col-span-4 p-4 bg-white border border-[#EAE4D7] rounded-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-[#1A1612] m-0">Đơn hàng mới nhất</h3>
            <Link
              to="/merchant/orders"
              className="text-xs font-bold text-[#B88E4F] hover:text-[#B88E4F]"
            >
              Xem tất cả
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#7D715E]">
              Chưa có đơn hàng nào phát sinh.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {(isOrdersExpanded ? recentOrders : recentOrders.slice(0, 3)).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7] transition-all hover:bg-[#F3EFE6]/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-xs font-bold text-[#1A1612] block truncate">
                      Đơn #{order.externalOrderSn}
                    </strong>
                    <span className="text-[11px] text-[#7D715E] block truncate">
                      {order.customerName} • {order.items.length} món
                    </span>
                  </div>
                  <strong className="text-xs font-extrabold text-[#B88E4F] shrink-0">
                    {order.finalAmount.toLocaleString('vi-VN')} ₫
                  </strong>
                </div>
              ))}

              {recentOrders.length > 3 && (
                <button
                  type="button"
                  onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                  className="w-full py-2.5 px-3 mt-0.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:text-[#1A1612] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isOrdersExpanded ? (
                    <>
                      <span>Thu gọn danh sách</span>
                      <ChevronUp className="w-3.5 h-3.5 text-[#B88E4F]" />
                    </>
                  ) : (
                    <>
                      <span>Xem thêm ({recentOrders.length - 3} đơn khác)</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#B88E4F]" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sản phẩm của gian hàng (Dữ liệu thật) */}
      <div className="shop-overview-products bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-2 xl:grid-cols-4 items-stretch gap-2 p-3 sm:p-4 border-b border-[#EAE4D7]">
          <div className="contents">
            <Link to="/merchant/products?create=1&returnTo=dashboard"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] transition-colors">
              <Plus className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Thêm sản phẩm</span>
            </Link>
            <Link
              to="/merchant/campaigns?create=1&returnTo=dashboard"
              title="Tạo chiến dịch hoa hồng cho KOL"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Tạo chiến dịch</span>
            </Link>
            <Link
              to="/merchant/products?returnTo=dashboard"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 border border-[#EEDFC6] rounded-xl bg-[#F3EFE6] text-[#1A1612] text-xs font-semibold hover:bg-[#FAF8F5] hover:border-[#C59B58] transition cursor-pointer"
            >
              <span>Quản lý sản phẩm</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B88E4F]" />
            </Link>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Tải lại dữ liệu gian hàng"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {topProducts.length === 0 && !productsLoading ? (
          <div className="p-8 text-center text-xs text-[#7D715E]">
            Gian hàng chưa đăng sản phẩm nào. Hãy bấm Thêm sản phẩm để tạo sản phẩm đầu tiên!
          </div>
        ) : (
          <>
            <div className={`overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#EAE4D7] hover:[&::-webkit-scrollbar-thumb]:bg-[#C59B58]/40 ${productsLoading ? 'opacity-60' : ''}`}>
              <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                <thead>
                  <tr className="border-b border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] text-[11px] font-bold uppercase tracking-wider select-none">
                    <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[280px]">Sản phẩm</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap w-[130px]">Giá bán</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap w-[100px]">Tồn kho</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap w-[130px]">Hoa hồng CTV</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap w-[130px]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]/70 bg-white">
                  {topProducts.map((p) => (
                    <tr key={p.id} className="group hover:bg-[#FBF5EB]/40 transition-colors duration-150">
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-10 h-10 rounded-xl object-cover border border-[#EAE4D7] bg-[#FAF8F5] shrink-0 shadow-2xs group-hover:border-[#C59B58]/40 transition-colors"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              <Box className="w-4 h-4" />
                            </div>
                          )}
                          <strong className="text-[12.5px] font-bold text-[#1A1612] truncate max-w-[280px] block leading-snug" title={p.title}>
                            {p.title}
                          </strong>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <strong className="font-mono text-[12.5px] font-bold text-[#1A1612] whitespace-nowrap">
                          {Number(p.price).toLocaleString('vi-VN')} ₫
                        </strong>
                      </td>
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="font-semibold text-xs text-[#1A1612] whitespace-nowrap">
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#B88E4F] font-bold text-[11px] border border-[#EEDFC6] whitespace-nowrap shadow-2xs">
                          {p.customCommissionRate ?? p.store?.defaultCommissionRate ?? 10}%
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs whitespace-nowrap ${
                            p.isActive
                              ? 'bg-[#FBF5EB] text-[#B88E4F] border-[#EEDFC6]'
                              : 'bg-[#FAF8F5] text-[#7D715E] border-[#EAE4D7]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-[#059669]' : 'bg-[#7D715E]'}`} />
                          <span>{p.isActive ? 'Đang mở bán' : 'Tạm ẩn'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPagination
              page={productPage}
              totalPages={productTotalPages}
              total={productTotal}
              pageSize={DASHBOARD_PRODUCT_PAGE_SIZE}
              label="sản phẩm"
              onPageChange={(next) => {
                setProductPage(next);
                void loadProducts(storeId, next, true);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
