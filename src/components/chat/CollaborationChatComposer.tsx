import { useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import { productCommissionDeals } from '@/services/product-commission-deals.service';
import { collaborationChat } from '@/services/collaboration-chat.service';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProductChoice {
  id: string;
  name: string
}

export function CollaborationChatComposer() {
  const {activeConversation: conversation, sendMessage} = useScanmsChat();
  const storeId = conversation?.store.id;
  const [mode, setMode] = useState<'COMMISSION_DEAL' | 'SAMPLE_REQUEST' | ''>('');
  const [products, setProducts] = useState<ProductChoice[]>([]);
  const [productId, setProduct] = useState('');
  const [points, setPoints] = useState(1);
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef({fingerprint: '', id: crypto.randomUUID()});
  let kol = false;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    kol = [user.role, ...(user.roles || [])].some(role => ['KOL_CTV', 'COLLABORATOR'].includes(role));
  } catch { /* Server remains authoritative. */
  }
  useEffect(() => {
    setMode('');
    setProducts([]);
    setProduct('');
    setError('');
  }, [conversation?.id]);
  useEffect(() => {
    if (!mode || !storeId) return;
    let cancelled = false;
    void api.get('/public/products', {
      params: {storeId, page: 1, limit: 100},
      headers: {'x-skip-cache': '1'}
    }).then(response => {
      const result = (response as unknown as { data?: { items?: unknown[] }; result?: { items?: unknown[] } });
      const rows = result.result?.items || result.data?.items || [];
      const choices = rows.map(item => {
        const product = item as { id?: string; productId?: string; name?: string; title?: string };
        return {id: product.productId || product.id || '', name: product.name || product.title || 'Sản phẩm'};
      });
      if (!cancelled) {
        setProducts(choices);
        setProduct(choices[0]?.id || '');
      }
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Không tải được sản phẩm.');
    });
    return () => {
      cancelled = true;
    };
  }, [mode, storeId]);
  if (!kol || conversation?.isStoreOwner) return null;
  const submit = async () => {
    setPending(true);
    setError('');
    try {
      let id: string;
      if (mode === 'COMMISSION_DEAL') {
        id = (await productCommissionDeals.propose(productId, points, note)).id;
      } else {
        const fingerprint = JSON.stringify([productId, note, name, phone, address]);
        if (request.current.fingerprint !== fingerprint) request.current = {
          fingerprint,
          id: crypto.randomUUID()
        };
        id = (await collaborationChat.createSample({
          requestId: request.current.id,
          productId,
          note,
          recipientName: name,
          recipientPhone: phone,
          shippingAddress: address
        })).id;
      }
      await sendMessage(JSON.stringify({type: mode, resourceId: id}));
      setMode('');
      setNote('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa gửi được đề xuất.');
    } finally {
      setPending(false);
    }
  };
  return <div className="border-t border-[#EAE4D7] p-3 text-sm">
    <div className="flex gap-2"><Button size="sm" variant="outline"
                      onClick={() => setMode(mode === 'COMMISSION_DEAL' ? '' : 'COMMISSION_DEAL')}>Đề
      xuất hoa hồng</Button><Button size="sm" variant="outline"
                     onClick={() => setMode(mode === 'SAMPLE_REQUEST' ? '' : 'SAMPLE_REQUEST')}>Xin
      hàng dùng thử</Button></div>
    {mode && <form className="mt-3 grid grid-cols-2 gap-2" onSubmit={event => {
      event.preventDefault();
      void submit();
    }}>
      <select aria-label="Sản phẩm hợp tác" className="col-span-2 rounded-xl border border-[#EAE4D7] p-2" required
          value={productId}
          onChange={event => setProduct(event.target.value)}>{products.length ? products.map(p => <option
          key={p.id} value={p.id}>{p.name}</option>) :
        <option value="">Chưa có sản phẩm đang bán</option>}</select>
      {mode === 'COMMISSION_DEAL' && <label className="col-span-2">Tăng so với mức cơ bản <select value={points}
                                                    onChange={event => setPoints(Number(event.target.value))}
                                                    className="ml-2 rounded-xl border border-[#EAE4D7] p-2">{[1, 2, 3].map(value =>
        <option key={value} value={value}>+{value} điểm %</option>)}</select></label>}
      <textarea aria-label="Nội dung đề nghị" required minLength={mode === 'COMMISSION_DEAL' ? 10 : 1}
           maxLength={1000} value={note} onChange={event => setNote(event.target.value)}
           placeholder="Nội dung đề nghị" className="col-span-2 rounded-xl border border-[#EAE4D7] p-2"/>
      {mode === 'SAMPLE_REQUEST' && <><Input required maxLength={255} aria-label="Người nhận hàng mẫu"
                         placeholder="Tên người nhận" value={name}
                         onChange={event => setName(event.target.value)}/><Input required
                                                     pattern="[+0-9 ()-]{9,20}"
                                                     aria-label="Số điện thoại nhận mẫu"
                                                     placeholder="Số điện thoại"
                                                     value={phone}
                                                     onChange={event => setPhone(event.target.value)}/><Input
        required maxLength={2000} aria-label="Địa chỉ nhận mẫu" placeholder="Địa chỉ nhận hàng" value={address}
        onChange={event => setAddress(event.target.value)} className="col-span-2"/><p
        className="col-span-2 text-xs text-[#7D715E]">Chỉ bạn và shop được xem địa chỉ. Xin hàng mẫu không thay
        đổi hoa hồng.</p></>}
      <Button type="submit" size="sm" loading={pending} disabled={!productId}>Gửi đề xuất</Button><Button
      size="sm" variant="ghost" disabled={pending} onClick={() => setMode('')}>Đóng</Button>
    </form>}
    {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
  </div>;
}
