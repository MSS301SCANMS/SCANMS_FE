import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Percent, Search, Pencil } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import './commission-policies.css';

const scopes = { PLATFORM: 'Toàn hệ thống', STORE: 'Gian hàng', PRODUCT: 'Sản phẩm', LIVESTREAM: 'Livestream', COLLABORATOR: 'KOL' };
const statuses = { DRAFT: 'Bản nháp', ACTIVE: 'Đang bật', INACTIVE: 'Đã tắt', EXPIRED: 'Đã kết thúc' };
type Scope = keyof typeof scopes;
type Status = keyof typeof statuses;
type Policy = { policyId: string; policyName: string; scopeType: Scope; commissionRate: number; returnWindowDays: number; status: Status; priority: number; validFrom: string; validTo: string | null; version: number; storeId?: string; productId?: string; livestreamId?: string; collaboratorId?: string };
const fields = { STORE: 'storeId', PRODUCT: 'productId', LIVESTREAM: 'livestreamId', COLLABORATOR: 'collaboratorId' } as const;
const unwrap = (res: any) => res?.result ?? res?.data ?? res;
const message = (err: any) => err?.response?.data?.message || err?.message || 'Không thể lưu chính sách. Vui lòng thử lại.';
const localDate = (value: string) => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const dateLabel = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
function effectiveStatus(row: Policy) {
  if (row.status !== 'ACTIVE') return statuses[row.status] || row.status;
  if (row.validTo && new Date(row.validTo).getTime() <= Date.now()) return 'Hết hiệu lực';
  if (new Date(row.validFrom).getTime() > Date.now()) return 'Chưa đến hạn';
  return 'Đang áp dụng';
}

