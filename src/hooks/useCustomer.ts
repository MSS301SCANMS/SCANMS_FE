import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService, type CustomerAddress, type CustomerReturnRequest } from '../services/customer.service';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const customerKeys = {
  profile: ['customer', 'profile'] as const,
  orders: (params?: object) => ['customer', 'orders', params] as const,
  orderDetail: (id: string) => ['customer', 'orders', 'detail', id] as const,
  addresses: ['customer', 'addresses'] as const,
  wishlist: ['customer', 'wishlist'] as const,
  cart: ['customer', 'cart'] as const,
  identity: ['customer', 'identity'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCustomerProfile() {
  return useQuery({
    queryKey: customerKeys.profile,
    queryFn: () => customerService.getProfile(),
  });
}

export function useCustomerOrders(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: customerKeys.orders(params),
    queryFn: () => customerService.getOrders(params),
  });
}

export function useCustomerOrderDetail(orderId: string) {
  return useQuery({
    queryKey: customerKeys.orderDetail(orderId),
    queryFn: () => customerService.getOrderDetails(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCustomerAddresses() {
  return useQuery({
    queryKey: customerKeys.addresses,
    queryFn: () => customerService.getAddresses(),
  });
}

export function useCustomerWishlist() {
  return useQuery({
    queryKey: customerKeys.wishlist,
    queryFn: () => customerService.getWishlist(),
  });
}

export function useCustomerCart() {
  return useQuery({
    queryKey: customerKeys.cart,
    queryFn: () => customerService.getCart(),
    staleTime: 0, // cart luôn fresh
  });
}

export function useCustomerIdentity() {
  return useQuery({
    queryKey: customerKeys.identity,
    queryFn: () => customerService.getIdentity(),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fullName?: string; phoneNumber?: string; avatarUrl?: string }) =>
      customerService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.profile });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      customerService.changePassword(data),
  });
}

export function useCancelCustomerOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      customerService.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
    },
  });
}

export function useConfirmOrderReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => customerService.confirmReceipt(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
    },
  });
}

export function useCreateReturnRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: {
        reason: CustomerReturnRequest['reason'];
        details?: string;
        imageUrls: string[];
        unboxingVideoUrl: string;
      };
    }) => customerService.createReturnRequest(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
    },
  });
}

export function useSubmitVerifiedReview() {
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: { productId: string; rating: number; comment: string; images?: string[] };
    }) => customerService.submitVerifiedReview(orderId, data),
  });
}

export function useSyncCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ productId: string; variantId?: string; quantity: number }>) =>
      customerService.syncCart(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.cart });
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CustomerAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      customerService.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerAddress> }) =>
      customerService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses });
    },
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => customerService.toggleWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.wishlist });
    },
  });
}

export function useVerifyIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fullName: string; idCardNumber: string; address: string }) =>
      customerService.verifyIdentity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.identity });
    },
  });
}
