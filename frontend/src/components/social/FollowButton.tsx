import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { cn } from '@/utils/cn';

interface FollowButtonProps {
  username: string;
  isFollowing: boolean;
  className?: string;
}

export function FollowButton({ username, isFollowing: initial, className }: FollowButtonProps) {
  const [following, setFollowing] = useState(initial);
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => userService.toggleFollow(username),
    onMutate: () => setFollowing((f) => !f),
    onError: () => setFollowing(following),
    onSuccess: (data) => {
      setFollowing(data.following);
      qc.invalidateQueries({ queryKey: ['profile', username] });
    },
  });

  return (
    <button
      onClick={() => mutate()}
      disabled={isPending}
      className={cn(
        following ? 'btn-outline' : 'btn-primary',
        'text-xs px-4 py-1.5',
        className,
      )}
    >
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  );
}
