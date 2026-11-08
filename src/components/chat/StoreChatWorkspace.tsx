import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BadgeCheck, Bell, ChevronDown, Handshake, Loader2,
  Maximize2, MessageSquare, Package, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useResolvedWorkspaceRole } from '@/hooks/useResolvedWorkspaceRole';
import { useChatWorkspaceData, type ChatPartner } from '@/hooks/useChatWorkspaceData';
import { workspaceKeyFromRole, type WorkspaceNavRole } from '@/components/layout/sidebars/resolveWorkspaceRole';
import { workspaceHome } from '@/utils/workspace-access';
import { normalizeSearch } from '@/utils/marketplace.utils';
import { Button } from '@/components/ui/Button';
import { StoreActivityStatus } from '@/components/store/StoreActivityStatus';
import type { ChatProductInfo } from '@/types/chat.types';
import type { ResourceKind } from '@/services/collaboration-chat.service';
import type { PartnershipInvitation } from '@/services/partnership-invitations.service';
import { ChatAvatar } from './ChatAvatar';
import { ChatInvitations } from './ChatInvitations';
import { ChatProductsPanel, ChatResourcesPanel } from './StoreChatWorkspacePanels';
import { StoreChatPanel } from './StoreChatPanel';
import './StoreChatWorkspace.css';

interface StoreChatWorkspaceProps {
  floating?: boolean;
  storeId?: string;
  customerId?: string;
  storeName?: string;
  conversationId?: string;
  collaboratorId?: string;
  product?: ChatProductInfo;
}
type InboxTab = 'ALL' | 'UNREAD' | 'INVITATIONS' | 'SAMPLES';
type ContentTab = 'MESSAGES' | 'PRODUCTS' | 'SAMPLES' | 'DEALS';
const roleLabels: Record<WorkspaceNavRole, string> = {
  CUSTOMER: 'Khách mua sắm', COLLABORATOR: 'Không gian KOL', SHOP_MANAGER: 'Không gian gian hàng',
  SYSTEM_ADMIN: 'Quản trị viên', SYSTEM_MANAGER: 'Quản lý sàn',
};

export function StoreChatWorkspace(props: StoreChatWorkspaceProps) {
  const chat = useScanmsChat();
  const user = useAuthUser();
  const { role } = useResolvedWorkspaceRole(user);
  return <ScopedStoreChatWorkspace key={`${chat.accountId}:${role}`} role={role} {...props} />;
}

