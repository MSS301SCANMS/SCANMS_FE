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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentityScript()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        // Spring verifies a signed ID token; the OAuth token client returns an access token.
        const rendered = renderGoogleButton(container, onSuccess, onError, {
          text,
          width: container.clientWidth,
        });
        setIsLoading(false);
        if (!rendered) onError?.('Không thể hiển thị nút đăng nhập Google. Vui lòng tải lại trang.');
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
        onError?.('Không tải được Google Identity. Hãy kiểm tra mạng rồi tải lại trang.');
      });
    return () => { cancelled = true; };
  }, [onSuccess, onError, text]);

  return (
    <div className={`relative flex w-full items-center justify-center ${className}`} aria-busy={isLoading}>
      <div ref={containerRef} className="google-official-button-target flex w-full justify-center" />
      {isLoading && <span role="status" className="absolute text-xs text-[#7D715E]">Đang tải Google...</span>}
    </div>
  );
};
