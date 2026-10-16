import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  Unlock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { adminUserService, type AdminUser, type AdminRoleName, type AdminUserStatus } from '../../services/admin-user.service';
import { toast } from '../../utils/toast';

const ROLE_LABELS: Record<AdminRoleName, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  USER: 'Khách hàng',
  KOL_CTV: 'KOL / CTV',
  SHOP_OWNER: 'Chủ gian hàng',
};

const ROLE_FILTERS: Array<{ value: AdminRoleName | ''; label: string }> = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'MANAGER', label: 'Quản lý' },
  { value: 'USER', label: 'Khách hàng' },
  { value: 'KOL_CTV', label: 'KOL / CTV' },
  { value: 'SHOP_OWNER', label: 'Chủ gian hàng' },
];

const STATUS_FILTERS: Array<{ value: AdminUserStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Đã khóa' },
  { value: 'SUSPENDED', label: 'Tạm ngưng' },
];

function statusBadgeVariant(status: AdminUserStatus): 'success' | 'danger' | 'warning' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED') return 'warning';
  return 'danger';
}

function statusLabel(status: AdminUserStatus): string {
  if (status === 'ACTIVE') return 'Đang hoạt động';
  if (status === 'SUSPENDED') return 'Tạm ngưng';
  return 'Đã khóa';
}

function isAdminAccount(user: AdminUser): boolean {
  return Array.isArray(user.roles) && user.roles.includes('ADMIN');
}

