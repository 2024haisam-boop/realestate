'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PostForm } from '@/components/social/PostForm';
import { createSocialPostAction } from '../actions';
import type { ProfileRow } from '@/lib/supabase/types';
import type { SocialPostCreateInput } from '@/lib/validations/social.schema';

interface Props {
  members: ProfileRow[];
}

export function NewPostFormClient({ members }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: SocialPostCreateInput) => {
    startTransition(async () => {
      const r = await createSocialPostAction(values);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success('Post created');
      router.push(`/social/${r.data.postId}`);
      router.refresh();
    });
  };

  return <PostForm members={members} onSubmit={onSubmit} isPending={isPending} submitLabel="Create post" />;
}
