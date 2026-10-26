import React from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';

interface CheckoutPoliciesSectionProps {
  policyLoading: boolean;
  policyError: string | null;
  shopPolicies: Record<string, any>;
  itemsGroupedByShop: Array<{ store: { id: string; name: string } }>;
  policyAccepted: boolean;
  onPolicyAcceptedChange: (accepted: boolean) => void;
  onClearPolicyError?: () => void;
}

/**
 * Hiển thị chính sách bảo hành, đổi trả và giao hàng riêng biệt của từng gian hàng
 * Kèm cam kết bảo vệ quyền lợi người mua SCANMS Escrow 14 ngày.
 */
export const CheckoutPoliciesSection: React.FC<CheckoutPoliciesSectionProps> = ({
  policyLoading,
  policyError,
  shopPolicies,
  itemsGroupedByShop,
  policyAccepted,
  onPolicyAcceptedChange,
  onClearPolicyError,
}) => {
  return (
    <>
      <details
        className="checkout-policy-details m-[0_24px] border-t border-t-[#EAE4D7] [&_>_summary]:flex [&_>_summary]:items-center [&_>_summary]:justify-between [&_>_summary]:gap-[12px] [&_>_summary]:min-h-[48px] [&_>_summary]:p-[12px_0] [&_>_summary]:list-none [&_>_summary]:text-[color:#7D715E]! [&_>_summary]:text-[12px] [&_>_summary]:leading-[1.6] [&_>_summary]:cursor-pointer [&_>_summary::-webkit-details-marker]:hidden [&_>_summary_>_span]:flex [&_>_summary_>_span]:items-center [&_>_summary_>_span]:gap-[7px] [&_svg]:shrink-0 [&_svg]:text-[color:#B88E4F]! [&[open]_>_summary_>_svg]:transform-[rotate(180deg)] [@media_(max-width:639px)]:m-[0_16px]"
        id="checkout-return-policies"
      >
        <summary>
          <span>
            <ShieldCheck size={16} aria-hidden="true" />
            Chính sách đổi trả & giao hàng của các gian hàng
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="checkout-policy-details-body grid gap-[12px] p-[4px_0_16px] text-[color:#7D715E]! text-[12px] leading-[1.7] [&_article]:p-[14px] [&_article]:border [&_article]:border-[#EAE4D7] [&_article]:rounded-[9px] [&_article]:bg-[color:#FAF8F5] [&_h3]:[font-family:inherit]! [&_h3]:text-[12px] [&_h3]:font-[600] [&_h3]:leading-[inherit] [&_h3]:[font-style:inherit] [&_h3]:[font-variant:inherit] [&_h3]:[font-stretch:inherit] [&_h3]:m-[0_0_6px] [&_h3]:text-[color:#1A1612]! [&_p]:m-[4px_0_0]">
          {policyLoading ? (
            <p>Đang tải chính sách Shop…</p>
          ) : policyError ? (
            <p className="checkout-policy-error text-[color:#DC2626]!">{policyError}</p>
          ) : (
            itemsGroupedByShop.map((group) => {
              const policy = shopPolicies[group.store.id];
              return (
                <article key={group.store.id}>
                  <h3>{group.store.name}</h3>
                  {policy ? (
                    <>
                      <p>{policy.policyReturn || 'Shop chưa công bố nội dung đổi trả riêng.'}</p>
                      {policy.policyWarranty && (
                        <p>
                          <strong>Bảo hành: </strong>
                          {policy.policyWarranty}
                        </p>
                      )}
                      {policy.policyShipping && (
                        <p>
                          <strong>Giao hàng: </strong>
                          {policy.policyShipping}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="checkout-policy-error text-[color:#DC2626]!">
                      Chưa tải được chính sách của gian hàng. Vui lòng thử lại sau.
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </details>

      {policyError && (
        <p
          className="checkout-payment-notice checkout-policy-error m-[0_24px_18px] p-[12px] border border-[#EEDFC6] rounded-[8px] bg-[color:#FBF5EB] text-[color:#DC2626]! text-[12px] leading-[1.6] [@media_(max-width:639px)]:m-[0_16px_16px]"
          role="alert"
        >
          {policyError}
        </p>
      )}

      <footer className="checkout-place-order flex items-center justify-between gap-[20px] p-[20px_24px] border-t border-t-[#EAE4D7] [&_>_label]:flex [&_>_label]:items-start [&_>_label]:gap-[9px] [&_>_label]:max-w-[650px] [&_>_label]:text-[color:#7D715E]! [&_>_label]:text-[12px] [&_>_label]:leading-[1.8] [&_>_label]:cursor-pointer [&_>_label_>_input]:shrink-0 [&_>_label_>_input]:w-[17px] [&_>_label_>_input]:h-[17px] [&_>_label_>_input]:mt-[3px] [&_>_label_>_input]:accent-[#B88E4F] [&_a]:text-[color:#8A642C]! [&_a]:underline [&_a]:underline-offset-[3px] [@media_(max-width:639px)]:flex-col [@media_(max-width:639px)]:items-stretch [@media_(max-width:639px)]:p-[18px_16px] [@media_(max-width:639px)]:gap-[16px] [@media_(max-width:639px)]:[&_>_label]:text-[11px]">
        <label htmlFor="checkout-policy-agreement">
          <input
            id="checkout-policy-agreement"
            type="checkbox"
            checked={policyAccepted}
            disabled={policyLoading || Boolean(policyError) || itemsGroupedByShop.some((group) => !shopPolicies[group.store.id])}
            onChange={(event) => {
              onPolicyAcceptedChange(event.target.checked);
              if (event.target.checked) {
                onClearPolicyError?.();
              }
            }}
          />
          <span>
            Tôi đã đọc và đồng ý với{' '}
            <a
              href="#checkout-return-policies"
              onClick={(event) => {
                event.preventDefault();
                const details = document.getElementById('checkout-return-policies') as HTMLDetailsElement | null;
                if (details) {
                  details.open = true;
                  details.scrollIntoView({ block: 'center' });
                  details.querySelector('summary')?.focus();
                }
              }}
            >
              chính sách đổi trả, giao hàng của các gian hàng
            </a>{' '}
            trong đơn.
          </span>
        </label>
      </footer>
    </>
  );
};
