# Checkout return navigation

Checkout used to open as local component state, and product Buy Now replaced the product's history entry. Browser Back could consequently leave the product entirely. Closing checkout opened from the cart also left the cart closed, exposing the underlying marketplace page.

`useCheckoutNavigation` now owns one Router history entry per checkout opening. Product Buy Now pushes its existing checkout query with an overlay marker; cart/reorder/direct-buy overlays create a marked entry on their current route. Browser Back and the checkout Back button return to the source. A cart-origin checkout reopens its cart; live-origin checkout leaves the existing live component mounted. Product selection, quantity and unrelated query parameters are preserved.

Explicit completion closes the overlay without an asynchronous history Back, allowing navigation to customer orders after successful payment. The navigation hook is outside the session-keyed checkout form so token renewal does not add another history entry.

Validation on 28 October:

- TypeScript/Vite production build passes.
- Real ProductDetail browser fixture: browser Back and checkout Back both close checkout on the product, preserve quantity/selection/query, and a subsequent Back reaches the actual previous route.
- Shared CartProvider fixture: direct buy returns to the live source without remounting it; cart checkout returns with the cart reopened.
- Back actions create no order or payment requests.
- Existing checkout pricing/wallet/payment-success browser test passes.
- Existing account isolation and renewal browser test passes.
- Regular Node suite: 163 passed, 7 known develop baseline failures, 118 environment-dependent skips (288 cases). The navigation browser fixture was run explicitly with Edge; the seven existing failures remain documented in `teacher-feedback-20261028.md`.
