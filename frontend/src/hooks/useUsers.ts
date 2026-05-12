import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => userService.getProfile(username!),
    enabled: !!username,
  });
}

export function useUserPosts(username: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['userPosts', username, page],
    queryFn: () => userService.getUserPosts(username!, page),
    enabled: !!username,
  });
}