export default function CommissionPoliciesManager() {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [editor, setEditor] = useState<{ policy?: Policy } | null>(null);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ policyName: '', scopeType: 'PLATFORM' as Scope, target: '', commissionRate: '10', returnWindowDays: '14', priority: '0', status: 'DRAFT' as Status, validFrom: '', validTo: '' });
  const list = useQuery({
    queryKey: ['commission-policies'], staleTime: 0, refetchOnWindowFocus: true,
    queryFn: async () => {
      const value = unwrap(await api.get('/commission-policies', { headers: { 'x-skip-cache': 'true' } }));
      if (!Array.isArray(value) || value.some(row => !row?.policyId || !row?.policyName || !row?.scopeType || row.commissionRate == null)) throw new Error('Dữ liệu chính sách chưa hợp lệ. Vui lòng tải lại.');
      return value as Policy[];
    },
  });
  const targetScope = form.scopeType;
  const targets = useQuery({
    queryKey: ['commission-policy-targets', targetScope], enabled: !!editor && targetScope !== 'PLATFORM', retry: false,
    queryFn: async () => {
      const path = { STORE: '/stores/marketplace', PRODUCT: '/products', LIVESTREAM: '/livestreams', COLLABORATOR: '/collaborators' }[targetScope as Exclude<Scope, 'PLATFORM'>];
      const value = unwrap(await api.get(path, { headers: { 'x-skip-cache': 'true' } }));
      if (!Array.isArray(value)) throw new Error('Chưa tải được danh sách đối tượng.');
      const key = fields[targetScope as Exclude<Scope, 'PLATFORM'>];
      return value.map(item => ({ id: String(item[key] || item.id || ''), name: item.storeName || item.productName || item.title || item.fullName || item.name || item.user?.fullName || item[key] || item.id })).filter(item => item.id);
    },
  });
  const save = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const current = editor?.policy;
      const result = unwrap(current ? await api.put(`/commission-policies/${current.policyId}?version=${current.version}`, body) : await api.post('/commission-policies', body));
      if (!result?.policyId) throw new Error('Máy chủ chưa xác nhận lưu chính sách. Hãy tải lại danh sách để kiểm tra.');
      return result;
    },
    onSuccess: async () => { setEditor(null); setNotice('Đã lưu chính sách hoa hồng.'); await client.invalidateQueries({ queryKey: ['commission-policies'] }); },
    onError: error => setFormError(message(error)),
  });
  function open(policy?: Policy) {
    save.reset(); setNotice(''); setFormError('');
    setForm({ policyName: policy?.policyName || '', scopeType: policy?.scopeType || 'PLATFORM', target: policy && policy.scopeType !== 'PLATFORM' ? policy[fields[policy.scopeType]] || '' : '', commissionRate: String(policy?.commissionRate ?? 10), returnWindowDays: String(policy?.returnWindowDays ?? 14), priority: String(policy?.priority ?? 0), status: policy?.status || 'DRAFT', validFrom: localDate(policy?.validFrom || new Date().toISOString()), validTo: policy?.validTo ? localDate(policy.validTo) : '' });
    setEditor({ policy });
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setFormError('');
    if (save.isPending) return;
    const start = new Date(form.validFrom), end = form.validTo ? new Date(form.validTo) : null;
    if (!form.policyName.trim() || !Number.isFinite(start.getTime()) || (end && (!Number.isFinite(end.getTime()) || end <= start))) { setFormError('Kiểm tra tên chính sách và thời hạn. Ngày kết thúc phải sau ngày bắt đầu.'); return; }
    if (form.scopeType !== 'PLATFORM' && !form.target) { setFormError('Vui lòng chọn đối tượng áp dụng.'); return; }
    save.mutate({ policyName: form.policyName.trim(), scopeType: form.scopeType, storeId: null, productId: null, livestreamId: null, collaboratorId: null, ...(form.scopeType !== 'PLATFORM' ? { [fields[form.scopeType]]: form.target } : {}), commissionRate: Number(form.commissionRate), returnWindowDays: Number(form.returnWindowDays), priority: Number(form.priority), status: form.status, validFrom: start.toISOString(), validTo: end?.toISOString() || null });
  }
  const rows = (list.data || []).filter(row => (scope === 'ALL' || row.scopeType === scope) && (status === 'ALL' || row.status === status) && row.policyName.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  return <div className="commission-policies">
    <div className="cp-toolbar">
      <label className="cp-search"><Search size={17} /><input aria-label="Tìm chính sách" placeholder="Tìm tên chính sách…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <select aria-label="Lọc phạm vi" value={scope} onChange={e => setScope(e.target.value)}><option value="ALL">Tất cả phạm vi</option>{Object.entries(scopes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="Lọc trạng thái" value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <button type="button" aria-label="Làm mới chính sách" disabled={list.isFetching} onClick={() => void list.refetch()}><RefreshCw size={16} className={list.isFetching ? 'animate-spin' : ''} /></button>
      <button type="button" className="cp-primary" onClick={() => open()}><Plus size={16} />Tạo chính sách</button>
    </div>
    {notice && <div role="status" className="cp-notice">{notice}<button aria-label="Đóng thông báo" onClick={() => setNotice('')}>×</button></div>}
    {list.isError ? <div role="alert" className="cp-empty"><p>{message(list.error)}</p><button onClick={() => void list.refetch()}>Thử lại</button></div> : list.isLoading ? <div role="status" className="cp-empty">Đang tải chính sách hoa hồng…</div> : <section className="cp-list" aria-label="Danh sách chính sách hoa hồng">
      <div className="cp-list-heading"><strong>Chính sách hoa hồng</strong><span>{rows.length} / {list.data?.length || 0} chính sách</span></div>
      {!rows.length ? <div className="cp-empty"><Percent size={28} /><strong>{list.data?.length ? 'Không có chính sách phù hợp' : 'Chưa có chính sách hoa hồng'}</strong><p>{list.data?.length ? 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Tạo chính sách để thiết lập tỷ lệ hoa hồng và thời hạn áp dụng.'}</p>{!list.data?.length && <button className="cp-primary" onClick={() => open()}><Plus size={16} />Tạo chính sách đầu tiên</button>}</div> : <div className="cp-table-scroll"><table><thead><tr><th>Chính sách / Phạm vi</th><th>Hoa hồng</th><th>Chờ trả hàng</th><th>Hiệu lực</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{rows.map(row => <tr key={row.policyId}>
        <td><strong>{row.policyName}</strong><small>{scopes[row.scopeType]}{row.scopeType !== 'PLATFORM' && ` · ${row[fields[row.scopeType]] || 'Chưa có đối tượng'}`}</small></td>
        <td><strong>{Number(row.commissionRate).toLocaleString('vi-VN')}%</strong><small>Ưu tiên: {row.priority}</small></td><td>{row.returnWindowDays} ngày</td>
        <td><span>{dateLabel(row.validFrom)}</span><small>{row.validTo ? `Đến ${dateLabel(row.validTo)}` : 'Không giới hạn ngày kết thúc'}</small></td>
        <td><span className={`cp-status ${effectiveStatus(row) === 'Đang áp dụng' ? 'cp-status-active' : ''}`}>{effectiveStatus(row)}</span></td>
        <td><button type="button" aria-label={`Chỉnh sửa ${row.policyName}`} onClick={() => open(row)}><Pencil size={14} />Chỉnh sửa</button></td>
      </tr>)}</tbody></table></div>}
    </section>}
    <Modal isOpen={!!editor} onClose={() => { if (!save.isPending) setEditor(null); }} title={editor?.policy ? 'Chỉnh sửa chính sách hoa hồng' : 'Tạo chính sách hoa hồng'} maxWidth="2xl" stickyHeader className="cp-editor"
      footer={<div className="cp-form-actions"><button type="button" disabled={save.isPending} onClick={() => setEditor(null)}>Hủy</button><button form="commission-policy-form" className="cp-primary" type="submit" disabled={save.isPending || (form.scopeType !== 'PLATFORM' && (targets.isFetching || targets.isError))}>{save.isPending ? 'Đang lưu…' : 'Lưu chính sách'}</button></div>}>
      <form id="commission-policy-form" className="cp-form" onSubmit={submit}>
        {formError && <div role="alert" className="cp-form-error">{formError}</div>}
        <label className="cp-full">Tên chính sách *<input name="policyName" required maxLength={255} value={form.policyName} onChange={e => setForm({ ...form, policyName: e.target.value })} /></label>
        <label>Phạm vi áp dụng *<select name="scopeType" value={form.scopeType} onChange={e => setForm({ ...form, scopeType: e.target.value as Scope, target: '' })}>{Object.entries(scopes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Trạng thái *<select name="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        {form.scopeType !== 'PLATFORM' && <label className="cp-full">{scopes[form.scopeType]} áp dụng *<select name="target" required value={form.target} disabled={targets.isFetching || targets.isError} onChange={e => setForm({ ...form, target: e.target.value })}><option value="">{targets.isFetching ? 'Đang tải…' : 'Chọn đối tượng'}</option>{form.target && !targets.data?.some(item => item.id === form.target) && <option value={form.target}>{form.target} (đã lưu)</option>}{targets.data?.map(item => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}</select>{targets.isError && <span role="alert">Không tải được danh sách. <button type="button" onClick={() => void targets.refetch()}>Thử lại</button></span>}{!targets.isFetching && !targets.isError && !targets.data?.length && <small>Chưa có đối tượng khả dụng.</small>}</label>}
        <label>Tỷ lệ hoa hồng (%) *<input name="commissionRate" required type="number" min="0" max="100" step="0.000001" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: e.target.value })} /><small>Nhập 10 tương ứng 10% giá trị tính hoa hồng.</small></label>
        <label>Số ngày chờ trả hàng *<input name="returnWindowDays" required type="number" min="0" step="1" value={form.returnWindowDays} onChange={e => setForm({ ...form, returnWindowDays: e.target.value })} /></label>
        <label>Bắt đầu áp dụng *<input name="validFrom" required type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} /></label>
        <label>Kết thúc áp dụng<input name="validTo" type="datetime-local" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })} /><small>Để trống nếu không có ngày kết thúc.</small></label>
        <label>Độ ưu tiên *<input name="priority" required type="number" min="0" step="1" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} /></label>
        <p className="cp-full cp-help">Chỉ áp dụng chính sách đang bật và trong thời hạn. Trong cùng phạm vi, số ưu tiên lớn hơn được chọn trước. Thay đổi không tính lại hoa hồng đã ghi nhận.</p>
      </form>
    </Modal>
  </div>;
}
