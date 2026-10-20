import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleIdentityScript, renderGoogleButton } from '@/utils/google-auth.utils';

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
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const ok = renderGoogleButton(containerRef.current, onSuccess, onError, {
          text,
          width: containerRef.current.offsetWidth || 280,
        });
        if (cancelled) return;
        if (ok) {
          setReady(true);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (failed) {
    return (
      <button
        type="button"
        disabled
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-[#EAE4D7] text-[#9E917F] font-bold text-xs rounded-xl opacity-60 cursor-not-allowed ${className}`}
      >
        <span>Không tải được Google Sign-In</span>
      </button>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {!ready && (
        <div className="absolute inset-0 w-full h-full min-h-[40px] rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] animate-pulse flex items-center justify-center text-[11px] font-medium text-[#9E917F]">
          Đang tải Google Sign-In...
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full flex items-center justify-center [&>div]:w-full ${ready ? '' : 'invisible'}`}
      />
    </div>
  );
};