function ScopedStoreChatWorkspace({ floating = false, storeId, customerId, storeName,
  conversationId, collaboratorId, product, role }: StoreChatWorkspaceProps & { role: WorkspaceNavRole }) {
  const chat = useScanmsChat();
  const user = useAuthUser();
  const location = useLocation(), navigate = useNavigate();
  const shop = role === 'SHOP_MANAGER', kol = role === 'COLLABORATOR';
  const collaboration = shop || kol;
  const hiddenFloating = floating && (!chat.accountId || /^\/(?:chat|admin|login|register)(?:\/|$)/.test(location.pathname)
    || /\/messages(?:\/|$)|\/customer-messages(?:\/|$)/.test(location.pathname));
  const data = useChatWorkspaceData(chat.accountId, shop, kol, !hiddenFloating && (!floating || chat.isOpen));
  const [search, setSearch] = useState('');
  const [inboxTab, setInboxTab] = useState<InboxTab>('ALL');
  const [contentTab, setContentTab] = useState<ContentTab>('MESSAGES');
  const [composerMode, setComposerMode] = useState<ResourceKind | ''>('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const nextContentTab = useRef<ContentTab>('MESSAGES');
  const open = useRefCallback(chat.openChat), select = useRefCallback(chat.selectConversation);
  const currentProduct = useRefCallback(product);
  const row = chat.activeConversation;
  const rowId = row?.id;
  const backPath = workspaceHome(workspaceKeyFromRole(role), user);

  useEffect(() => {
    if (!floating && !collaboratorId) open.current(storeId ? { id: storeId, name: storeName || 'Gian hàng', customerId } : undefined, currentProduct.current);
  }, [floating, storeId, customerId, storeName, collaboratorId, open, currentProduct, product?.id]);
  useEffect(() => {
    const partner = data.partners.find(item => item.collaboratorId === collaboratorId && (!storeId || item.storeId === storeId));
    if (!floating && collaboratorId && partner) open.current({ id: partner.storeId, name: partner.storeName, customerId: shop ? partner.customerId : undefined }, currentProduct.current);
  }, [data.partners, collaboratorId, storeId, floating, shop, open, currentProduct]);
  useEffect(() => {
    if (hiddenFloating || (floating && !chat.isOpen)) return;
    if (conversationId && chat.conversations.some(item => item.id === conversationId)) select.current(conversationId);
    else if (!rowId && !storeId && !collaboratorId && chat.conversations[0]) select.current(chat.conversations[0].id);
  }, [conversationId, rowId, storeId, collaboratorId, chat.conversations, chat.isOpen, floating, hiddenFloating, select]);
  useEffect(() => {
    setContentTab(nextContentTab.current); nextContentTab.current = 'MESSAGES';
    setComposerMode(''); setError('');
  }, [rowId]);

  const partner = data.partners.find(item => item.storeId === row?.store.id && item.customerId === row?.customerId);
  const activeSamples = collaboration ? (data.samples.data || []).filter(item => item.storeId === row?.store.id && item.customerId === row?.customerId) : [];
  const activeDeals = collaboration ? (data.deals.data || []).filter(item => item.storeId === row?.store.id && (!shop || item.collaboratorId === partner?.collaboratorId)) : [];
  const pendingDeals = activeDeals.filter(item => ['PENDING', 'COUNTERED'].includes(item.status)
    && (item.proposedByUserId ? item.proposedByUserId !== chat.accountId : shop));
  const pendingInvitations = (data.invitations.data || []).filter(item => item.status === 'PENDING');
  const query = normalizeSearch(search);
  const matches = (value: string) => normalizeSearch(value).includes(query);
  const conversations = chat.conversations.filter(item => matches(`${item.peerName || ''} ${item.store.name}`)
    && (inboxTab !== 'UNREAD' || item.unreadCount > 0));
  const unstartedPartners = data.partners.filter(item => matches(`${item.name} ${item.storeName}`)
    && !chat.conversations.some(conversation => conversation.store.id === item.storeId && conversation.customerId === item.customerId));
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        chat.refreshConversations?.(),
        ...(collaboration ? [data.invitations.refetch(), data.samples.refetch(), data.deals.refetch()] : []),
        ...(shop ? [data.shopPartners.refetch()] : []),
      ]);
    } finally { setRefreshing(false); }
  };
  const openPartner = (item: ChatPartner, tab: ContentTab = 'MESSAGES') => {
    nextContentTab.current = tab;
    setInboxTab('ALL'); setContentTab(tab);
    chat.openChat({ id: item.storeId, name: item.storeName, customerId: shop ? item.customerId : undefined });
  };
  const openInvitation = (item: PartnershipInvitation) => {
    const accepted = data.partners.find(partner => partner.storeId === item.storeId && partner.collaboratorId === item.collaboratorId);
    if (accepted) openPartner(accepted);
    else setError('Chưa tải được đối tác của lời mời. Hãy làm mới rồi thử lại.');
  };
  const showLatestDeal = () => {
    setContentTab('MESSAGES');
    requestAnimationFrame(() => {
      const element = document.getElementById(`chat-resource-${pendingDeals[0]?.id}`);
      if (element) element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      else setContentTab('DEALS');
    });
  };
  if (hiddenFloating) return null;
  if (floating && !chat.isOpen && /^\/live(?:\/|$)/.test(location.pathname)) return null;
  if (floating && !chat.isOpen) return <button aria-label="Mở chat" className="store-chat-launcher"
    onClick={() => chat.openChat()}><MessageSquare size={20} />Chat
    {chat.conversations.reduce((total, item) => total + item.unreadCount, 0) || ''}</button>;

  return <div className={`store-chat-workspace${floating ? ' store-chat-workspace--floating' : location.pathname === '/chat' ? ' store-chat-workspace--standalone' : ''}`}
    aria-label={`Tin nhắn SCANMS — ${roleLabels[role]}`}>
    <aside className="store-chat-sidebar">
      <div className="store-chat-sidebar-heading">
        <button type="button" className="store-chat-icon" aria-label="Quay lại không gian của tôi" onClick={() => navigate(backPath)}><ArrowLeft size={18} /></button>
        <div><strong>Tin nhắn <span>SCANMS</span></strong><small>{roleLabels[role]}</small></div>
        <button type="button" className="store-chat-icon" aria-label="Làm mới hội thoại" disabled={refreshing} onClick={() => void refresh()}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
      </div>
      <label className="store-chat-search"><Search size={17} /><input aria-label="Tìm cuộc trò chuyện" value={search}
        onChange={event => setSearch(event.target.value)} placeholder={shop ? 'Tìm khách hàng, KOL…' : 'Tìm gian hàng…'} /></label>
      <nav className="store-chat-inbox-tabs" aria-label="Lọc tin nhắn">
        {([['ALL', 'Tất cả'], ['UNREAD', 'Tin mới'], ...(collaboration ? [['INVITATIONS', `Lời mời${data.invitations.isError ? ' (—)' : data.invitations.isPending ? ' (…)': ` (${pendingInvitations.length})`}`], ['SAMPLES', 'Mẫu thử']] : [])] as [InboxTab, string][])
          .map(([key, label]) => <button key={key} type="button" aria-pressed={inboxTab === key} onClick={() => setInboxTab(key)}>{label}</button>)}
      </nav>
      {role === 'CUSTOMER' && <Link className="store-chat-discover" to="/marketplace"><Plus size={15} />Khám phá gian hàng trên sàn</Link>}
      {kol && <Link className="store-chat-discover" to="/collaborator/referral-links"><Plus size={15} />Khám phá sản phẩm tiếp thị</Link>}
      {shop && <Link className="store-chat-discover" to="/merchant/collaborations"><Plus size={15} />Quản lý lời mời hợp tác</Link>}
      <div className="store-chat-inbox">
        {chat.chatError && <div className="store-chat-error" role="alert"><strong>Có lỗi khi xử lý chat</strong><p>{chat.chatError}</p>
          <button type="button" onClick={() => void refresh()}>Thử lại</button></div>}
        {error && <p className="store-chat-error" role="alert">{error}</p>}
        {inboxTab === 'INVITATIONS' ? <>
          {data.invitations.isPending && <p className="store-chat-loading"><Loader2 size={18} className="animate-spin" />Đang tải lời mời…</p>}
          {data.invitations.isError ? <SideError message="Không tải được lời mời hợp tác." retry={() => void data.invitations.refetch()} />
            : !data.invitations.isPending && <ChatInvitations rows={(data.invitations.data || []).filter(item => matches(`${item.storeName} ${item.collaboratorName}`))}
              shop={shop} onChanged={refresh} onOpen={openInvitation} />}
        </> : inboxTab === 'SAMPLES' ? <>
          {data.samples.isPending && <p className="store-chat-loading"><Loader2 size={18} className="animate-spin" />Đang tải hàng mẫu…</p>}
          {data.samples.isError && <SideError message="Không tải được yêu cầu hàng mẫu." retry={() => void data.samples.refetch()} />}
          {data.samples.data?.filter(item => matches(item.product.title)).map(item => <button key={item.id} className="store-chat-conversation"
            onClick={() => {
              const samplePartner = data.partners.find(partner => partner.storeId === item.storeId && partner.customerId === item.customerId);
              if (!samplePartner) { setError('Hãy làm mới danh sách đối tác để mở yêu cầu này.'); return; }
              openPartner(samplePartner, 'SAMPLES');
            }}><ChatAvatar name={item.product.title} src={item.product.thumbnail} /><span><strong>{item.product.title}</strong>
              <small>Hàng mẫu · {new Date(item.createdAt).toLocaleDateString('vi-VN')}</small></span></button>)}
          {!data.samples.isPending && !data.samples.isError && !data.samples.data?.length && <div className="store-chat-side-empty"><Package size={28} /><p>Chưa có yêu cầu hàng mẫu.</p></div>}
        </> : <>
          {chat.loadingConversations && !chat.conversations.length && <p className="store-chat-loading"><Loader2 size={18} className="animate-spin" />Đang tải hội thoại…</p>}
          {conversations.map(item => <button key={item.id} className={`store-chat-conversation${rowId === item.id ? ' is-active' : ''}`}
            aria-pressed={rowId === item.id} onClick={() => { chat.selectConversation(item.id); setContentTab('MESSAGES'); }}>
            <ChatAvatar name={item.peerName || item.store.name} src={!item.isStoreOwner ? item.store.logoUrl : undefined} />
            <span className="store-chat-conversation-copy"><span><strong>{item.peerName || item.store.name}</strong><time>{shortTime(item.lastCreatedAt)}</time></span>
              <small>{preview(item.lastMessage)}</small>{item.isStoreOwner && <small className="store-chat-conversation-store">{item.store.name}</small>}</span>
            {item.unreadCount > 0 && <b className="store-chat-unread">{item.unreadCount > 99 ? '99+' : item.unreadCount}</b>}
          </button>)}
          {!chat.loadingConversations && !chat.chatError && !conversations.length && <div className="store-chat-side-empty"><MessageSquare size={28} />
            <p>{search ? 'Không tìm thấy cuộc trò chuyện.' : inboxTab === 'UNREAD' ? 'Bạn đã đọc hết tin nhắn.' : 'Chưa có cuộc trò chuyện.'}</p>
            {inboxTab === 'ALL' && !search && <small>{shop ? 'Khách hàng có thể nhắn từ trang gian hàng; bạn cũng có thể chọn KOL đã hợp tác bên dưới.' : 'Chọn gian hàng hoặc đối tác để gửi lời chào đầu tiên.'}</small>}</div>}
          {inboxTab === 'ALL' && unstartedPartners.length > 0 && <div className="store-chat-partners"><h3><Handshake size={14} />{shop ? 'KOL đã hợp tác' : 'Gian hàng đã hợp tác'}</h3>
            {unstartedPartners.map(item => <button key={`${item.storeId}:${item.customerId}`} className="store-chat-conversation" onClick={() => openPartner(item)}>
              <ChatAvatar name={item.name} /><span><strong>{item.name}</strong><small>Đã liên kết hợp tác · Nhắn tin</small></span><MessageSquare size={15} /></button>)}</div>}
          {collaboration && (data.invitations.isError || (shop && data.shopPartners.isError)) && <SideError
            message="Chưa tải được đối tác. Bạn vẫn có thể dùng các hội thoại đã có." retry={() => void refresh()} />}
        </>}
      </div>
      <div className="store-chat-sidebar-footer"><ShieldCheck size={14} /><span>Chỉ người trong hội thoại được xem tin nhắn</span></div>
    </aside>
    <main className="store-chat-main">
      <header className="store-chat-peer-header">
        {row ? <><ChatAvatar name={row.peerName || row.store.name} src={!row.isStoreOwner ? row.store.logoUrl : undefined} />
          <div className="store-chat-peer-copy"><div><strong>{row.peerName || row.store.name}</strong>
            {!row.isStoreOwner && row.store.isVerified && <span className="store-chat-verified"><BadgeCheck size={13} />Đã xác minh</span>}</div>
            <small>{row.isStoreOwner ? partner ? 'Đối tác KOL · Đã liên kết hợp tác' : 'Khách hàng của gian hàng' : <StoreActivityStatus storeId={row.store.id} />}
              <span className="store-chat-connection" role="status">{chat.connectionState}</span></small></div>
          <div className="store-chat-peer-actions">
            {kol && partner && <Button size="sm" variant="secondary" onClick={() => { setContentTab('MESSAGES'); setComposerMode('COMMISSION_DEAL'); }}><Plus size={15} />Đề xuất hoa hồng</Button>}
            <Link className="store-chat-link-button" to={`/shops/${encodeURIComponent(row.store.slug || row.store.id)}`}>Xem gian hàng<ArrowUpRight size={15} /></Link>
          </div>
        </> : <div className="store-chat-peer-copy"><strong>Trò chuyện trên SCANMS</strong><small>Tin nhắn, sản phẩm và hợp tác trong cùng một nơi</small></div>}
        {floating && <div className="store-chat-window-actions">
          <button type="button" className="store-chat-icon" aria-label="Mở chat toàn trang" onClick={() => navigate(`/chat${row ? `?conversationId=${encodeURIComponent(row.id)}` : ''}`)}><Maximize2 size={16} /></button>
          <button type="button" className="store-chat-icon" aria-label="Đóng chat" onClick={chat.closeChat}><X size={18} /></button>
        </div>}
      </header>
      {row ? <>
        <nav className="store-chat-content-tabs" aria-label="Nội dung hội thoại">
          {([['MESSAGES', 'Tin nhắn', MessageSquare], ['PRODUCTS', 'Sản phẩm', ShoppingBag],
            ...(collaboration && partner ? [['SAMPLES', 'Hàng mẫu', Package]] : [])] as [ContentTab, string, typeof MessageSquare][])
            .map(([key, label, Icon], index) => <button key={key} type="button" aria-pressed={contentTab === key}
              onClick={() => { setContentTab(key); setComposerMode(''); }}><span>{index + 1}</span><Icon size={16} />{label}
              {key === 'SAMPLES' && activeSamples.length > 0 && <small>{activeSamples.length}</small>}</button>)}
        </nav>
        {pendingDeals.length > 0 && <div className="store-chat-deal-notice"><span className="store-chat-deal-emblem"><Handshake size={19} /></span>
          <div><strong>Có {pendingDeals.length} đề xuất hoa hồng đang chờ bạn phản hồi</strong><small>{pendingDeals[0].productName}</small></div>
          <button type="button" onClick={showLatestDeal}>Xem đề xuất<ChevronDown size={14} /></button></div>}
        <div className="store-chat-thread-slot" hidden={contentTab !== 'MESSAGES'}>
          <StoreChatPanel canCollaborate={kol && Boolean(partner)} composerMode={composerMode} onComposerModeChange={setComposerMode} />
        </div>
        {contentTab === 'PRODUCTS' && <ChatProductsPanel storeId={row.store.id} onSend={product => {
          setContentTab('MESSAGES'); void chat.sendProductsInquiry([product]);
        }} />}
        {contentTab === 'SAMPLES' && <ChatResourcesPanel kind="SAMPLE_REQUEST" ids={activeSamples.map(item => item.id)} shop={Boolean(row.isStoreOwner)}
          loading={data.samples.isPending} error={data.samples.isError} onRetry={() => void data.samples.refetch()}
          onCreate={kol && partner ? () => { setContentTab('MESSAGES'); setComposerMode('SAMPLE_REQUEST'); } : undefined} />}
        {contentTab === 'DEALS' && <ChatResourcesPanel kind="COMMISSION_DEAL" ids={activeDeals.map(item => item.id)} shop={Boolean(row.isStoreOwner)}
          loading={data.deals.isPending} error={data.deals.isError} onRetry={() => void data.deals.refetch()} />}
      </> : <div className="store-chat-welcome">
        <div className="store-chat-welcome-art"><MessageSquare size={42} /><span><Handshake size={21} /></span></div>
        <span className="store-chat-eyebrow">KẾT NỐI TRÊN SCANMS</span>
        <h1>{chat.chatError ? 'Chưa kết nối được hộp thư' : chat.loadingConversations ? 'Đang mở hộp thư của bạn' : 'Bắt đầu một cuộc trò chuyện'}</h1>
        <p>{chat.chatError ? 'Kiểm tra kết nối dịch vụ và thử tải lại. Các tin nhắn đã lưu vẫn được giữ trên máy chủ.'
          : shop ? 'Chọn khách hàng hoặc KOL ở danh sách bên trái. Các lời mời và hàng mẫu được quản lý riêng theo từng đối tác.'
            : kol ? 'Chọn gian hàng đã hợp tác hoặc xem lời mời mới. Bạn có thể trao đổi sản phẩm, hoa hồng và yêu cầu hàng mẫu ngay tại đây.'
              : role === 'CUSTOMER' ? 'Chọn cuộc trò chuyện bên trái hoặc mở trang gian hàng và bấm Chat ngay để hỏi về sản phẩm.'
                : 'Hộp thư chỉ hiển thị cuộc trò chuyện mà tài khoản của bạn tham gia. Bạn có thể quay về không gian quản trị từ nút bên trái.'}</p>
        <div className="store-chat-welcome-actions">{chat.chatError ? <Button variant="outline" onClick={() => void refresh()}><RefreshCw size={16} />Tải lại hộp thư</Button>
          : collaboration ? <Button variant="secondary" onClick={() => setInboxTab('INVITATIONS')}><Bell size={16} />Xem lời mời hợp tác</Button>
            : <Link className="store-chat-link-button" to={backPath}><ArrowLeft size={15} />{role === 'CUSTOMER' ? 'Khám phá gian hàng' : 'Về không gian của tôi'}</Link>}</div>
        <div className="store-chat-welcome-points"><span><ShieldCheck size={16} />Hội thoại riêng tư</span><span><ShoppingBag size={16} />Trao đổi đúng sản phẩm</span><span><Package size={16} />Gửi ảnh và tài liệu</span></div>
      </div>}
    </main>
  </div>;
}

function SideError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="store-chat-error" role="alert"><p>{message}</p><button type="button" onClick={retry}>Thử lại</button></div>;
}
function useRefCallback<T>(value: T) { const ref = useRef(value); ref.current = value; return ref; }
function shortTime(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
function preview(text: string) {
  try {
    const card = JSON.parse(text);
    return card.type === 'COMMISSION_DEAL' ? 'Đề xuất hoa hồng' : card.type === 'SAMPLE_REQUEST' ? 'Yêu cầu hàng mẫu' : card.type === 'PRODUCT_INQUIRY' ? 'Trao đổi sản phẩm' : text;
  } catch { return text; }
}
