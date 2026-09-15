import { useState, useEffect } from 'react';
import {
  Download,
  Users,
  Sparkles,
  Store,
  CreditCard,
  Search,
  CheckCircle2,
  LockOpen,
  Eye,
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

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const list = await kycService.getPendingKyc();
      setProfiles(list);
    } catch (err) {
      console.error('Lỗi tải danh sách KYC:', err);
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

  const fallbackUsers = [
    {
      id: 'u0',
      fullName: 'Nguyễn Thành Thắng',
      email: 'kol1@scanms.vn',
      role: 'COLLABORATOR',
      kycStatus: 'VERIFIED',
      kycLabel: 'Đã xác minh (CCCD + MST)',
      tier: 'Top KOL Vàng',
      createdAt: '01/01/2026',
      status: 'active',
      avatar: 'T',
      avatarBg: 'bg-amber-100 text-amber-800',
      idCardNumber: '079201008899',
      taxCode: '8594028193',
      bankName: 'MBBank (Quân Đội)',
      accountNumber: '999988887777',
      accountHolder: 'NGUYEN THANH THANG',
    },
    {
      id: 'u1',
      fullName: 'Trần Văn Nhật',
      email: 'demo@scanms.vn',
      role: 'COLLABORATOR',
      kycStatus: 'VERIFIED',
      kycLabel: 'Đã xác minh (CCCD + MST)',
      tier: 'KOL Vàng',
      createdAt: '12/01/2026',
      status: 'active',
      avatar: 'N',
      avatarBg: 'bg-indigo-50 text-indigo-700',
      idCardNumber: '079201008899',
      taxCode: '8594028193',
      bankName: 'MBBank (Quân Đội)',
      accountNumber: '999988887777',
      accountHolder: 'TRAN VAN NHAT',
    },
    {
      id: 'u2',
      fullName: 'Sora Skin Official',
      email: 'shop@scanms.vn',
      role: 'SHOP_MANAGER',
      kycStatus: 'VERIFIED',
      kycLabel: 'Đã xác minh (GPKD DN)',
      tier: 'Gian hàng đối tác',
      createdAt: '02/02/2026',
      status: 'active',
      avatar: 'S',
      avatarBg: 'bg-amber-100 text-amber-900',
      idCardNumber: '0316889922',
      taxCode: '0316889922',
      bankName: 'Vietcombank',
      accountNumber: '0071001234567',
      accountHolder: 'CTY TNHH SORA SKIN VIETNAM',
    },
    {
      id: 'u3',
      fullName: 'Vũ Minh Hoàng',
      email: 'hoang.kol@gmail.com',
      role: 'COLLABORATOR',
      kycStatus: 'PENDING',
      kycLabel: 'Chờ duyệt CCCD',
      tier: 'KOL Đồng',
      createdAt: '06/09/2026',
      status: 'pending',
      avatar: 'H',
      avatarBg: 'bg-amber-100 text-amber-800',
      idCardNumber: '001202004567',
      taxCode: 'Chưa nộp',
      bankName: 'Techcombank',
      accountNumber: '19034567890123',
      accountHolder: 'VU MINH HOANG',
    },
    {
      id: 'u4',
      fullName: 'Trần Hữu Kiên',
      email: 'kien.bot99@gmail.com',
      role: 'COLLABORATOR',
      kycStatus: 'REJECTED',
      kycLabel: 'Thiếu MST cá nhân',
      tier: 'Tài khoản vi phạm',
      createdAt: '15/08/2026',
      status: 'locked',
      avatar: 'K',
      avatarBg: 'bg-rose-100 text-rose-800',
      idCardNumber: '038200001234',
      taxCode: 'Không hợp lệ',
      bankName: 'VPBank',
      accountNumber: '123456789',
      accountHolder: 'TRAN HUU KIEN',
    },
  ];

  const displayUsers = profiles.length > 0 ? profiles.map((p: any) => ({
    id: p.id,
    fullName: p.fullName || p.user?.fullName || 'Người dùng',
    email: p.user?.email || 'kol@scanms.vn',
    role: p.user?.role || 'COLLABORATOR',
    kycStatus: p.status,
    kycLabel: p.status === 'VERIFIED' ? 'Đã xác minh' : p.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt CCCD',
    tier: 'KOL Bạc',
    createdAt: new Date(p.createdAt || Date.now()).toLocaleDateString('vi-VN'),
    status: p.status === 'VERIFIED' ? 'active' : 'pending',
    avatar: (p.fullName || 'N')[0],
    avatarBg: 'bg-amber-100 text-amber-800',
    idCardNumber: p.idCardNumber,
    taxCode: p.taxCode || 'Chưa nộp',
    bankName: p.bankName,
    accountNumber: p.accountNumber,
    accountHolder: p.accountHolder,
  })) : fallbackUsers;

  const filtered = displayUsers.filter((u: any) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.idCardNumber.includes(search);
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.kycStatus === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {toastMsg && <div className="toast show">{toastMsg}</div>}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            Quản trị Người dùng &amp; Duyệt KYC
          </h1>
          <p className="text-sm text-slate-500 mt-1 m-0 max-w-2xl">
            Phân quyền hệ thống, xác minh định danh tài chính (CCCD/MST) và quản lý tài khoản đối tác toàn sàn.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={() => showToast('Đang xuất danh sách tài khoản định danh (.csv)...')}
          className="self-start sm:self-auto"
        >
          Xuất danh sách
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng tài khoản"
          value="10.420"
          trend="+240 tuần này"
          trendType="positive"
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-slate-100 text-slate-600"
        />

        <StatCard
          title="KOL / Cộng tác viên"
          value="9.850"
          subText="94,5% tổng người dùng"
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-700"
        />

        <StatCard
          title="Chủ Shop & Kế toán"
          value="570"
          subText="156 gian hàng liên kết"
          icon={<Store className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-700"
        />

        <StatCard
          title="Chờ duyệt KYC CCCD"
          value="38"
          trend="Cần xử lý trong 24h"
          trendType="negative"
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
            { value: 'PENDING', label: 'Chờ duyệt' },
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
              {filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.avatarBg}`}
                      >
                        {u.avatar}
                      </span>
                      <strong className="text-xs sm:text-sm font-semibold text-slate-900">{u.fullName}</strong>
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
                    {u.kycStatus === 'PENDING' && (
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
                    {u.status === 'locked' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Bị khóa
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    {u.kycStatus === 'PENDING' ? (
                      <Button
                        variant="amber"
                        size="sm"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => setInspectProfile(u)}
                      >
                        Duyệt KYC
                      </Button>
                    ) : u.status === 'locked' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<LockOpen className="w-3.5 h-3.5" />}
                        onClick={() => showToast(`Đã mở khóa tài khoản ${u.fullName}`)}
                      >
                        Mở khóa
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
              ))}
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
