import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    return <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8 text-[#28231c]">
    <div className="flex justify-between gap-4"><div><h1 className="text-2xl font-bold">Video ngắn của tôi</h1><p className="mt-2 text-sm text-[#7D715E]">Giới thiệu sản phẩm từ shop đã hợp tác. KOL được duyệt có thể đăng ngay.</p></div><Link to="/shorts" className="text-[#956b2c]">Xem trang video</Link></div>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error} <button type="button" onClick={load} className="underline">Tải lại dữ liệu</button></div>}
    <form id="short-video-form" onSubmit={submit} className="space-y-5 rounded-2xl border border-[#EAE4D7] bg-white p-6">
      <h2 className="text-lg font-bold">Đăng video mới</h2>
      <label className="block">Tiêu đề<input required maxLength={180} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border p-3"/></label>
      <label className="block">Mô tả<textarea maxLength={2000} value={caption} onChange={e => setCaption(e.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border p-3"/></label>
      <label className="block">Video (MP4, WebM, MOV · tối đa 100 MB, 3 phút)<input key={file?.name || 'empty'} type="file" accept="video/mp4,video/webm,video/quicktime" disabled={busy} className="mt-2 block w-full rounded-xl border p-3" onChange={e => { const chosen = e.target.files?.[0]; if (!chosen)
        return; if (chosen.size > 100 * 1024 * 1024 || !['video/mp4', 'video/webm', 'video/quicktime'].includes(chosen.type)) {
        setError('Chọn video MP4, WebM hoặc MOV tối đa 100 MB.');
        return;
    } setError(''); setFile(chosen); }}/></label>
      {preview && <video controls src={preview} className="mx-auto max-h-80 rounded-xl bg-black"/>}
      <fieldset disabled={busy || loading}><legend className="font-semibold">Gắn sản phẩm ({selected.length}/5)</legend><p className="my-2 text-sm text-[#7D715E]">Chọn tối đa 5 sản phẩm cùng một shop. Người xem bấm sản phẩm để mua và ghi nhận giới thiệu.</p>
        {loading ? <p>Đang tải sản phẩm…</p> : !products.length ? <p className="rounded-xl bg-amber-50 p-4">Chưa có sản phẩm từ shop hợp tác. <Link to="/collaborator/marketing" className="underline">Kiểm tra lời mời hợp tác</Link></p> : <div className="max-h-72 overflow-auto rounded-xl border">{products.map(p => <label key={p.id} className="flex items-center gap-3 border-b p-3 last:border-0"><input type="checkbox" checked={selected.includes(p.id)} disabled={!selected.includes(p.id) && (selected.length >= 5 || !!chosenStore && chosenStore !== p.store.id)} onChange={e => setSelected(old => e.target.checked ? [...old, p.id] : old.filter(id => id !== p.id))}/><span className="flex-1"><b>{p.title}</b><small className="block text-[#7D715E]">{p.store.name} · {Number(p.price).toLocaleString('vi-VN')} ₫</small></span></label>)}</div>}
      </fieldset>
      <p className="rounded-xl bg-[#FBF5EB] p-4 text-sm">Hoa hồng theo tỷ lệ shop cấu hình, tính trên tiền hàng sau giảm giá và hoàn tiền, không gồm phí ship. Lượt bấm sản phẩm có hiệu lực 24 giờ. Tiền chỉ được đối soát khi đơn đủ điều kiện sau thời hạn đổi trả.</p>
      {message && <p role="status">{message}</p>}<button disabled={busy || loading || !file || !selected.length || !title.trim()} className="rounded-xl bg-[#B88E4F] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang đăng video…' : 'Đăng video'}</button>
    </form>
    <section className="space-y-4"><h2 className="text-xl font-bold">Video đã đăng</h2>{!loading && !videos.length && <p>Bạn chưa đăng video nào.</p>}{videos.map(v => <article key={v.id} className="flex gap-4 rounded-2xl border bg-white p-4"><video controls preload="metadata" src={v.videoUrl} poster={v.posterUrl || undefined} className="h-40 w-28 rounded-xl bg-black object-contain"/><div className="flex-1"><h3 className="font-bold">{v.title}</h3><p className="my-2 text-sm">{v.products.map(p => p.name).join(' · ')}</p><p>{v.status === 'PUBLISHED' ? 'Đang công khai' : 'Đã ẩn'}</p>{v.status === 'PUBLISHED' && <button disabled={busy} className="mt-3 text-sm text-red-600 underline" onClick={async () => { setBusy(true); try {
        await shortVideoService.hide(v.id);
        setVideos(old => old.map(x => x.id === v.id ? { ...x, status: 'HIDDEN' } : x));
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }}>Ẩn video</button>}</div></article>)}</section>
  </div>;
}
