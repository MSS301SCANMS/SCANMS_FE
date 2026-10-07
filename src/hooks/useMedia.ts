import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../services/media.service';

export const mediaKeys = {
  all: ['media'] as const,
  list: (params?: object) => ['media', 'list', params] as const,
};

export function useMediaAssets(params?: {
  productId?: string;
  assetType?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => mediaService.getMediaAssets(params),
  });
}

export function useCreateMediaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof mediaService.createMediaAsset>[0]) =>
      mediaService.createMediaAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useSubmitKolVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof mediaService.submitKolVideo>[0]) =>
      mediaService.submitKolVideo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaService.deleteMediaAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}
