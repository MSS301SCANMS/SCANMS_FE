import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { GuestCheckoutModal } from '../../components/checkout/GuestCheckoutModal';
import { useCart } from '../../context/CartContext';
import { useAuthUser } from '../../hooks/useAuthUser';
import { getLivePurchase } from '../../services/live-purchase-access';
import { canAccessShopping, shoppingHomeForRole } from '../../utils/shopping-access';
import { checkoutDraftKey, liveCheckoutOrigin, readCheckoutDraft } from '../../utils/checkout-page.utils';

export default function CustomerCheckoutPage() {
  const user = useAuthUser(),
    location = useLocation(),
    navigate = useNavigate();
  const { checkoutItems, checkoutCouponCode, isCheckoutOpen, startCheckout, closeCheckout, returnFromCheckout } =
    useCart();
  const userId = user?.id || '';
  const recovered = useMemo(() => (userId ? readCheckoutDraft(userId) : null), [userId]);
  const restored = useRef('');
  const returnTo = liveCheckoutOrigin(location.state?.liveCheckoutFrom) || recovered?.returnTo || '/marketplace';
  const [proofState, setProofState] = useState({ key: '', ready: false });
  const liveKey = [...new Set(checkoutItems.map((item) => item.liveSessionId).filter(Boolean))].join('|');
  const proofKey = `${userId}|${liveKey}`;
  const proofReady = !liveKey || (proofState.key === proofKey && proofState.ready);

  useEffect(() => {
    if (!userId || !canAccessShopping() || checkoutItems.length || !recovered || restored.current === userId) return;
    restored.current = userId;
    startCheckout(recovered.items, recovered.couponCode, 'page');
  }, [userId, recovered, checkoutItems.length, startCheckout]);
  useEffect(() => {
    if (!userId || !checkoutItems.length || !isCheckoutOpen || !canAccessShopping()) return;
    try {
      sessionStorage.setItem(
        checkoutDraftKey(userId),
        JSON.stringify({
          userId,
          items: checkoutItems,
          couponCode: checkoutCouponCode || '',
          returnTo,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* Checkout remains usable without draft recovery. */
    }
  }, [userId, checkoutItems, checkoutCouponCode, isCheckoutOpen, returnTo]);
  useEffect(() => {
    const check = () =>
      setProofState((previous) => {
        if (previous.key === proofKey && previous.ready) return previous;
        const ready = !liveKey || liveKey.split('|').every((id) => Boolean(getLivePurchase(id)));
        return previous.key === proofKey && previous.ready === ready ? previous : { key: proofKey, ready };
      });
    check();
    const timer = window.setInterval(check, 250);
    return () => window.clearInterval(timer);
  }, [liveKey, proofKey]);

  const leave = (back: boolean) => {
    if (userId) sessionStorage.removeItem(checkoutDraftKey(userId));
    if (back) returnFromCheckout();
    else closeCheckout();
    navigate(returnTo, { replace: true });
  };
  if (!canAccessShopping()) return <Navigate to={shoppingHomeForRole()} replace />;
  if (!user || !localStorage.getItem('token')) return <Navigate to="/login?redirect=%2Fcheckout" replace />;
  if (!checkoutItems.length && !recovered)
    return (
      <main className="grid min-h-screen place-content-center gap-4 bg-[#FAF8F5] p-6 text-center text-[#1A1612]">
        <h1 className="text-xl font-bold">Chưa có sản phẩm để thanh toán</h1>
        <Link to={returnTo} className="text-[#9B7137] underline">
          Quay lại chọn sản phẩm
        </Link>
      </main>
    );
  if (!checkoutItems.length || !proofReady)
    return (
      <main className="grid min-h-screen place-content-center gap-4 bg-[#FAF8F5] p-6 text-center text-[#1A1612]">
        <Loader2 size={28} className="mx-auto animate-spin text-[#C59B58]" />
        <h1 className="text-lg font-semibold">Đang mở trang thanh toán</h1>
        <p className="max-w-md text-sm text-[#7D715E]">
          Đang kết nối lại phiên live để xác minh giá và ưu đãi của bạn.
        </p>
        <button
          type="button"
          onClick={() => leave(true)}
          className="flex items-center justify-center gap-2 text-sm text-[#9B7137]"
        >
          <ArrowLeft size={16} />
          Quay lại phiên live
        </button>
      </main>
    );
  return (
    <GuestCheckoutModal
      isOpen
      navigationMode="page"
      onClose={() => leave(false)}
      onBack={() => leave(true)}
      checkoutItems={checkoutItems}
      initialCouponCode={checkoutCouponCode}
    />
  );
}
