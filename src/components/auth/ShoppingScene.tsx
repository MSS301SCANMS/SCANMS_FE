import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ShoppingSceneController } from './shopping-scene';

// Three.js objects live outside React: recreate them when their module changes.
const sceneUpdatedEvent = 'scanms:shopping-scene-updated';
if (import.meta.hot) {
  import.meta.hot.accept('./shopping-scene', () => {
    window.dispatchEvent(new Event(sceneUpdatedEvent));
  });
}

/** The renderer is loaded separately so the login form is usable immediately. */
export const ShoppingScene = memo(function ShoppingScene({ quiet = false }: { quiet?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<ShoppingSceneController | null>(null);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const stopped = reduced || quiet;
  const stoppedRef = useRef(stopped);
  stoppedRef.current = stopped;

  useEffect(() => {
    const refresh = () => setSceneVersion(version => version + 1);
    window.addEventListener(sceneUpdatedEvent, refresh);
    return () => window.removeEventListener(sceneUpdatedEvent, refresh);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    // Wait until the illustration is near the viewport, including on mobile.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      import('./shopping-scene').then(({ createShoppingScene }) => {
        if (cancelled) return;
        controller.current = createShoppingScene(element, () => setStatus('fallback'));
        controller.current.setPaused(stoppedRef.current);
        setStatus('ready');
      }).catch(() => { if (!cancelled) setStatus('fallback'); });
    }, { rootMargin: '100px' });
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
      controller.current?.dispose();
      controller.current = null;
    };
  }, [sceneVersion]);

  useEffect(() => { controller.current?.setPaused(stopped); }, [stopped]);

  return (
    <div className="login-shopping-scene" data-scene-state={status} data-motion-paused={stopped}>
      <div className="login-upper-glints" aria-hidden="true">
        {[[12, 60], [38, 22], [72, 45], [88, 8], [52, 85], [20, 5]].map(([x, y], i) => (
          <span key={i} style={{ '--glint-x': `${x}%`, '--glint-y': `${y}%`, '--glint-delay': `${-i * 1.1}s` } as CSSProperties} />
        ))}
      </div>
      <div className="login-upper-bubbles" aria-hidden="true">
        {[
          [5, 8, 11, -2], [11, 13, 12, -8], [17, 6, 9, -5],
          [23, 17, 13, -4], [29, 10, 10, -8], [35, 8, 12, -1],
          [40, 14, 14, -10], [46, 7, 10, -4], [51, 19, 13, -7],
          [57, 10, 11, -2], [62, 8, 9, -7], [67, 15, 14, -5],
          [73, 6, 10, -1], [78, 20, 13, -10], [83, 11, 12, -6],
          [88, 7, 9, -3], [93, 13, 11, -9], [97, 9, 12, -4],
        ].map(([x, size, duration, delay], i) => (
          <span key={i} style={{
            '--bubble-x': `${x}%`, '--bubble-size': `${size}px`,
            '--bubble-duration': `${duration}s`, '--bubble-delay': `${delay}s`,
            '--bubble-sway': `${(i % 2 ? -1 : 1) * (8 + i % 4 * 3)}px`,
            '--bubble-rise': `${220 + i % 4 * 10}px`,
          } as CSSProperties} />
        ))}
      </div>
      <div className="login-scene-fallback" aria-hidden="true" />
      <div ref={host} className="login-scene-canvas" aria-hidden="true" />
      {status === 'ready' && <div className="login-gift-keyboard" role="group" aria-label="Điều khiển túi mua sắm và hộp quà">
        <button type="button" onClick={() => controller.current?.toggleBag(0)}>Xem hoặc cất sản phẩm trong túi vàng</button>
        <button type="button" onClick={() => controller.current?.toggleBag(1)}>Xem hoặc cất sản phẩm trong túi trắng</button>
        <button type="button" onClick={() => controller.current?.toggleGift()}>Mở hoặc đóng hộp quà</button>
        {['Sản phẩm bên trái', 'Sản phẩm bên phải', 'Sản phẩm ở giữa'].map((name, i) => <button type="button" key={name} onClick={() => controller.current?.toggleProduct(i)}>{name}: đưa lên hoặc cất vào hộp</button>)}
      </div>}
    </div>
  );
});
