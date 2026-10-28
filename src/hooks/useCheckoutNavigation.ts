import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { CHECKOUT_HISTORY_KEY, checkoutNavigationState } from '../utils/checkout-navigation';

export function useCheckoutNavigation(isOpen: boolean, onClose: () => void, onBack = onClose) {
  const location = useLocation();
  const navigate = useNavigate();
  const action = useNavigationType();
  const callbacks = useRef({ onClose, onBack });
  callbacks.current = { onClose, onBack };
  const entry = useRef<{ token: string; originKey: string; observed: boolean } | null>(null);
  const closing = useRef(false);
  const backRequested = useRef(false);

  useEffect(() => {
    if (!isOpen) { entry.current = null; closing.current = false; backRequested.current = false; return; }
    if (closing.current) return;
    const marker = location.state?.[CHECKOUT_HISTORY_KEY];
    if (!entry.current) {
      if (typeof marker === 'string') {
        entry.current = { token: marker, originKey: '', observed: true };
      } else {
        const state = checkoutNavigationState(location.state);
        entry.current = { token: state[CHECKOUT_HISTORY_KEY] as string, originKey: location.key, observed: false };
        navigate(location.pathname + location.search + location.hash, { state, preventScrollReset: true });
      }
      return;
    }
    if (marker === entry.current.token) { entry.current.observed = true; return; }
    // StrictMode can repeat the opening effect before Router renders its new entry.
    if (!entry.current.observed && location.key === entry.current.originKey) return;
    closing.current = true;
    entry.current = null;
    if (action === 'POP') callbacks.current.onBack();
    else callbacks.current.onClose();
  }, [isOpen, location, action, navigate]);

  const close = useCallback(() => {
    closing.current = true;
    entry.current = null;
    if (location.state?.[CHECKOUT_HISTORY_KEY]) {
      const state = { ...location.state };
      delete state[CHECKOUT_HISTORY_KEY];
      navigate(location.pathname + location.search + location.hash, { replace: true, state, preventScrollReset: true });
    }
    callbacks.current.onClose();
  }, [location, navigate]);

  const back = useCallback(() => {
    if (backRequested.current) return;
    if (entry.current && location.state?.[CHECKOUT_HISTORY_KEY] === entry.current.token) {
      backRequested.current = true;
      navigate(-1);
    } else {
      closing.current = true;
      callbacks.current.onBack();
    }
  }, [location.state, navigate]);

  return { close, back };
}
