import Link from 'next/link';
import Image from 'next/image';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { CalendarClock, ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { POST_PLATFORM_LABEL } from '@/lib/constants';
import { initialsFromName } from '@/lib/utils';
import type { PostStatus } from '@/lib/supabase/types';
import type { SocialPostWithAssignee } from '@/lib/db/social';

interface PostCardProps {
  post: SocialPostWithAssignee;
}

const STATUS_TONE: Record<PostStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  idea: 'muted',
  draft: 'info',
  scheduled: 'warning',
  published: 'success',
  cancelled: 'danger',
};

function countdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff < 0) return 'past due';
  return `in ${formatDistanceToNowStrict(new Date(target))}`;
}

export function PostCard({ post }: PostCardProps) {
  const primaryImage = post.media_urls?.[0];
  return (
    <Link href={`/social/${post.id}`} className="block">
      <Card className="overflow-hidden transition-colors hover:bg-surface-2">
        <div className="relative aspect-video bg-surface-3">
          {primaryImage ? (
            <Image src={primaryImage} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <Badge variant={STATUS_TONE[post.status]} className="text-[10px] uppercase">
              {post.status}
            </Badge>
            <Badge variant="muted" className="text-[10px] uppercase">
              {POST_PLATFORM_LABEL[post.platform]}
            </Badge>
          </div>
        </div>
        <div className="space-y-2 p-3">
          <p className="line-clamp-3 text-sm text-text-primary">
            {post.caption?.trim() || <span className="italic text-text-muted">No caption yet</span>}
          </p>
          <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
            <div className="flex items-center gap-1.5">
              {post.assignee ? (
                <>
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {initialsFromName(post.assignee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.assignee.full_name}</span>
                </>
              ) : (
                <span>Unassigned</span>
              )}
            </div>
            {post.scheduled_at ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {post.status === 'scheduled' ? countdown(post.scheduled_at) : format(new Date(post.scheduled_at), 'd MMM')}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
