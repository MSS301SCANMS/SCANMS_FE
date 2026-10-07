import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storeService, type StoreSettings } from '../services/store.service';

export const storeKeys = {
  myStore: ['store', 'my-store'] as const,
};

export function useMyStore() {
  return useQuery({
    queryKey: storeKeys.myStore,
    queryFn: () => storeService.getMyStore(),
  });
}

export function useUpdateMyStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StoreSettings>) => storeService.updateMyStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.myStore });
    },
  });
}
