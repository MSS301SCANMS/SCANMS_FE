import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import OrdersManagementPage from "./merchant/OrdersManagementPage";
import {
  ProductReviewModal,
  type ProductReviewTarget,
} from "../components/reviews/ProductReviewModal";

export default function UiReferencePage() {
  const location = useLocation();
  const referenceFrame = useRef<HTMLIFrameElement>(null);
  const [orderAction, setOrderAction] = useState<"manual" | "excel" | null>(
    null,
  );
  const [reviewTarget, setReviewTarget] = useState<
    (ProductReviewTarget & { prototypeOrderId: string }) | null
  >(null);
  useEffect(() => {
    function openReview(event: MessageEvent<unknown>) {
      if (
        event.origin !== window.location.origin ||
        event.source !== referenceFrame.current?.contentWindow ||
        !event.data ||
        typeof event.data !== "object"
      )
        return;
      const data = event.data as Record<string, unknown>;
      if (
        data.type === "SCANMS_OPEN_ORDER_FORM" &&
        (data.action === "manual" || data.action === "excel")
      ) {
        setOrderAction(data.action);
        return;
      }
      if (
        data.type !== "SCANMS_OPEN_PRODUCT_REVIEW" ||
        typeof data.orderId !== "string" ||
        typeof data.productName !== "string" ||
        typeof data.productId !== "string"
      )
        return;
      let imageUrl: string | undefined;
      if (typeof data.imageUrl === "string") {
        try {
          const url = new URL(
            data.imageUrl,
            `${window.location.origin}/reference/`,
          );
          if (url.origin === window.location.origin) imageUrl = url.href;
        } catch {

        }
      }
      setReviewTarget({
        prototypeOrderId: data.orderId,
        externalOrderSn: data.orderId,
        productId: data.productId,
        productTitle: data.productName,
        imageUrl,
      });
    }
    window.addEventListener("message", openReview);
    return () => window.removeEventListener("message", openReview);
  }, []);


  const savedRole = localStorage.getItem("scanms-current-role") || "shop";
  const defaultScreenForRole =
    savedRole === "shop"
      ? "shop-dashboard"
      : savedRole === "admin"
        ? "admin-dashboard"
        : savedRole === "manager"
          ? "manager-dashboard"
          : "kol-dashboard";

  const savedScreen =
    localStorage.getItem("scanms-current-screen") || defaultScreenForRole;

  let screen = savedScreen;

  if (location.pathname === "/login") {
    screen = "auth";
  } else if (location.pathname === "/register") {
    screen = "register";
  } else if (location.pathname === "/marketplace") {
    screen = "marketplace";
  } else if (location.pathname === "/storefront") {
    screen = "storefront";
  } else if (location.pathname.startsWith("/app/")) {
    screen = location.pathname.replace("/app/", "");
  } else if (location.hash && location.hash.length > 1) {
    screen = location.hash.slice(1);
  }

  const safeScreen = /^[a-z0-9-]+$/.test(screen)
    ? screen
    : defaultScreenForRole;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <iframe
        ref={referenceFrame}
        title="SCANMS UI/UX Prototype - Nguyễn Đình Tuấn"
        src={`/reference/index.html?v=fresh199#${safeScreen}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          flex: 1,
          display: "block",
        }}
      />
      {reviewTarget && (
        <ProductReviewModal
          key={reviewTarget.prototypeOrderId}
          target={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={(result) =>
            referenceFrame.current?.contentWindow?.postMessage(
              {
                type: "SCANMS_PRODUCT_REVIEW_SUBMITTED",
                prototypeOrderId: reviewTarget.prototypeOrderId,
                productName: result.product.productTitle,
                orderSn: result.order.externalOrderSn,
                review: result.review,
              },
              window.location.origin,
            )
          }
        />
      )}
      {orderAction && (
        <OrdersManagementPage
          key={orderAction}
          initialAction={orderAction}
          onClose={() => setOrderAction(null)}
          onCompleted={(message) =>
            referenceFrame.current?.contentWindow?.postMessage(
              { type: "SCANMS_ORDER_FORM_COMPLETED", message },
              window.location.origin,
            )
          }
        />
      )}
    </div>
  );
}
