import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService, type CreatePostInput, type UpdatePostInput } from '@/services/post.service';

export function useFeed(page = 1) {
  return useQuery({
    queryKey: ['feed', page],
    queryFn: () => postService.getFeed(page),
  });
}

export function useFollowingFeed(page = 1) {
  return useQuery({
    queryKey: ['followingFeed', page],
    queryFn: () => postService.getFollowingFeed(page),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => postService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['followingFeed'] });
    },
  });
}

export function useUpdatePost(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePostInput) => postService.update(postId, input),
    onSuccess: (updated) => {
      qc.setQueryData(['post', postId], updated);
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['followingFeed'] });
      qc.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}
