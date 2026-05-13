'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { LoginCredentials, ActivationCredentials, User, AuthTokens } from '@/types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, login, logout: storeLogout, setLoading } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await authApi.login({
        username: credentials.username,
        password: credentials.password,
      });
      return data as { user: User; accessToken: string; refreshToken: string };
    },
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      } as AuthTokens);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/home');
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (credentials: ActivationCredentials) => {
      const { data } = await authApi.activate(credentials.code);
      return data as { user: User; accessToken: string; refreshToken: string };
    },
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      } as AuthTokens);
      router.push('/home');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // ignore errors on logout
      }
    },
    onSettled: () => {
      storeLogout();
      queryClient.clear();
      router.push('/login');
    },
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await authApi.me();
      return data as User;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  return {
    user: meQuery.data || user,
    isAuthenticated,
    isLoading: isLoading || meQuery.isLoading,
    login: loginMutation.mutateAsync,
    activate: activateMutation.mutateAsync,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error,
    activateError: activateMutation.error,
    isLoginPending: loginMutation.isPending,
    isActivatePending: activateMutation.isPending,
    setLoading,
  };
}
