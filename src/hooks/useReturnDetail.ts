import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnService } from '../services/return.service';

export function useReturnDetail(id?: string) {
  return useQuery({
    queryKey: ['return-detail', id],
    queryFn: () => returnService.getOne(id!),
    enabled: Boolean(id),
    refetchInterval: 30000,
  });
}

export function useConfirmShipment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { carrierName: string; trackingNumber: string; receipt: File }) =>
      returnService.submitShipment(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['return-detail', id] });
      await queryClient.invalidateQueries({ queryKey: ['shop-returns'] });
    },
  });
}

export function useReturnAction<T>(id: string, action: (id: string, data: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: T) => action(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['return-detail', id] });
      await queryClient.invalidateQueries({ queryKey: ['shop-returns'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-return-disputes'] });
    },
  });
}
