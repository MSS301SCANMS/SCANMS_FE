import api from "./api";
import axios from "axios";


const reviewApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: 10000,
  withCredentials: true,
});
reviewApi.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    const details = axios.isAxiosError<{ message?: string | string[] }>(error)
      ? error.response?.data?.message
      : undefined;
    const message =
      typeof details === "string"
        ? details
        : Array.isArray(details)
          ? details[0]
          : undefined;
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    const fallback =
      status === 503
        ? "Dịch vụ tạm thời chưa sẵn sàng. Thử lại hoặc bỏ ảnh/video để gửi nhận xét."
        : status === 403
          ? "Phiên xác minh đã hết hạn. Vui lòng xác minh lại đơn hàng."
          : status && status >= 500
            ? "Máy chủ đang gặp lỗi. Nội dung của bạn vẫn được giữ để thử lại."
            : "Không kết nối được máy chủ. Vui lòng thử lại.";
    return Promise.reject(
      new Error(
        message && message !== "Internal server error" ? message : fallback,
      ),
    );
  },
);

export interface ReviewProduct {
  productId: string;
  productTitle: string;
  imageUrl?: string;
  sku?: string;
}
export interface VerifiedReviewOrder {
  id: string;
  externalOrderSn: string;
  reviewToken?: string;
  status: string;
  items: ReviewProduct[];
}
export interface SubmittedProductReview {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
  video?: string | null;
}
interface Envelope<T> {
  data: T;
}

export const reviewService = {
  async verifyOrder(
    orderSn: string,
    phone: string,
  ): Promise<VerifiedReviewOrder> {
    const response = await reviewApi.get<
      unknown,
      Envelope<{ orders: VerifiedReviewOrder[] }>
    >("/orders/track", {
      params: { orderSn: orderSn.trim(), phone: phone.trim() },
    });
    const order = response.data.orders.find(
      (item) =>
        item.externalOrderSn.toLowerCase() === orderSn.trim().toLowerCase(),
    );
    if (!order?.reviewToken)
      throw new Error(
        "Mã đơn hoặc số điện thoại không khớp. Vui lòng kiểm tra lại.",
      );
    if (!["DELIVERED", "COMPLETED"].includes(order.status))
      throw new Error("Chỉ có thể đánh giá sau khi đã nhận hàng.");
    return order;
  },
  async uploadMedia(
    order: VerifiedReviewOrder,
    productId: string,
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    body.append("productId", productId);
    body.append("reviewToken", order.reviewToken ?? "");
    const response = await reviewApi.post<
      unknown,
      Envelope<{ secureUrl: string }>
    >(`/orders/${order.id}/review/media`, body, {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      timeout: 180000,
      onUploadProgress: (event) => {
        if (event.total)
          onProgress(
            Math.min(99, Math.round((event.loaded / event.total) * 100)),
          );
      },
    });
    if (!response.data.secureUrl?.startsWith("https://"))
      throw new Error("Máy chủ chưa trả về URL tải lên hợp lệ.");
    onProgress(100);
    return response.data.secureUrl;
  },
  async submit(
    order: VerifiedReviewOrder,
    payload: {
      productId: string;
      rating: number;
      comment: string;
      images: string[];
      video?: string;
    },
  ): Promise<SubmittedProductReview> {
    const response = await reviewApi.post<
      unknown,
      Envelope<{ review: SubmittedProductReview }>
    >(`/orders/${order.id}/review`, {
      ...payload,
      reviewToken: order.reviewToken,
    });
    return response.data.review;
  },
};
