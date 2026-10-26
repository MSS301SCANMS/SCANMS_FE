const key = (productId: string) => `scanms-product-referral:${productId}`;
const valid = (value: string) => /^[A-Za-z0-9_-]{1,100}$/.test(value);
const storage = () => typeof localStorage !== 'undefined' ? localStorage : sessionStorage;
/** Last product click wins for 24 hours. Checkout revalidates the opaque click id on the server. */
export function captureProductReferral(productId: string, referralId: string | null, clickId?: string, expiresAt?: string) {
    if (!valid(productId) || referralId === null)
        return;
    try {
        const expiry = expiresAt ? Date.parse(expiresAt) : Date.now() + 86400000;
        let previous;
        try {
            previous = JSON.parse(storage().getItem(key(productId)) || 'null');
        }
        catch { /* Replace an older storage format. */ }
        if (expiresAt && previous?.expiresAt > expiry && previous?.clickId)
            return;
        if (valid(referralId) && Number.isFinite(expiry) && expiry > Date.now())
            storage().setItem(key(productId), JSON.stringify({ referralId, clickId, expiresAt: Math.min(expiry, Date.now() + 86400000) }));
        else
            storage().removeItem(key(productId));
    }
    catch { /* A private browser can disable storage. */ }
}
function read(productId: string): {
    referralId: string;
    clickId?: string;
} | undefined {
    try {
        const value = JSON.parse(storage().getItem(key(productId)) || 'null');
        if (!value || !valid(value.referralId) || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) {
            storage().removeItem(key(productId));
            return undefined;
        }
        return value;
    }
    catch {
        return undefined;
    }
}
export const getProductReferral = (productId: string) => read(productId)?.referralId;
export const getProductReferralClick = (productId: string) => read(productId)?.clickId;
