import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';

export function CheckoutPaymentQr({ qrCode, recoveryUrl }: { qrCode?: string; recoveryUrl: string }) {
  const [image, setImage] = useState<{ code: string; url: string } | null>(null);
  const [failedCode, setFailedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!qrCode) return;
    let active = true;
    QRCode.toDataURL(qrCode, { width: 320, margin: 2 })
      .then(url => { if (active) setImage({ code: qrCode, url }); })
      .catch(() => { if (active) setFailedCode(qrCode); });
    return () => { active = false; };
  }, [qrCode]);

  if (!qrCode || failedCode === qrCode) {
    return <div className="mb-3 text-sm">
      <p role="alert">Chưa hiển thị được mã QR thanh toán.</p>
      <Link className="text-[#A77C37] underline" to={recoveryUrl}>Kiểm tra và khôi phục thanh toán</Link>
    </div>;
  }

  return <div className="mb-3 text-center">
    {image?.code === qrCode
      ? <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl border border-[#EAE4D7] shadow-inner">
        <img src={image.url} alt="Mã QR thanh toán PayOS" className="w-full h-full object-contain" />
      </div>
      : <p role="status">Đang tạo mã QR thanh toán…</p>}
    <p className="mt-3 text-xs text-[#7D715E]">Mở ứng dụng ngân hàng để quét mã. ScanMS sẽ tự cập nhật khi thanh toán được xác nhận.</p>
  </div>;
}
