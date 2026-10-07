import { useMutation, useQuery } from '@tanstack/react-query';
import { shippingService, type CreateGhnOrderPayload } from '../services/shipping.service';
import { loadShippingAddresses } from '../services/order-address.service';

export const shippingKeys = {
  provinces: ['shipping', 'provinces'] as const,
  tracking: (orderCode: string) => ['shipping', 'tracking', orderCode] as const,
};

/** Tải danh sách tỉnh/huyện/xã Việt Nam */
export function useShippingProvinces() {
  return useQuery({
    queryKey: shippingKeys.provinces,
    queryFn: () => loadShippingAddresses(),
    staleTime: 1000 * 60 * 60, // 1 giờ — địa chỉ hành chính hiếm thay đổi
  });
}

/** Tra cứu hành trình đơn GHN */
export function useTrackShipment(orderCode: string) {
  return useQuery({
    queryKey: shippingKeys.tracking(orderCode),
    queryFn: () => shippingService.trackOrder(orderCode),
    enabled: Boolean(orderCode),
    refetchInterval: 60000,
  });
}

/** Tạo vận đơn GHN */
export function useCreateGhnOrder() {
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload?: CreateGhnOrderPayload }) =>
      shippingService.createGhnOrder(orderId, payload),
  });
}

/** Tính phí GHN */
export function useCalculateShippingFee() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof shippingService.calculateFee>[0]) =>
      shippingService.calculateFee(payload),
  });
}
