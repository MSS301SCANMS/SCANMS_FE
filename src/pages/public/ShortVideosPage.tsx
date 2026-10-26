import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, ShoppingBag, Video, Play, Pause } from 'lucide-react';
import { shortVideoService, type ShortVideo, type ShortVideoProduct } from '../../services/short-video.service';
import './ShortVideosPage.css';
function VideoCard({ video }: {
    video: ShortVideo;
}) {
    const ref = useRef<HTMLVideoElement>(null), navigate = useNavigate();
    const [muted, setMuted] = useState(true), [playing, setPlaying] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    useEffect(() => { const element = ref.current; if (!element)
        return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting)
        element.play().catch(() => setPlaying(false));
    else
        element.pause(); }, { threshold: .65 }); observer.observe(element); const visibility = () => { if (document.hidden)
        element.pause(); }; document.addEventListener('visibilitychange', visibility); return () => { observer.disconnect(); element.pause(); document.removeEventListener('visibilitychange', visibility); }; }, []);
    async function buy(product: ShortVideoProduct) { setBusy(true); setError(''); try {
        await shortVideoService.click(product.productId, product.referralLinkId, video.id);
        navigate(`/products/${encodeURIComponent(product.productId)}`);
    }
    catch (e: any) {
        setError(e.message || 'Chưa mở được sản phẩm.');
    }
    finally {
        setBusy(false);
    } }
    return <article className="short-card" aria-label={video.title}><video ref={ref} src={video.videoUrl} poster={video.posterUrl || undefined} muted={muted} playsInline loop preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setError('Video chưa tải được. Hãy thử tải lại trang.')}/>
    <div className="short-controls"><button aria-label={playing ? 'Tạm dừng' : 'Phát video'} onClick={() => playing ? ref.current?.pause() : ref.current?.play().catch(() => setError('Chưa phát được video.'))}>{playing ? <Pause /> : <Play />}</button><button aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} onClick={() => setMuted(!muted)}>{muted ? <VolumeX /> : <Volume2 />}</button></div>
    <div className="short-overlay"><span className="short-ad-label">Tiếp thị liên kết · KOL có thể nhận hoa hồng</span><h2>@{video.creatorName}</h2><h3>{video.title}</h3>{video.caption && <p className="short-caption">{video.caption}</p>}<div className="short-products" aria-label="Sản phẩm trong video">{video.products.map(p => <button key={p.productId} disabled={busy} onClick={() => buy(p)}>{p.imageUrl ? <img src={p.imageUrl} alt=""/> : <ShoppingBag />}<span><strong>{p.name}</strong><b>{p.priceVnd.toLocaleString('vi-VN')} ₫</b></span><span className="short-buy">Xem sản phẩm</span></button>)}</div>{error && <p role="alert" className="short-error">{error}</p>}</div>
  </article>;
}
export default function ShortVideosPage() {
    const [videos, setVideos] = useState<ShortVideo[]>([]), [next, setNext] = useState<number | null>(0), [loading, setLoading] = useState(false), [error, setError] = useState('');
    const loadingRef = useRef(false);
    async function load(page: number) { if (loadingRef.current)
        return; loadingRef.current = true; setLoading(true); setError(''); try {
        const result = await shortVideoService.feed(page);
        setVideos(old => page === 0 ? result.items : [...old, ...result.items.filter(v => !old.some(x => x.id === v.id))]);
        setNext(result.nextPage);
    }
    catch (e: any) {
        setError(e.message || 'Chưa tải được video.');
    }
    finally {
        loadingRef.current = false;
        setLoading(false);
    } }
    useEffect(() => { void load(0); }, []);
    return <div className="short-page"><header><Link to="/"><ArrowLeft size={20}/>Sàn mua sắm</Link><h1><Video />Video cùng KOC</h1><Link to="/collaborator/short-videos">Đăng video</Link></header><main className="short-feed">{videos.map(v => <VideoCard key={v.id} video={v}/>)}{!loading && !error && !videos.length && <div className="short-empty"><Video size={44}/><h2>Chưa có video nào</h2><p>Khám phá sản phẩm qua video từ các KOL/KOC của SCANMS.</p><Link to="/">Tiếp tục mua sắm</Link></div>}{error && <div className="short-empty" role="alert"><p>{error}</p><button onClick={() => load(next ?? 0)}>Thử lại</button></div>}{loading && <p className="short-loading" role="status">Đang tải video…</p>}{!loading && !error && next !== null && <button className="short-more" onClick={() => load(next)}>Xem thêm video</button>}</main></div>;
}
