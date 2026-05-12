import { useState } from 'react';
import { usePostVote } from '@/hooks/useVotes';
import { cn } from '@/utils/cn';

interface VoteButtonProps {
  postId: string;
  upvotes: number;
  downvotes?: number;
  userVote?: number;
}

export function VoteButton({ postId, upvotes, userVote = 0 }: VoteButtonProps) {
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [localVote, setLocalVote] = useState(userVote > 0 ? 1 : 0);
  const { mutate } = usePostVote(postId);

  const handleVote = () => {
    const prev = localVote;
    const next = prev === 1 ? 0 : 1;
    setLocalVote(next);
    setLocalUpvotes((v) => (next === 1 ? v + 1 : v - 1));

    mutate(1, {
      onError: () => {
        setLocalVote(prev);
        setLocalUpvotes(upvotes);
      },
      onSuccess: (data) => {
        setLocalVote(data.finalValue > 0 ? 1 : 0);
        setLocalUpvotes(data.upvotes);
      },
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleVote}
        className={cn(
          'btn-ghost px-2 py-1.5',
          localVote === 1 && 'text-primary bg-primary/10',
        )}
        title={localVote === 1 ? 'Quitar me gusta' : 'Me gusta'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={localVote === 1 ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {localUpvotes > 0 && (
        <span
          className={cn(
            'min-w-[1ch] text-xs font-semibold tabular-nums',
            localVote === 1 ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {localUpvotes}
        </span>
      )}
    </div>
  );
}
