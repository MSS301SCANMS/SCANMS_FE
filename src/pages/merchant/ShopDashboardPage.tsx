import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { storeService } from '../../services/store.service';
import {
  analyticsService,
  type DashboardOverviewResponse,
  type TimeSeriesPoint,
} from '../../services/analytics.service';
import { productService, type Product } from '../../services/product.service';
import { orderService, type StoreOrderRecord } from '../../services/order.service';

export default function ShopDashboardPage() {
  const [store, setStore] = useState<any>(null);
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<StoreOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentStore = await storeService.getMyStore().catch(() => null);
      setStore(currentStore);

      const [overviewData, seriesData, productsData, ordersData] = await Promise.all([
        analyticsService.getRealtimeOverview({ days: 30, storeId: currentStore?.id }).catch(() => null),
        analyticsService.getTimeSeries({ days: 7, interval: 'day', storeId: currentStore?.id }).catch(() => []),
        productService.getProducts({ storeId: currentStore?.id, page: 1, limit: 5 }).catch(() => ({ items: [] })),
        orderService.getMyStoreOrders({ storeId: currentStore?.id, page: 1, limit: 5 }).catch(() => ({ items: [] })),
      ]);

      if (overviewData) setOverview(overviewData);
      if (seriesData) setTimeSeries(seriesData);
      if (productsData?.items) setTopProducts(productsData.items);
      if (ordersData?.items) setRecentOrders(ordersData.items);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Dashboard Shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = overview?.metrics;
  const maxRevenue = Math.max(...(timeSeries.map((t) => t.revenue) || [1]), 1);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1A1612] tracking-tight m-0">
              Tổng quan {store?.name || 'Gian hàng của bạn'}
            </h1>
            {store?.slug && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#F3EFE6] border border-[#EAE4D7] text-[#7D715E] font-mono">
                @{store.slug}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
            Theo dõi doanh thu liên kết, chi phí hoa hồng và sức khỏe đơn hàng thực tế từ sàn tiếp thị.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Tải lại dữ liệu"
            className="p-2.5 rounded-xl border border-[#EAE4D7] bg-white text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/merchant/campaigns"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C59B58] text-white font-bold text-xs sm:text-sm hover:bg-[#B88E4F] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo chiến dịch</span>
          </Link>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu liên kết */}
        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">Doanh thu liên kết (30 ngày)</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#1A1612] tracking-tight block">
              {(metrics?.grossRevenue || 0).toLocaleString('vi-VN')} ₫
            </strong>
            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
              {metrics?.growthRevenue ? `${metrics.growthRevenue >= 0 ? '+' : ''}${metrics.growthRevenue.toFixed(1)}% so với kỳ trước` : 'Dữ liệu thời gian thực'}
            </span>
          </div>
        </div>

        {/* Hoa hồng KOL */}
        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">Hoa hồng KOL ghi nhận</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#B88E4F] tracking-tight block">
              {(metrics?.totalCommission || 0).toLocaleString('vi-VN')} ₫
            </strong>
            <span className="text-xs text-[#7D715E] mt-0.5 block font-medium">
              {metrics?.grossRevenue ? `${((metrics.totalCommission / metrics.grossRevenue) * 100).toFixed(1)}% doanh thu` : '0% doanh thu'}
            </span>
          </div>
        </div>

        {/* Đơn hàng thành công */}
        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">Đơn chốt thành công</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#1A1612] tracking-tight block">
              {metrics?.completedOrders || 0} <span className="text-sm font-semibold text-[#7D715E]">/ {metrics?.totalOrders || 0} đơn</span>
            </strong>
            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
              {(metrics?.conversionRate || 0).toFixed(2)}% tỷ lệ chuyển đổi
            </span>
          </div>
        </div>

        {/* Lượt click tiếp thị */}
        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">Lượt click tiếp thị</span>
            <div className="w-8 h-8 rounded-xl bg-[#F3EFE6] text-[#7D715E] border border-[#EAE4D7] flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#1A1612] tracking-tight block">
              {metrics?.totalClicks || 0}
            </strong>
            <span className="text-xs font-bold text-[#7D715E] mt-0.5 block">
              {metrics?.activeReferralLinks || 0} link tiếp thị đang hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chart & Real Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Doanh thu 7 ngày gần nhất (Biểu đồ thực tế) */}
        <div className="lg:col-span-8 p-5 sm:p-6 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-[#1A1612] m-0">Doanh thu và hoa hồng 7 ngày qua</h2>
              <p className="text-xs text-[#7D715E] m-0 mt-0.5">Biểu đồ tổng hợp đối soát tự động từ database</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#7D715E] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#C59B58]" /> Doanh thu (GMV)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#EAE4D7]" /> Hoa hồng KOL
              </span>
            </div>
          </div>

          {timeSeries.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-xs text-[#7D715E]">
              <TrendingUp className="w-8 h-8 text-[#EAE4D7] mb-2" />
              Chưa có dữ liệu giao dịch trong 7 ngày gần nhất.
            </div>
          ) : (
            <div className="flex items-end justify-between h-44 pt-4 pb-2 border-b border-[#EAE4D7] gap-2">
              {timeSeries.map((col, idx) => {
                const revHeight = maxRevenue > 0 ? Math.max(8, (col.revenue / maxRevenue) * 100) : 8;
                const commHeight = maxRevenue > 0 ? Math.max(4, (col.commission / maxRevenue) * 100) : 4;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex items-end gap-1 h-36">
                      <div
                        style={{ height: `${revHeight}%` }}
                        title={`Doanh thu: ${col.revenue.toLocaleString('vi-VN')} ₫`}
                        className="w-3.5 sm:w-5 bg-[#C59B58] rounded-t-sm transition-all hover:bg-[#B88E4F]"
                      />
                      <div
                        style={{ height: `${commHeight}%` }}
                        title={`Hoa hồng: ${col.commission.toLocaleString('vi-VN')} ₫`}
                        className="w-3.5 sm:w-5 bg-[#EAE4D7] rounded-t-sm transition-all hover:bg-[#D8C7B0]"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#7D715E]">{col.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Đơn hàng mới nhất (Dữ liệu thật) */}
        <div className="lg:col-span-4 p-5 sm:p-6 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-[#1A1612] m-0">Đơn hàng mới nhất</h3>
            <Link
              to="/merchant/orders"
              className="text-xs font-bold text-[#B88E4F] hover:text-[#9A7032]"
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
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
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
            </div>
          )}
        </div>
      </div>

      {/* Sản phẩm của gian hàng (Dữ liệu thật) */}
      <div className="bg-white border border-[#EAE4D7] rounded-2xl shadow-xs overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[#EAE4D7]">
          <div>
            <h3 className="text-base font-extrabold text-[#1A1612] m-0">Sản phẩm của gian hàng</h3>
            <p className="text-xs text-[#7D715E] mt-0.5 m-0">Danh sách sản phẩm thực tế đang mở bán trên sàn tiếp thị</p>
          </div>
          <Link
            to="/merchant/products"
            className="text-xs font-bold text-[#B88E4F] hover:text-[#9A7032] flex items-center gap-1"
          >
            <span>Quản lý danh mục</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7D715E]">
            Gian hàng chưa đăng sản phẩm nào. Hãy bấm Quản lý danh mục để thêm sản phẩm đầu tiên!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] font-bold">
                  <th className="p-3.5">Sản phẩm</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Giá bán</th>
                  <th className="p-3.5">Tồn kho</th>
                  <th className="p-3.5">Hoa hồng CTV</th>
                  <th className="p-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]">
                {topProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FBF5EB]/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-9 h-9 rounded-xl object-cover border border-[#EAE4D7] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-bold text-xs shrink-0">
                            <Box className="w-4 h-4" />
                          </div>
                        )}
                        <strong className="text-xs sm:text-sm font-bold text-[#1A1612] block">
                          {p.title}
                        </strong>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[#7D715E]">{p.sku}</td>
                    <td className="p-3.5 font-bold text-[#1A1612]">
                      {Number(p.price).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-3.5 font-semibold text-[#1A1612]">{p.stockQuantity}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#8A662C] font-bold border border-[#EEDFC6]">
                        {p.customCommissionRate ?? p.store?.defaultCommissionRate ?? 10}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {p.isActive ? 'Đang mở bán' : 'Tạm ẩn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
