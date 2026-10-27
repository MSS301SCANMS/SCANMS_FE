import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, CheckCircle2, Eye, EyeOff, Film, Loader2, Package, Send, Store, UploadCloud, X } from 'lucide-react';
import { formatMoney, getSafeProductImageUrl } from '../../utils/marketplace.utils';
import './ShortVideoStudioPage.css';
import { shortVideoService, type ShortVideo } from '../../services/short-video.service';
import { referralLinksService, type EligibleProduct } from '../../services/referral-links.service';
import { partnershipInvitationsService } from '../../services/partnership-invitations.service';
export default function ShortVideoStudioPage() {
    const [videos, setVideos] = useState<ShortVideo[]>([]), [products, setProducts] = useState<EligibleProduct[]>([]), [selected, setSelected] = useState<string[]>([]);
    const [title, setTitle] = useState(''), [caption, setCaption] = useState(''), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState('');
    const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(''), [message, setMessage] = useState('');
    const asset = useRef<{
        file: File;
        publicId: string;
    } | null>(null), referralIds = useRef(new Map<string, string>());
    async function load() { setLoading(true); setError(''); try {
        const [mine, all, invites] = await Promise.all([shortVideoService.mine(), referralLinksService.getEligibleProducts({ limit: 200 }), partnershipInvitationsService.list('kol')]);
        const stores = new Set(invites.filter(i => i.status === 'ACCEPTED').map(i => i.storeId));
        setVideos(mine.items);
        setProducts(all.filter(p => stores.has(p.store.id)));
    }
    catch (e: any) {
        setError(e.message || 'Chưa tải được không gian video.');
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { void load(); }, []);
    useEffect(() => { if (!file) {
        setPreview('');
        return;
    } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
    const fileInput = useRef<HTMLInputElement>(null);
    const chosenStore = products.find(p => selected.includes(p.id))?.store.id;
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !selected.length || busy)
            return;
        setBusy(true);
        setError('');
        setMessage('Đang tải video và xác minh sản phẩm…');
        try {
            if (asset.current?.file !== file) {
                const uploaded = await shortVideoService.upload(file);
                asset.current = { file, publicId: uploaded.publicId };
            }
            const links = [];
            for (const id of selected) {
                let linkId = referralIds.current.get(id);
                if (!linkId) {
                    const link = await referralLinksService.createLink({ productId: id, label: 'Video ngắn SCANMS', channel: 'SHORT_VIDEO' });
                    linkId = link.id;
                    referralIds.current.set(id, linkId);
                }
                links.push({ productId: id, referralLinkId: linkId });
            }
            const saved = await shortVideoService.create({ title, caption, publicId: asset.current!.publicId, products: links });
            setVideos(old => [saved, ...old]);
            setTitle('');
            setCaption('');
            setFile(null);
            setSelected([]);
            asset.current = null;
            referralIds.current.clear();
            setMessage('Video đã được đăng công khai.');
        }
        catch (e: any) {
            setMessage('');
            setError(e.message || 'Chưa đăng được video. Nội dung được giữ lại để bạn thử lại.');
        }
        finally {
            setBusy(false);
        }
    }
    function chooseFile(chosen?: File) {
        if (!chosen) return;
        if (chosen.size > 100 * 1024 * 1024 || !['video/mp4', 'video/webm', 'video/quicktime'].includes(chosen.type)) {
            setError('Chọn video MP4, WebM hoặc MOV tối đa 100 MB.');
            return;
        }
        setError(''); setMessage(''); setFile(chosen);
    }
    async function hideVideo(id: string) {
        if (busy) return;
        setBusy(true); setError('');
        try {
            await shortVideoService.hide(id);
            setVideos(old => old.map(video => video.id === id ? { ...video, status: 'HIDDEN' } : video));
            setMessage('Đã ẩn video khỏi trang video công khai.');
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa ẩn được video.'); }
        finally { setBusy(false); }
    }
    return <div className="short-studio">
      {error && <div role="alert" className="short-studio-notice error"><AlertCircle size={18} /><span>{error}</span><button type="button" disabled={busy || loading} onClick={() => void load()}>Tải lại</button></div>}
      {message && <div role="status" className="short-studio-notice success">{busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}<span>{message}</span></div>}
      <form id="short-video-form" onSubmit={submit} className="short-studio-panel">
        <div className="short-studio-compose">
          <div className="short-studio-upload-column">
            <input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime" disabled={busy} className="short-studio-file-input" aria-label="Chọn video từ máy" onChange={event => { chooseFile(event.target.files?.[0]); event.target.value = ''; }} />
            {preview ? <div className="short-studio-preview"><video controls preload="metadata" src={preview} aria-label="Xem trước video đã chọn" /></div> : <button type="button" className="short-studio-upload" disabled={busy} onClick={() => fileInput.current?.click()}><span><UploadCloud size={29} /></span><strong>Tải video của bạn</strong><small>MP4, WebM hoặc MOV</small><small>Tối đa 100 MB · 3 phút</small><b>Chọn video</b></button>}
            {file && <div className="short-studio-file"><Film size={18} /><div><strong title={file.name}>{file.name}</strong><small>{(file.size / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB</small></div><button type="button" disabled={busy} aria-label="Xóa video đã chọn" onClick={() => { setFile(null); asset.current = null; }}><X size={17} /></button></div>}
            {file && <button type="button" className="short-studio-button short-studio-replace" disabled={busy} onClick={() => fileInput.current?.click()}><UploadCloud size={15} />Đổi video</button>}
          </div>
          <div className="short-studio-fields">
            <label className="short-studio-field"><span>Tiêu đề <em>*</em></span><input required maxLength={180} value={title} onChange={event => setTitle(event.target.value)} disabled={busy} placeholder="Đặt tiêu đề cho video của bạn" /><small>{title.length}/180 ký tự</small></label>
            <label className="short-studio-field"><span>Mô tả <small>(tùy chọn)</small></span><textarea rows={4} maxLength={2000} value={caption} onChange={event => setCaption(event.target.value)} disabled={busy} placeholder="Chia sẻ cảm nhận, cách sử dụng hoặc điểm nổi bật của sản phẩm…" /><small>{caption.length.toLocaleString('vi-VN')}/2.000 ký tự</small></label>
          </div>
        </div>
        <fieldset className="short-studio-products" disabled={busy || loading}>
          <legend>Gắn sản phẩm <span>{selected.length}/5</span></legend>
          <p>Chọn tối đa 5 sản phẩm cùng một shop.</p>
          {loading ? <div className="short-studio-empty" role="status"><Loader2 size={23} className="animate-spin" /><span>Đang tải sản phẩm…</span></div> : !products.length ? <div className="short-studio-empty"><Package size={26} /><strong>Chưa có sản phẩm để gắn</strong><Link to="/collaborator/marketing?tab=invitations">Xem lời mời hợp tác<ArrowUpRight size={14} /></Link></div> : <div className="short-studio-product-grid">{products.map(product => {
            const checked = selected.includes(product.id);
            const disabled = !checked && (selected.length >= 5 || Boolean(chosenStore && chosenStore !== product.store.id));
            return <label key={product.id} className={`short-studio-product${checked ? ' selected' : ''}${disabled ? ' unavailable' : ''}`}>
              <input type="checkbox" checked={checked} disabled={disabled} onChange={event => setSelected(old => event.target.checked ? [...old, product.id] : old.filter(id => id !== product.id))} />
              <img src={getSafeProductImageUrl(product.imageUrl, product.title)} alt={product.title} onError={event => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = getSafeProductImageUrl(null, product.title); } }} />
              <span className="short-studio-product-info"><strong>{product.title}</strong><small><Store size={12} />{product.store.name}</small><b>{formatMoney(product.price)}</b></span>
            </label>;
          })}</div>}
        </fieldset>
        <footer className="short-studio-submit"><span>{!file ? 'Chọn video để bắt đầu.' : !selected.length ? 'Chọn ít nhất một sản phẩm để đăng.' : !title.trim() ? 'Thêm tiêu đề cho video.' : `Đã gắn ${selected.length} sản phẩm, sẵn sàng đăng.`}</span><button type="submit" disabled={busy || loading || !file || !selected.length || !title.trim()} className="short-studio-button primary">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{busy ? 'Đang đăng video…' : 'Đăng video'}</button></footer>
      </form>
      <section className="short-studio-panel short-studio-library" aria-label="Video đã đăng">
        <div className="short-studio-section-head"><div><h2>Video đã đăng <span className="short-studio-count">{videos.length}</span></h2><p>Quản lý video và sản phẩm đã giới thiệu.</p></div></div>
        {loading ? <div role="status" className="short-studio-empty"><Loader2 size={24} className="animate-spin" /><span>Đang tải video…</span></div> : !videos.length ? <div className="short-studio-empty"><Film size={30} /><strong>Bạn chưa đăng video nào</strong><span>Video đầu tiên sẽ xuất hiện tại đây sau khi đăng.</span></div> : <div className="short-studio-video-list">{videos.map(video => <article key={video.id} className="short-studio-video">
          <video controls preload="metadata" src={video.videoUrl} poster={video.posterUrl || undefined} aria-label={video.title} />
          <div className="short-studio-video-info"><span className={`short-studio-tag ${video.status === 'PUBLISHED' ? 'published' : ''}`}>{video.status === 'PUBLISHED' ? <Eye size={13} /> : <EyeOff size={13} />}{video.status === 'PUBLISHED' ? 'Đang công khai' : 'Đã ẩn'}</span><h3>{video.title}</h3>{video.caption && <p>{video.caption}</p>}<div className="short-studio-video-products">{video.products.map(product => <span key={product.productId}><Package size={13} />{product.name}</span>)}</div></div>
          {video.status === 'PUBLISHED' && <button type="button" disabled={busy} className="short-studio-button" onClick={() => void hideVideo(video.id)}><EyeOff size={15} />Ẩn video</button>}
        </article>)}</div>}
      </section>
    </div>;
}
