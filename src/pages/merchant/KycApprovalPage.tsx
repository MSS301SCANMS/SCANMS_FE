import { useState, useEffect } from 'react';
import {
  Download,
  Sparkles,
  Store,
  CreditCard,
  Search,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { kycService, type KycProfile } from '../../services/kyc.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';

export default function KycApprovalPage() {
  const [profiles, setProfiles] = useState<KycProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [inspectProfile, setInspectProfile] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const list = await kycService.getPendingKyc();
      setProfiles(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Lỗi tải danh sách KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleReview = async (profileId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await kycService.reviewKyc(profileId, status);
      showToast(`Đã ${status === 'VERIFIED' ? 'phê duyệt' : 'từ chối'} hồ sơ KYC thành công!`);
      setInspectProfile(null);
      loadPending();
    } catch (err: any) {
      showToast(err.message || 'Thao tác phê duyệt thất bại');
    }
  };

  const displayUsers = profiles.map((p: any) => {
    const rawKyc = p.kycStatus || 'UNVERIFIED';
    const isVerified = rawKyc === 'VERIFIED';
    const isRejected = rawKyc === 'REJECTED';
    const fullName = p.fullName || p.user?.fullName || 'Đối tác SCANMS';
    return {
      id: p.id,
      fullName,
      email: p.user?.email || 'kol@scanms.vn',
      role: p.user?.role || 'COLLABORATOR',
      kycStatus: rawKyc,
      kycLabel: isVerified ? 'Đã xác minh' : isRejected ? 'Từ chối' : 'Chờ duyệt CCCD',
      tier: p.tier?.name || 'KOL Tiêu chuẩn',
      createdAt: new Date(p.createdAt || Date.now()).toLocaleDateString('vi-VN'),
      status: isVerified ? 'active' : isRejected ? 'rejected' : 'pending',
      avatar: fullName[0]?.toUpperCase() || 'K',
      avatarBg: isVerified ? 'bg-emerald-100 text-emerald-800' : isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800',
      idCardNumber: p.idCardNumber || 'Chưa cung cấp',
      taxCode: p.taxCode || 'Chưa nộp',
      bankName: p.bankName || 'Chưa cung cấp',
      accountNumber: p.accountNumber || 'Chưa cung cấp',
      accountHolder: p.accountHolder || fullName,
    };
  });

  const filtered = displayUsers.filter((u: any) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.idCardNumber.includes(search);
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.kycStatus === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const pendingCount = displayUsers.filter((u: any) => u.kycStatus === 'UNVERIFIED').length;
  const verifiedCount = displayUsers.filter((u: any) => u.kycStatus === 'VERIFIED').length;

  return (
    <div className="flex flex-col gap-6">
      {toastMsg && <div className="toast show">{toastMsg}</div>}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Cổng Quản Trị Xác Minh
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Xét Duyệt Hồ Sơ Định Danh (KYC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra và phê duyệt thông tin CCCD, MST và tài khoản thụ hưởng của KOL & Chủ Shop
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={() => showToast('Đang xuất danh sách hồ sơ KYC...')}
          >
            Xuất báo cáo
          </Button>
          <Button
            variant="amber"
            size="md"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadPending}
          >
            Làm mới
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Tổng hồ sơ đã duyệt"
          value={verifiedCount.toString()}
          subText="KOL đủ điều kiện rút hoa hồng"
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Hồ sơ trong hệ thống"
          value={displayUsers.length.toString()}
          subText="Tổng số đối tác đã nộp KYC"
          icon={<Store className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-700"
        />

        <StatCard
          title="Chờ duyệt KYC CCCD"
          value={pendingCount.toString()}
          trend={pendingCount > 0 ? 'Cần xử lý ngay' : 'Đã xử lý hết'}
          trendType={pendingCount > 0 ? 'negative' : 'positive'}
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-amber-100 text-amber-800"
        />
      </div>

      <Card className="p-3.5 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm theo tên, email, CCCD hoặc mã KOL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          clearable
          onClear={() => setSearch('')}
          icon={<Search className="w-4 h-4 text-slate-400" />}
          className="flex-1 min-w-[280px]"
        />

        <Select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          options={[
            { value: 'ALL', label: 'Tất cả vai trò' },
            { value: 'COLLABORATOR', label: 'COLLABORATOR' },
            { value: 'SHOP_MANAGER', label: 'SHOP_MANAGER' },
            { value: 'SYSTEM_ADMIN', label: 'SYSTEM_ADMIN' },
          ]}
        />

        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái KYC' },
            { value: 'VERIFIED', label: 'Đã xác minh' },
            { value: 'UNVERIFIED', label: 'Chờ duyệt (Chưa xác minh)' },
            { value: 'REJECTED', label: 'Bị từ chối' },
          ]}
        />
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Người dùng</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò (RBAC)</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Định danh KYC</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cấp bậc</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="text-3xl mb-2">📋</div>
                    <div className="font-semibold text-slate-700">Không tìm thấy hồ sơ nào</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {loading ? 'Đang tải dữ liệu từ máy chủ...' : 'Chưa có hồ sơ định danh nào khớp với bộ lọc hiện tại.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.avatarBg}`}
                        >
                          {u.avatar}
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">CCCD: {u.idCardNumber}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="neutral" size="sm">
                        {u.role}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.kycStatus === 'VERIFIED' && (
                        <Badge variant="success" dot size="md">
                          {u.kycLabel}
                        </Badge>
                      )}
                      {(u.kycStatus === 'UNVERIFIED' || u.kycStatus === 'PENDING') && (
                        <Badge variant="warning" dot dotPulse size="md">
                          {u.kycLabel}
                        </Badge>
                      )}
                      {u.kycStatus === 'REJECTED' && (
                        <Badge variant="danger" dot size="md">
                          {u.kycLabel}
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="amber" size="sm">
                        {u.tier}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {u.createdAt}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.status === 'active' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Hoạt động
                        </span>
                      )}
                      {u.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Chờ duyệt
                        </span>
                      )}
                      {u.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Bị từ chối
                        </span>
                      )}
                      {u.status === 'locked' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Bị khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      {(u.kycStatus === 'UNVERIFIED' || u.kycStatus === 'PENDING') ? (
                        <Button
                          variant="amber"
                          size="sm"
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => setInspectProfile(u)}
                        >
                          Duyệt KYC
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setInspectProfile(u)}
                        >
                          Xem KYC
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {inspectProfile && (
        <Modal
          isOpen={Boolean(inspectProfile)}
          onClose={() => setInspectProfile(null)}
          title="Hồ Sơ Định Danh Tài Chính (KYC)"
          subtitle={`${inspectProfile.fullName} (${inspectProfile.email})`}
          icon={<CreditCard className="w-5 h-5 text-amber-600" />}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Số CMND/CCCD:</span>
              <strong className="font-mono text-slate-900 font-semibold">{inspectProfile.idCardNumber}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Mã số thuế cá nhân:</span>
              <strong className="text-slate-900 font-semibold">{inspectProfile.taxCode}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
              <strong className="text-slate-900 font-semibold">{inspectProfile.bankName}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Số tài khoản:</span>
              <strong className="font-mono text-amber-700 font-bold">{inspectProfile.accountNumber}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <strong className="text-slate-900 font-semibold">{inspectProfile.accountHolder}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={() => handleReview(inspectProfile.id, 'REJECTED')}
            >
              Từ chối hồ sơ
            </Button>
            <Button
              variant="amber"
              size="md"
              onClick={() => handleReview(inspectProfile.id, 'VERIFIED')}
            >
              Phê duyệt KYC
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