function initials(name?: string) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  return (parts[0]?.[0] || '').concat(parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '').toUpperCase();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<AdminRoleName | ''>('');
  const [status, setStatus] = useState<AdminUserStatus | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ user: AdminUser; nextStatus: AdminUserStatus } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUserService.list({ page, size: 20, search, role, status });
      setUsers(data.content || []);
      setTotalPages(Math.max(data.totalPages || 1, 1));
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không tải được danh sách tài khoản.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  // Debounce ô tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const { user, nextStatus } = statusTarget;
    setSavingId(user.userId);
    try {
      const updated = await adminUserService.updateStatus(user.userId, nextStatus);
      toast.success(nextStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      setUsers((prev) => prev.map((u) => (u.userId === updated.userId ? updated : u)));
      if (selected?.userId === updated.userId) setSelected(updated);
      setStatusTarget(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#FAF8F5] px-0 py-5 text-[#1A1612]">
      <div className="mx-0 w-full min-w-0 max-w-none space-y-4">
        <section className="rounded-xl border border-[#EAE4D7] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-[#FBF5EB] px-3 py-2 text-xs font-semibold text-[#8C6226] ring-1 ring-[#EEDFC6]">
                <Users className="h-4 w-4" /> Tài khoản & Phân quyền
              </span>
              <select
                aria-label="Lọc theo vai trò"
                value={role}
                onChange={(e) => { setPage(0); setRole(e.target.value as AdminRoleName | ''); }}
                className="h-9 rounded-lg border border-[#EAE4D7] bg-white px-2 text-xs outline-none focus:border-[#C59B58]"
              >
                {ROLE_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select
                aria-label="Lọc theo trạng thái"
                value={status}
                onChange={(e) => { setPage(0); setStatus(e.target.value as AdminUserStatus | ''); }}
                className="h-9 rounded-lg border border-[#EAE4D7] bg-white px-2 text-xs outline-none focus:border-[#C59B58]"
              >
                {STATUS_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
              <label className="relative w-full min-w-0 sm:w-72 sm:shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D715E]" />
                <input
                  aria-label="Tìm theo tên, email hoặc username"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm tên, email, username…"
                  className="h-9 w-full rounded-lg border border-[#EAE4D7] bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#C59B58]"
                />
              </label>
              <button
                type="button"
                onClick={() => void loadUsers()}
                disabled={loading}
                aria-label={loading ? 'Đang tải danh sách tài khoản' : 'Làm mới danh sách tài khoản'}
                className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-[#7D715E] transition hover:text-[#8C6226] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40 disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw className={'h-3.5 w-3.5 text-[#B88E4F]' + (loading ? ' animate-spin' : '')} />
                <span>{loading ? 'Đang tải…' : 'Làm mới'}</span>
              </button>
            </div>
          </div>
        </section>

        <p role="status" className="text-xs text-[#7D715E]">
          {loading ? 'Đang tải danh sách…' : `${totalElements.toLocaleString('vi-VN')} tài khoản`}
        </p>

        <div className="overflow-hidden rounded-xl border border-[#EAE4D7] bg-white">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#7D715E]">Đang tải danh sách tài khoản...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-9 w-9 text-[#C59B58]" />
              <p className="mt-3 font-bold">Không tìm thấy tài khoản nào</p>
              <p className="mt-1 text-sm text-[#7D715E]">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EAE4D7] bg-[#FAF8F5] text-xs uppercase tracking-wide text-[#7D715E]">
                    <th className="px-4 py-3 font-semibold">Người dùng</th>
                    <th className="px-4 py-3 font-semibold">Vai trò</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                    <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const adminAccount = isAdminAccount(user);
                    const locked = user.status !== 'ACTIVE';
                    return (
                      <tr key={user.userId} className="border-b border-[#EAE4D7] last:border-0 hover:bg-[#FAF8F5]/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FBF5EB] text-xs font-bold text-[#8C6226] ring-1 ring-[#EEDFC6]">
                              {initials(user.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{user.fullName || user.username}</p>
                              <p className="truncate text-xs text-[#7D715E]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {(user.roles || []).length === 0
                              ? <span className="text-xs text-[#9A8E7B]">—</span>
                              : user.roles.map((r) => (
                                  <Badge key={r} variant={r === 'ADMIN' ? 'amber' : 'neutral'} size="sm">
                                    {ROLE_LABELS[r] || r}
                                  </Badge>
                                ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(user.status)} size="sm">{statusLabel(user.status)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#7D715E]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelected(user)}>
                              Xem
                            </Button>
                            {adminAccount ? (
                              <span
                                title="Không thể thay đổi trạng thái tài khoản Quản trị viên"
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#9A8E7B]"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Admin
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant={locked ? 'dark' : 'outline'}
                                icon={locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                loading={savingId === user.userId}
                                onClick={() => setStatusTarget({ user, nextStatus: locked ? 'ACTIVE' : 'INACTIVE' })}
                              >
                                {locked ? 'Mở khóa' : 'Khóa'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5] p-4 text-xs text-stone-700 sm:flex-row">
            <div>
              Trang <span className="font-bold text-[#1A1612]">{page + 1}</span> / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page <= 0 || loading}
                className="cursor-pointer rounded-lg border border-[#EAE4D7] bg-white p-1.5 text-stone-700 transition-all hover:border-[#C59B58] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="cursor-pointer rounded-lg border border-[#EAE4D7] bg-white p-1.5 text-stone-700 transition-all hover:border-[#C59B58] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: xem chi tiết tài khoản */}
      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Thông tin tài khoản"
        subtitle={selected?.email}
        icon={<Users className="h-5 w-5" />}
        maxWidth="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FBF5EB] text-sm font-bold text-[#8C6226] ring-1 ring-[#EEDFC6]">
                {initials(selected.fullName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{selected.fullName || selected.username}</p>
                <p className="truncate text-xs text-[#7D715E]">@{selected.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#FAF8F5] p-3 text-sm">
              <div><p className="text-xs text-[#7D715E]">Email</p><p className="font-semibold">{selected.email}</p></div>
              <div><p className="text-xs text-[#7D715E]">Số điện thoại</p><p className="font-semibold">{selected.phoneNumber || '—'}</p></div>
              <div><p className="text-xs text-[#7D715E]">Trạng thái</p><p className="font-semibold"><Badge variant={statusBadgeVariant(selected.status)} size="sm">{statusLabel(selected.status)}</Badge></p></div>
              <div><p className="text-xs text-[#7D715E]">Ngày tạo</p><p className="font-semibold">{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '—'}</p></div>
              <div className="col-span-2"><p className="text-xs text-[#7D715E]">Vai trò</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(selected.roles || []).length === 0
                    ? <span className="text-xs text-[#9A8E7B]">—</span>
                    : selected.roles.map((r) => <Badge key={r} variant={r === 'ADMIN' ? 'amber' : 'neutral'} size="sm">{ROLE_LABELS[r] || r}</Badge>)}
                </div>
              </div>
              {selected.address && <div className="col-span-2"><p className="text-xs text-[#7D715E]">Địa chỉ</p><p className="font-semibold">{selected.address}</p></div>}
            </div>
            {isAdminAccount(selected) && (
              <p className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#8C6226]">
                Đây là tài khoản Quản trị viên — chỉ có thể xem, không thể khóa hoặc đổi trạng thái tại đây.
              </p>
            )}
            <div className="flex justify-end">
              <Button variant="outline" icon={<X className="h-4 w-4" />} onClick={() => setSelected(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: xác nhận đổi trạng thái */}
      <Modal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.nextStatus === 'ACTIVE' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        subtitle={statusTarget?.user.email}
        icon={statusTarget?.nextStatus === 'ACTIVE' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        maxWidth="sm"
      >
        {statusTarget && (
          <div className="space-y-4">
            <p className="text-sm text-[#7D715E]">
              {statusTarget.nextStatus === 'ACTIVE'
                ? `Xác nhận mở khóa tài khoản "${statusTarget.user.fullName || statusTarget.user.username}"? Người dùng sẽ có thể đăng nhập và sử dụng lại bình thường.`
                : `Xác nhận khóa tài khoản "${statusTarget.user.fullName || statusTarget.user.username}"? Đây là khóa mềm (soft-delete) — tài khoản sẽ không thể đăng nhập cho đến khi được mở khóa lại.`}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStatusTarget(null)}>Hủy</Button>
              <Button
                type="button"
                variant={statusTarget.nextStatus === 'ACTIVE' ? 'dark' : 'danger'}
                loading={savingId === statusTarget.user.userId}
                onClick={() => void confirmStatusChange()}
              >
                {statusTarget.nextStatus === 'ACTIVE' ? 'Mở khóa' : 'Khóa tài khoản'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
