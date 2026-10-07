import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, type UserProfile } from '../services/auth.service';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const authKeys = {
  me: ['auth', 'me'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Lấy thông tin người dùng hiện tại từ server (dùng khi cần đồng bộ mới nhất) */
export function useMe(enabled = true) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authService.getMe(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

/** Lấy thông tin từ localStorage — không call API */
export function useCurrentUser(): UserProfile | null {
  return authService.getCurrentUser();
}

/** Danh sách workspace người dùng có quyền */
export function useWorkspaces() {
  const user = authService.getCurrentUser();
  return authService.getUserAvailableWorkspaces(user);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idToken, role, storeName }: { idToken: string; role?: string; storeName?: string }) =>
      authService.googleLogin(idToken, role, storeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: Parameters<typeof authService.register>[0]) =>
      authService.register(data),
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (email: string) => authService.sendOtp(email),
  });
}

export function useSendForgotPasswordOtp() {
  return useMutation({
    mutationFn: (email: string) => authService.sendForgotPasswordOtp(email),
  });
}

export function useVerifyResetOtp() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authService.verifyResetOtp(email, otp),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { email: string; otp: string; newPassword: string }) =>
      authService.resetPassword(data),
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (avatarUrl: string) => authService.updateAvatar(avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      queryClient.clear();
      authService.logout();
    },
  });
}
