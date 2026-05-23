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

  const { mutate: doFollow, isPending: followPending } = useMutation({
    mutationFn: () => userService.follow(username),
    onMutate: () => setFollowing(true),
    onError: () => setFollowing(false),
    onSuccess: (data) => {
      setFollowing(data.following);
      qc.invalidateQueries({ queryKey: ['profile', username] });
    },
  });

  const { mutate: doUnfollow, isPending: unfollowPending } = useMutation({
    mutationFn: () => userService.unfollow(username),
    onMutate: () => setFollowing(false),
    onError: () => setFollowing(true),
    onSuccess: (data) => {
      setFollowing(data.following);
      qc.invalidateQueries({ queryKey: ['profile', username] });
    },
  });

  const isPending = followPending || unfollowPending;

  return (
    <button
      onClick={() => (following ? doUnfollow() : doFollow())}
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
