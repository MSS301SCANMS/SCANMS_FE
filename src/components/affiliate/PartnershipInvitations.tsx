import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Check, Handshake, Loader2, Mail, Plus, Search, Send, Users, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { partnershipInvitationsService as service, type InvitationCatalog, type PartnershipInvitation } from '@/services/partnership-invitations.service';
import { toast } from '@/utils/toast';
import './partnership-invitations.css';

const labels = { PENDING: 'Chờ phản hồi', ACCEPTED: 'Đã đồng ý', REJECTED: 'Đã từ chối', CANCELLED: 'Đã thu hồi' };
const defaultInvitationMessage = 'Chào bạn, shop mong muốn kết nối và trao đổi cơ hội hợp tác cùng bạn.';
const norm = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
const date = (value: string) => new Date(/Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Chưa thực hiện được thao tác. Vui lòng thử lại.';

function ShopIntroduction({ name }: { name: string }) {
  return <div className="partnership-note"><strong>Gian hàng {name}</strong><p className="mb-0 mt-1">Lời mời kết nối với KOL. Bạn có thể gửi ngay cả khi gian hàng chưa có sản phẩm.</p></div>;
}

function InvitationDetail({ invitation: row, mode, error }: { invitation: PartnershipInvitation; mode: 'shop' | 'kol'; error: string }) {
  return <div className="partnership-detail">
    <label>Gian hàng hợp tác</label><strong>{row.storeName}</strong>
    {row.productId && <><label>Sản phẩm đã gắn</label><Link to={`/products/${encodeURIComponent(row.productId)}`}>{row.productName}<ArrowUpRight size={15} /></Link></>}
    <label>Lời nhắn từ gian hàng</label><p className="partnership-message">{row.message}</p>
    <p className="partnership-note">{row.productId
      ? 'Lời mời này đã gắn sản phẩm. Khi đồng ý, liên kết tiếp thị được tạo theo chính sách hoa hồng hiện hành.'
      : 'Đồng ý để xác nhận kết nối giữa KOL và gian hàng. Hai bên có thể chọn sản phẩm và trao đổi nội dung hợp tác sau; bước này chưa tạo liên kết tiếp thị hay phát sinh thanh toán.'}</p>
    {row.status === 'ACCEPTED' && mode === 'kol' && row.referralToken && <Link className="partnership-button primary" to="/collaborator/marketing?tab=links">Mở liên kết tiếp thị<ArrowUpRight size={15} /></Link>}
    {error && <div role="alert" className="partnership-error">{error}</div>}
  </div>;
}

export function PartnershipInvitations({ mode }: { mode: 'shop' | 'kol' }) {
  const [rows, setRows] = useState<PartnershipInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PartnershipInvitation | null>(null);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const sequence = useRef(0);
  const unavailable = useRef(false);
  const load = useCallback(async () => {
    const request = ++sequence.current; unavailable.current = false; setLoading(true); setError('');
    try { const result = await service.list(mode); if (request === sequence.current) setRows(result); }
    catch (cause) { if (request === sequence.current) { unavailable.current = Boolean((cause as { unavailableEndpoint?: boolean })?.unavailableEndpoint); setError(messageOf(cause)); } }
    finally { if (request === sequence.current) setLoading(false); }
  }, [mode]);
  useEffect(() => { const request = sequence; void load(); const timer = window.setInterval(() => { if (!document.hidden && !actionLock.current && !unavailable.current) void load(); }, 30000); return () => { request.current++; clearInterval(timer); }; }, [load]);
  const pending = rows.filter(row => row.status === 'PENDING').length;
  const filtered = rows.filter(row => filter === 'ALL' || row.status === filter);
  const act = async (row: PartnershipInvitation, decision: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => {
    if (actionLock.current) return; actionLock.current = true; setBusy(true); setError('');
    try {
      const saved = decision === 'CANCELLED' ? await service.cancel(row.id) : await service.respond(row.id, decision);
      setRows(current => current.map(item => item.id === saved.id ? saved : item)); setSelected(null);
      toast.success(decision === 'ACCEPTED' ? saved.referralToken ? 'Đã đồng ý hợp tác và tạo liên kết tiếp thị.' : 'Đã đồng ý kết nối hợp tác với gian hàng.' : decision === 'REJECTED' ? 'Đã từ chối lời mời.' : 'Đã thu hồi lời mời.');
      await load();
    } catch (cause) { setError(messageOf(cause)); }
    finally { actionLock.current = false; setBusy(false); }
  };
  return <section className="partnership" aria-label={mode === 'shop' ? 'Lời mời KOL của shop' : 'Lời mời hợp tác từ shop'}>
    <header className="partnership-header"><div className="partnership-heading"><span className="partnership-icon"><Handshake size={21} /></span><div><h2>{mode === 'shop' ? 'Kết nối với KOL' : 'Lời mời hợp tác'}</h2><p>{mode === 'shop' ? 'Kết nối với nhà sáng tạo và trao đổi cơ hội hợp tác.' : 'Xem gian hàng và lời nhắn trước khi quyết định hợp tác.'}</p></div></div>
      {mode === 'shop' && <button type="button" className="partnership-button primary" onClick={() => setOpen(true)}><Plus size={16} />Mời KOL hợp tác</button>}
    </header>
    <div className="partnership-toolbar"><div className="partnership-filters" aria-label="Lọc lời mời">{[['ALL', `Tất cả (${rows.length})`], ['PENDING', `Chờ phản hồi (${pending})`], ['ACCEPTED', 'Đã đồng ý'], ['REJECTED', 'Đã từ chối'], ['CANCELLED', 'Đã thu hồi']].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><button type="button" className="partnership-button subtle" disabled={loading || busy} onClick={() => void load()}>{loading ? 'Đang tải…' : 'Cập nhật'}</button></div>
    {error && <div role="alert" className="partnership-error"><AlertCircle size={17} /><span>{error}</span></div>}
    {loading && !rows.length ? <div className="partnership-empty" role="status"><Loader2 size={24} className="animate-spin" /><p>Đang tải lời mời…</p></div> : !filtered.length ? <div className="partnership-empty"><Mail size={26} /><strong>{error ? 'Chưa tải được lời mời' : filter !== 'ALL' ? 'Chưa có lời mời ở trạng thái này' : 'Bắt đầu một hợp tác mới'}</strong><p>{mode === 'shop' ? 'Chọn KOL phù hợp và gửi lời mời kết nối với gian hàng.' : 'Khi shop gửi lời mời, bạn sẽ xem và phản hồi tại đây.'}</p>{mode === 'shop' && !error && filter === 'ALL' && <button type="button" className="partnership-button" onClick={() => setOpen(true)}><Users size={15} />Tìm KOL phù hợp</button>}</div> : <div className="partnership-list">{filtered.map(row => <article key={row.id} className="partnership-row"><div className="partnership-avatar">{(mode === 'shop' ? row.collaboratorName : row.storeName)?.slice(0, 1) || 'K'}</div><div className="partnership-row-copy"><strong>{mode === 'shop' ? row.collaboratorName : row.storeName}</strong><span>{row.productName || row.storeName}</span><small>Gửi lúc {date(row.createdAt)}</small></div><span className={`partnership-badge ${row.status.toLowerCase()}`}>{labels[row.status]}</span><button type="button" className="partnership-button" onClick={() => setSelected(row)}>Xem lời mời<ArrowUpRight size={14} /></button></article>)}</div>}
    {open && <InviteComposer onClose={() => setOpen(false)} onSent={() => { setOpen(false); void load(); }} />}
    {selected && <Modal isOpen stickyHeader maxWidth="xl" title="Chi tiết lời mời hợp tác" subtitle={mode === 'shop' ? selected.collaboratorName : selected.storeName} onClose={() => { if (!busy) setSelected(null); }} footer={<div className="partnership-detail-footer">{selected.status === 'PENDING' ? mode === 'shop' ? <button type="button" disabled={busy} className="partnership-button danger" onClick={() => void act(selected, 'CANCELLED')}>Thu hồi lời mời</button> : <><button type="button" disabled={busy} className="partnership-button" onClick={() => void act(selected, 'REJECTED')}><X size={15} />Từ chối</button><button type="button" disabled={busy} className="partnership-button primary" onClick={() => void act(selected, 'ACCEPTED')}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}Đồng ý hợp tác</button></> : <span className={`partnership-badge ${selected.status.toLowerCase()}`}>{labels[selected.status]}</span>}</div>}>
      <InvitationDetail invitation={selected} mode={mode} error={error} />
    </Modal>}
  </section>;
}

function InviteComposer({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [catalog, setCatalog] = useState<InvitationCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const lock = useRef(false);
  const reload = useCallback(async () => { setLoading(true); setError(''); try { const data = await service.catalog(); if (!data?.storeId || !Array.isArray(data.products) || !Array.isArray(data.creators)) throw new Error('Chưa tải được danh mục hợp tác.'); setCatalog(data); } catch (cause) { setError(messageOf(cause)); } finally { setLoading(false); } }, []);
  useEffect(() => { void reload(); }, [reload]);
  const creators = useMemo(() => (catalog?.creators || []).filter(creator => norm(`${creator.name} ${creator.platform}`).includes(norm(query.trim()))), [catalog, query]);
  const creator = catalog?.creators.find(item => item.id === creatorId);
  const formHint = creator ? `Đã chọn: ${creator.name} · lời nhắn không bắt buộc` : 'Chọn một KOL để bắt đầu';
  const send = async (event: React.FormEvent) => {
    event.preventDefault(); if (lock.current || !catalog) return;
    if (!creatorId) { setError('Hãy chọn KOL trước khi gửi lời mời.'); return; }
    lock.current = true; setSending(true); setError('');
    try { await service.send({ storeId: catalog.storeId, collaboratorId: creatorId, message: message.trim() || defaultInvitationMessage }); toast.success('Đã gửi lời mời. KOL sẽ xem trong mục Lời mời hợp tác.'); onSent(); }
    catch (cause) { setError(messageOf(cause)); }
    finally { lock.current = false; setSending(false); }
  };
  return <Modal isOpen stickyHeader maxWidth="4xl" title="Mời KOL hợp tác" subtitle="Gửi lời mời kết nối giữa gian hàng và nhà sáng tạo" onClose={() => { if (!sending) onClose(); }} footer={<div className="partnership-composer-footer"><span>{formHint}</span><button type="submit" form="partnership-invite-form" disabled={sending || loading || !creatorId} className="partnership-button primary">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{sending ? 'Đang gửi…' : 'Gửi lời mời'}</button></div>}>
    <form id="partnership-invite-form" className="partnership-composer" onSubmit={send}>
      {error && <div role="alert" className="partnership-error"><AlertCircle size={17} /><span>{error}</span>{!catalog && <button type="button" onClick={() => void reload()}>Thử lại</button>}</div>}
      {loading ? <div className="partnership-empty" role="status"><Loader2 className="animate-spin" />Đang tìm đối tác…</div> : catalog && <div className="partnership-compose-grid"><section className="partnership-discovery"><h3><span>01</span>Chọn nhà sáng tạo</h3><div className="partnership-search"><Search size={16} /><input aria-label="Tìm KOL đã duyệt" placeholder="Tìm tên kênh, nền tảng…" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="partnership-creators" role="group" aria-label="KOL đã được duyệt">{creators.length ? creators.map(item => <button type="button" key={item.id} aria-pressed={creatorId === item.id} onClick={() => setCreatorId(item.id)} className="partnership-creator"><span className="partnership-avatar">{item.name.slice(0, 1)}</span><span><strong>{item.name}</strong><small>{item.platform} · {new Intl.NumberFormat('vi-VN').format(item.followers)} người theo dõi</small></span><span className="partnership-choice">{creatorId === item.id && <Check size={13} />}</span></button>) : <p className="partnership-note">{query ? 'Không có KOL phù hợp với từ khóa.' : 'Chưa có KOL đã duyệt để mời. Hồ sơ KOL cần được manager phê duyệt trước.'}</p>}</div></section><section className="partnership-offer"><h3><span>02</span>Nội dung hợp tác</h3><ShopIntroduction name={catalog.storeName} /><label htmlFor="partnership-message">Lời nhắn cho KOL (không bắt buộc)</label><textarea id="partnership-message" maxLength={2000} rows={6} value={message} onChange={event => setMessage(event.target.value)} placeholder="Để trống để gửi lời mời kết nối mặc định, hoặc viết lời nhắn riêng…" /><small className="partnership-counter">{message.length}/2.000 ký tự</small><p className="partnership-note">Lời nhắn không bắt buộc. KOL có quyền đồng ý hoặc từ chối; sau khi kết nối, hai bên có thể chọn sản phẩm và thỏa thuận nội dung hợp tác.</p></section></div>}
    </form>
  </Modal>;
}
