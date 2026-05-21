'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PostForm } from '@/components/social/PostForm';
import {
  deleteSocialPostAction,
  publishNowAction,
  updateSocialPostAction,
} from '../actions';
import type { ProfileRow, SocialPostRow } from '@/lib/supabase/types';
import type { SocialPostCreateInput } from '@/lib/validations/social.schema';

interface Props {
  post: SocialPostRow;
  members: ProfileRow[];
}

export function EditPostClient({ post, members }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSave = (values: SocialPostCreateInput) => {
    startTransition(async () => {
      const r = await updateSocialPostAction({ postId: post.id, ...values });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success('Post updated');
      router.refresh();
    });
  };

  const onPublish = () => {
    startTransition(async () => {
      const r = await publishNowAction(post.id);
      if (!r.success) toast.error(r.error);
      else {
        toast.success('Published');
        router.refresh();
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const r = await deleteSocialPostAction(post.id);
      if (!r.success) toast.error(r.error);
      else {
        toast.success('Post deleted');
        router.push('/social');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <PostForm
        members={members}
        onSubmit={onSave}
        isPending={isPending}
        submitLabel="Save changes"
        defaults={{
          platform: post.platform,
          caption: post.caption ?? '',
          status: post.status,
          scheduledAt: post.scheduled_at ?? '',
          assignedTo: post.assigned_to ?? '',
          notes: post.notes ?? '',
          mediaUrls: post.media_urls ?? [],
        }}
      />

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {post.status !== 'published' ? (
          <Button onClick={onPublish} loading={isPending}>
            <CheckCircle2 className="h-4 w-4" />
            Publish now
          </Button>
        ) : null}
        <ConfirmDialog
          title="Delete this post?"
          description="The draft, caption, and media references will be removed. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={onDelete}
          trigger={
            <Button variant="outline" className="text-brand-danger">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          }
        />
      </div>
    </div>
  );
}
