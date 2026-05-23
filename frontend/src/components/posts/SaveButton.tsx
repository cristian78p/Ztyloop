import { useState } from 'react';
import { useSavePost, useUnsavePost } from '@/hooks/useSaves';
import { cn } from '@/utils/cn';

interface SaveButtonProps {
  postId: string;
  saved?: boolean;
  className?: string;
}

export function SaveButton({ postId, saved: initialSaved = false, className }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const { mutate: doSave } = useSavePost(postId);
  const { mutate: doUnsave } = useUnsavePost(postId);

  const handleToggle = () => {
    const prev = saved;
    setSaved(!prev);

    const mutate = prev ? doUnsave : doSave;
    mutate(undefined, {
      onSuccess: (data) => setSaved(data.saved),
      onError: () => setSaved(prev),
    });
  };

  return (
    <button
      onClick={handleToggle}
      className={cn('btn-ghost px-2 py-1.5', saved && 'text-primary', className)}
      title={saved ? 'Quitar de guardados' : 'Guardar'}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
