import { Link } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  Coins,
  Users,
  RotateCcw,
  ShoppingBag,
  MousePointerClick,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';

export default function ShopDashboardPage() {
  return (
    <div className="flex flex-col gap-6 text-left">

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1612] tracking-tight m-0">
            Tổng quan Sora Skin Official
          </h1>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
            Theo dõi doanh thu liên kết, chi phí hoa hồng và sức khỏe mạng lưới KOL tiếp thị.
          </p>
        </div>

        <Link
          to="/merchant/campaigns"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C59B58] text-white font-bold text-xs sm:text-sm hover:bg-[#B88E4F] transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo chiến dịch</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">Doanh thu liên kết</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#1A1612] tracking-tight block">
              684,2 tr ₫
            </strong>
            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
              +12,8% trong 30 ngày
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">Hoa hồng phải trả</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#B88E4F] tracking-tight block">
              52,7 tr ₫
            </strong>
            <span className="text-xs text-[#7D715E] mt-0.5 block font-medium">7,7% doanh thu</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">KOL đang hoạt động</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#1A1612] tracking-tight block">
              128
            </strong>
            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
              +16 KOL mới tháng này
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#7D715E]">Tỷ lệ hoàn hàng</span>
            <div className="w-8 h-8 rounded-xl bg-[#F3EFE6] text-[#7D715E] border border-[#EAE4D7] flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-[#1A1612] tracking-tight block">
              3,18%
            </strong>
            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
              -0,42 điểm (Kiểm soát tốt)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <div className="lg:col-span-8 p-5 sm:p-6 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-[#1A1612] m-0">Doanh thu và hoa hồng</h2>
              <p className="text-xs text-[#7D715E] m-0 mt-0.5">Biểu đồ đối soát 30 ngày gần nhất</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#7D715E] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#C59B58]" /> Doanh thu (GMV)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#EAE4D7]" /> Hoa hồng (Payout)
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between h-44 pt-4 pb-2 border-b border-[#EAE4D7] gap-2">
            {[
              { day: 'T2', rev: 40, comm: 20 },
              { day: 'T3', rev: 60, comm: 30 },
              { day: 'T4', rev: 70, comm: 35 },
              { day: 'T5', rev: 55, comm: 28 },
              { day: 'T6', rev: 75, comm: 38 },
              { day: 'T7', rev: 85, comm: 45 },
              { day: 'CN', rev: 100, comm: 50 },
            ].map((col) => (
              <div key={col.day} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-end gap-1 h-36">
                  <div
                    style={{ height: `${col.rev}%` }}
                    className="w-3.5 sm:w-4 bg-[#C59B58] rounded-t-sm transition-all hover:bg-[#B88E4F]"
                  />
                  <div
                    style={{ height: `${col.comm}%` }}
                    className="w-3.5 sm:w-4 bg-[#EAE4D7] rounded-t-sm transition-all hover:bg-[#D8C7B0]"
                  />
                </div>
                <span className="text-xs font-bold text-[#7D715E]">{col.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 p-5 sm:p-6 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-[#1A1612] m-0">Hoạt động trực tiếp</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] font-bold text-[#B88E4F]">
              Đang cập nhật
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
              <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-xs font-bold text-[#1A1612] block truncate">
                  Đơn hàng #IN23931
                </strong>
                <span className="text-[11px] text-[#7D715E] block truncate">
                  Attribution qua coupon NHATXINH10
                </span>
              </div>
              <strong className="text-xs font-extrabold text-[#B88E4F] shrink-0">
                +459.000 ₫
              </strong>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
              <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                <MousePointerClick className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-xs font-bold text-[#1A1612] block truncate">
                  218 click tiếp thị mới
                </strong>
                <span className="text-[11px] text-[#7D715E] block truncate">
                  Từ TikTok Video, 10 phút vừa qua
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
              <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-xs font-bold text-[#1A1612] block truncate">
                  KOL mới kết nối
                </strong>
                <span className="text-[11px] text-[#7D715E] block truncate">
                  Lê Mai Anh (50k followers)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-0 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[#EAE4D7]">
          <div>
            <h3 className="text-base font-extrabold text-[#1A1612] m-0">Sản phẩm tiếp thị dẫn đầu</h3>
            <p className="text-xs text-[#7D715E] mt-0.5 m-0">Doanh thu và tỷ lệ chuyển đổi cao nhất của gian hàng</p>
          </div>
          <Link
            to="/merchant/products"
            className="text-xs font-bold text-[#B88E4F] hover:text-[#9A7032] flex items-center gap-1"
          >
            <span>Quản lý danh mục</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Doanh thu (GMV)</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Tỷ lệ chuyển đổi</TableHead>
              <TableHead>Mức hoa hồng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-bold text-xs shrink-0">
                    S1
                  </div>
                  <div>
                    <strong className="text-xs sm:text-sm font-bold text-[#1A1612] block">
                      Serum Vitamin C 15% Tươi
                    </strong>
                    <span className="text-[11px] text-[#7D715E]">SKU: SR-VTC-15</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-bold text-[#1A1612]">184.600.000 ₫</TableCell>
              <TableCell className="font-semibold text-[#7D715E]">402</TableCell>
              <TableCell>
                <Badge variant="amber">3,21% CR</Badge>
              </TableCell>
              <TableCell className="font-extrabold text-[#B88E4F]">8%</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-bold text-xs shrink-0">
                    S2
                  </div>
                  <div>
                    <strong className="text-xs sm:text-sm font-bold text-[#1A1612] block">
                      Kem chống nắng SPF50+ PA++++
                    </strong>
                    <span className="text-[11px] text-[#7D715E]">SKU: SUN-SPF50-PA</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-bold text-[#1A1612]">146.800.000 ₫</TableCell>
              <TableCell className="font-semibold text-[#7D715E]">377</TableCell>
              <TableCell>
                <Badge variant="amber">2,89% CR</Badge>
              </TableCell>
              <TableCell className="font-extrabold text-[#B88E4F]">10%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

