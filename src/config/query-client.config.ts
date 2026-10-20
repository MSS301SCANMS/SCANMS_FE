import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dữ liệu được coi là mới trong 3 phút, không tự động fetch lại
      staleTime: 1000 * 60 * 3,
      // Lưu trong RAM cache 30 phút trước khi bị dọn rác
      gcTime: 1000 * 60 * 30,
      // Không tự giật/refetch khi người dùng đổi tab trình duyệt
      refetchOnWindowFocus: false,
      // Tự thử lại 1 lần nếu network gặp sự cố chập chờn
      retry: 1,
    },
  },
});
