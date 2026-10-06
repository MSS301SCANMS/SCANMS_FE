import React, { useEffect, useState } from 'react';
import { requestGoogleAccessToken, loadGoogleIdentityScript } from '../../utils/googleAuth';

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGoogleIdentityScript().catch(() => undefined);
  }, []);

  const handleGoogleClick = () => {
    setIsLoading(true);
    requestGoogleAccessToken(
      (token) => {
        onSuccess(token);
        setIsLoading(false);
      },
      (message) => {
        onError?.(message);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );
  };

  const label = text === 'signup_with'
    ? 'Đăng ký bằng Google'
    : text === 'continue_with'
      ? 'Tiếp tục với Google'
      : 'Đăng nhập bằng Google';

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] text-[#1A1612] font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-[#C59B58] border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      )}
      <span>{isLoading ? 'Đang kết nối...' : label}</span>
    </button>
  );
};
