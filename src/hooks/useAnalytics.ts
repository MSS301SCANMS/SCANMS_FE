import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';

export const analyticsKeys = {
  overview: (params?: object) => ['analytics', 'overview', params] as const,
  timeSeries: (params?: object) => ['analytics', 'timeseries', params] as const,
  topProducts: (params?: object) => ['analytics', 'top-products', params] as const,
  topChannels: (params?: object) => ['analytics', 'top-channels', params] as const,
  funnel: (params?: object) => ['analytics', 'funnel', params] as const,
  campaigns: (params?: object) => ['analytics', 'campaigns', params] as const,
};

export function useRealtimeOverview(params?: Parameters<typeof analyticsService.getRealtimeOverview>[0]) {
  return useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => analyticsService.getRealtimeOverview(params),
    refetchInterval: 60000,
  });
}

export function useAnalyticsTimeSeries(params?: Parameters<typeof analyticsService.getTimeSeries>[0]) {
  return useQuery({
    queryKey: analyticsKeys.timeSeries(params),
    queryFn: () => analyticsService.getTimeSeries(params),
    refetchInterval: 60000,
  });
}

export function useTopProducts(params?: Parameters<typeof analyticsService.getTopProducts>[0]) {
  return useQuery({
    queryKey: analyticsKeys.topProducts(params),
    queryFn: () => analyticsService.getTopProducts(params),
  });
}

export function useTopChannels(params?: Parameters<typeof analyticsService.getTopChannels>[0]) {
  return useQuery({
    queryKey: analyticsKeys.topChannels(params),
    queryFn: () => analyticsService.getTopChannels(params),
  });
}

export function useConversionFunnel(params?: Parameters<typeof analyticsService.getConversionFunnel>[0]) {
  return useQuery({
    queryKey: analyticsKeys.funnel(params),
    queryFn: () => analyticsService.getConversionFunnel(params),
  });
}

export function useCampaignPerformance(params?: Parameters<typeof analyticsService.getCampaignPerformance>[0]) {
  return useQuery({
    queryKey: analyticsKeys.campaigns(params),
    queryFn: () => analyticsService.getCampaignPerformance(params),
  });
}
