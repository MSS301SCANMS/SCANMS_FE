import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService, type ManualOrderInput, type ManagedOrderStatus } from '../services/order.service';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const orderKeys = {
  all: ['orders'] as const,
  storeList: (params?: object) => ['orders', 'store-list', params] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useStoreOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  storeId?: string;
}) {
  return useQuery({
    queryKey: orderKeys.storeList(params),
    queryFn: () => orderService.getMyStoreOrders(params),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateOrderFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: { status: ManagedOrderStatus; trackingNumber?: string; carrierName?: string; note?: string };
    }) => orderService.updateOrderFulfillment(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useRespondReturnRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      decision,
      response,
    }: {
      orderId: string;
      decision: 'APPROVE' | 'REJECT';
      response: string;
    }) => orderService.respondReturnRequest(orderId, { decision, response }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCreateManualOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ManualOrderInput) => orderService.createManualOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useImportOrdersExcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, storeId }: { file: File; storeId?: string }) =>
      orderService.importExcel(file, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useShopCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      orderService.shopCancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useQuoteDiscount() {
  return useMutation({
    mutationFn: (data: Parameters<typeof orderService.quoteDiscount>[0]) =>
      orderService.quoteDiscount(data),
  });
}
