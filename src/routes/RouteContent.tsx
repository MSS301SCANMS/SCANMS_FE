import { useEffect, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';



export function RouteContent({ children }: { children?: ReactNode }) {
  useEffect(() => {
    if (window.parent === window) return;

    const sendHeight = () => {
      const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, 450);
      window.parent.postMessage({ type: 'SCANMS_IFRAME_RESIZE', height }, window.location.origin);
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return children ?? <Outlet />;
}
