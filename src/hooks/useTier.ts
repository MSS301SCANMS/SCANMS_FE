import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tierService } from '../services/tier.service';

export const tierKeys = {
  all: ['tiers'] as const,
  myStatus: ['tiers', 'my-status'] as const,
};

export function useAllTiers() {
  return useQuery({
    queryKey: tierKeys.all,
    queryFn: () => tierService.getAllTiers(),
    staleTime: 1000 * 60 * 10, // tiers thay đổi ít
  });
}

export function useMyTierStatus() {
  return useQuery({
    queryKey: tierKeys.myStatus,
    queryFn: () => tierService.getMyTierStatus(),
  });
}

export function useTriggerTierEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tierService.triggerEvaluation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tierKeys.myStatus });
    },
  });
}
