import { memo, useEffect, useRef, useState } from 'react';
import { ShoppingBag, Store } from 'lucide-react';
import type { RegisterMarketController } from './register-market-scene';

export const RegisterMarketScene = memo(function RegisterMarketScene({ images }: { images: readonly string[] }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<RegisterMarketController | null>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChanged = () => controller.current?.setReducedMotion(media.matches);
    media.addEventListener('change', motionChanged);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void import('./register-market-scene').then(({ createRegisterMarket }) => {
        if (cancelled) return;
        controller.current = createRegisterMarket(element, () => setStatus('fallback'));
        controller.current.setProducts(imagesRef.current);
        motionChanged(); setStatus('ready');
      }).catch(() => { if (!cancelled) setStatus('fallback'); });
    }, { rootMargin: '100px' });
    observer.observe(element);
    return () => { cancelled = true; observer.disconnect(); media.removeEventListener('change', motionChanged); controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setProducts(images); }, [images]);
  return (
    <div className="register-market-scene" data-scene-state={status} aria-hidden="true">
      <div className="register-market-fallback">
        <div className="register-fallback-store"><Store size={74} strokeWidth={1} /><strong>ScanMS</strong></div>
        {images[0] && <img src={images[0]} alt="" width="70" height="70" />}
        <ShoppingBag size={40} strokeWidth={1.25} />
      </div>
      <div className="register-market-canvas" ref={host} />
    </div>
  );
});
