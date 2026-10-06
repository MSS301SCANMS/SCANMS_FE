import { useLocation } from 'react-router-dom';
import { Toaster as SonnerToaster } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

function useIsLiveRoom() {
  try {
    const location = useLocation();
    return location.pathname.startsWith('/live');
  } catch {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/live');
  }
}

export function Toaster({ position }: ToasterProps) {
  const isLive = useIsLiveRoom();

  // Trên phiên Live: Đặt thông báo ở top-center (dưới header), không đè nút Camera & Số liệu bên góc phải
  const effectivePosition = position || (isLive ? 'top-center' : 'top-right');
  const effectiveOffset = isLive ? 66 : 20;

  return (
    <SonnerToaster
      position={effectivePosition}
      duration={2200}
      visibleToasts={2}
      closeButton={false}
      offset={effectiveOffset}
      gap={6}
      icons={{
        success: (
          <div className="w-5 h-5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
          </div>
        ),
        error: (
          <div className="w-5 h-5 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center shrink-0">
            <AlertCircle className="w-3 h-3 text-[#DC2626]" />
          </div>
        ),
        warning: (
          <div className="w-5 h-5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3 h-3 text-[#D97706]" />
          </div>
        ),
        info: (
          <div className="w-5 h-5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0">
            <Info className="w-3 h-3 text-[#B88E4F]" />
          </div>
        ),
        loading: (
          <div className="w-5 h-5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0">
            <Loader2 className="w-3 h-3 text-[#C59B58] animate-spin" />
          </div>
        ),
      }}
      toastOptions={{
        unstyled: false,
      }}
    />
  );
}

export default Toaster;
