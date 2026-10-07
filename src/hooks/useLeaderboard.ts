import { useQuery } from '@tanstack/react-query';
import { leaderboardService, type LeaderboardQueryParams } from '../services/leaderboard.service';

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  list: (params?: object) => ['leaderboard', 'list', params] as const,
  podium: (params?: object) => ['leaderboard', 'podium', params] as const,
  myRank: (params?: object) => ['leaderboard', 'my-rank', params] as const,
  creator: (id: string) => ['leaderboard', 'creator', id] as const,
};

export function useLeaderboard(params?: LeaderboardQueryParams) {
  return useQuery({
    queryKey: leaderboardKeys.list(params),
    queryFn: () => leaderboardService.getLeaderboard(params),
  });
}

export function useLeaderboardPodium(params?: LeaderboardQueryParams) {
  return useQuery({
    queryKey: leaderboardKeys.podium(params),
    queryFn: () => leaderboardService.getPodium(params),
  });
}

export function useMyLeaderboardRank(params?: LeaderboardQueryParams) {
  return useQuery({
    queryKey: leaderboardKeys.myRank(params),
    queryFn: () => leaderboardService.getMyRank(params),
  });
}

export function useCreatorProfile(creatorId: string) {
  return useQuery({
    queryKey: leaderboardKeys.creator(creatorId),
    queryFn: () => leaderboardService.getCreatorProfile(creatorId),
    enabled: Boolean(creatorId),
  });
}
