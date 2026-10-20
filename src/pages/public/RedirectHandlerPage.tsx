import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function RedirectHandlerPage() {
  const { shortCode } = useParams<{ shortCode: string }>();

  useEffect(() => {
    if (shortCode) {


      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const backendBaseUrl = rawApiUrl.replace(/\/api\/?$/, '');
      const search = window.location.search || '';
      window.location.replace(`${backendBaseUrl}/r/${encodeURIComponent(shortCode)}${search}`);
    }
  }, [shortCode]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-base font-bold text-slate-800 mb-1">Đang chuyển hướng...</h2>
        <p className="text-xs text-slate-500">Hệ thống đang chuyển bạn đến trang sản phẩm chính hãng.</p>
      </div>
    </div>
  );
}
