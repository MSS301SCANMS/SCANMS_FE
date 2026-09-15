import { Toaster as SonnerToaster } from 'sonner';

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

export function Toaster({ position = 'top-right' }: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'inherit',
          borderRadius: '0.75rem',
          border: '1px solid #EAE4D7',
          background: '#FFFFFF',
          color: '#1A1612',
          boxShadow: '0 4px 12px rgba(26, 22, 18, 0.08)',
        },
      }}
    />
  );
}

export default Toaster;
