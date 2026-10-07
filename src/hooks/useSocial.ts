import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialService } from '../services/social.service';

export const socialKeys = {
  myChannels: ['social', 'my-channels'] as const,
};

export function useMySocialChannels() {
  return useQuery({
    queryKey: socialKeys.myChannels,
    queryFn: () => socialService.getMyChannels(),
  });
}

export function useAddSocialChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof socialService.addChannel>[0]) =>
      socialService.addChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.myChannels });
    },
  });
}

export function useDeleteSocialChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialService.deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.myChannels });
    },
  });
}

export function useSetPrimarySocialChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialService.setPrimary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.myChannels });
    },
  });
}
