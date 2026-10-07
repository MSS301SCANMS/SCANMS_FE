import { useMutation } from '@tanstack/react-query';
import { reviewService } from '../services/review.service';

/**
 * Xác thực đơn hàng trước khi cho phép đánh giá (không cần đăng nhập).
 */
export function useVerifyOrderForReview() {
  return useMutation({
    mutationFn: ({ orderSn, phone }: { orderSn: string; phone: string }) =>
      reviewService.verifyOrder(orderSn, phone),
  });
}

/**
 * Upload ảnh / video kèm đánh giá.
 */
export function useUploadReviewMedia() {
  return useMutation({
    mutationFn: ({
      order,
      productId,
      file,
      onProgress,
      signal,
    }: {
      order: Parameters<typeof reviewService.uploadMedia>[0];
      productId: string;
      file: File;
      onProgress: (percent: number) => void;
      signal: AbortSignal;
    }) => reviewService.uploadMedia(order, productId, file, onProgress, signal),
  });
}

/**
 * Gửi đánh giá sản phẩm.
 */
export function useSubmitReview() {
  return useMutation({
    mutationFn: ({
      order,
      payload,
    }: {
      order: Parameters<typeof reviewService.submit>[0];
      payload: Parameters<typeof reviewService.submit>[1];
    }) => reviewService.submit(order, payload),
  });
}
