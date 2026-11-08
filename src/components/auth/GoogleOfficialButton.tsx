import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleIdentityScript, renderGoogleButton } from '@/utils/google-auth.utils';
import './GoogleOfficialButton.css';

interface GoogleOfficialButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (errMsg: string) => void;
  className?: string;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export const GoogleOfficialButton: React.FC<GoogleOfficialButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  text = 'signin_with',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const successHandler = useRef(onSuccess);
  const errorHandler = useRef(onError);
  successHandler.current = onSuccess;
  errorHandler.current = onError;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    let resizeFrame = 0;
    loadGoogleIdentityScript()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        // Spring verifies a signed ID token; the OAuth token client returns an access token.
        let previousWidth = 0;
        const render = () => {
          if (cancelled) return;
          const width = Math.min(400, Math.floor(container.clientWidth));
          if (width <= 0 || width === previousWidth) return;
          previousWidth = width;
          const rendered = renderGoogleButton(container, token => successHandler.current(token), message => errorHandler.current?.(message), {
            text,
            width,
          });
          setIsLoading(false);
          if (!rendered) errorHandler.current?.('Không thể hiển thị nút đăng nhập Google. Vui lòng tải lại trang.');
        };
        render();
        resizeObserver = new ResizeObserver(() => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(render);
        });
        resizeObserver.observe(container);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
        errorHandler.current?.('Không tải được Google Identity. Hãy kiểm tra mạng rồi tải lại trang.');
      });
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
    };
  }, [text]);

  return (
    <div className={`relative flex w-full items-center justify-center ${className}`} aria-busy={isLoading}>
      <div ref={containerRef} className="google-official-button-target flex w-full justify-center" />
      {isLoading && <span role="status" className="absolute text-xs text-[#7D715E]">Đang tải Google...</span>}
    </div>
  );
};
