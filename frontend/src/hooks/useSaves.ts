import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saveService } from '@/services/save.service';

export function useSavedPosts(page = 1) {
  return useQuery({
    queryKey: ['saved', page],
    queryFn: () => saveService.getSaved(page),
  });
}

export function useToggleSave(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => saveService.toggle(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved'] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
