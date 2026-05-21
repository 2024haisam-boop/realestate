'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  POST_CHARACTER_LIMITS,
  POST_PLATFORM_LABEL,
} from '@/lib/constants';
import { generateCaptionAction } from '@/app/(dashboard)/social/actions';
import type { PostPlatform, PostStatus, ProfileRow } from '@/lib/supabase/types';
import type { SocialPostCreateInput } from '@/lib/validations/social.schema';

interface PostFormProps {
  members: ProfileRow[];
  defaults?: Partial<SocialPostCreateInput> & { mediaUrlsCsv?: string };
  isPending: boolean;
  submitLabel?: string;
  onSubmit: (values: SocialPostCreateInput) => void;
}

const PLATFORMS: PostPlatform[] = [
  'instagram_post',
  'instagram_reel',
  'instagram_story',
  'facebook_post',
  'linkedin_post',
];

const STATUSES: PostStatus[] = ['idea', 'draft', 'scheduled', 'published', 'cancelled'];

export function PostForm({ members, defaults, isPending, submitLabel = 'Save post', onSubmit }: PostFormProps) {
  const [platform, setPlatform] = useState<PostPlatform>((defaults?.platform as PostPlatform) ?? 'instagram_post');
  const [status, setStatus] = useState<PostStatus>((defaults?.status as PostStatus) ?? 'idea');
  const [caption, setCaption] = useState<string>(defaults?.caption ?? '');
  const [scheduledAt, setScheduledAt] = useState<string>(
    defaults?.scheduledAt
      ? format(new Date(defaults.scheduledAt), "yyyy-MM-dd'T'HH:mm")
      : '',
  );
  const [assignedTo, setAssignedTo] = useState<string>(defaults?.assignedTo ?? '');
  const [notes, setNotes] = useState<string>(defaults?.notes ?? '');
  const [mediaUrlsCsv, setMediaUrlsCsv] = useState<string>(
    defaults?.mediaUrlsCsv ?? (defaults?.mediaUrls?.join(', ') ?? ''),
  );

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPending, startAi] = useTransition();

  const charLimit = POST_CHARACTER_LIMITS[platform];

  const submit = () => {
    const mediaUrls = mediaUrlsCsv
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSubmit({
      platform,
      caption,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : '',
      assignedTo,
      notes,
      mediaUrls,
    });
  };

  const runAi = () => {
    if (aiPrompt.trim().length < 3) {
      toast.error('Describe your post first');
      return;
    }
    startAi(async () => {
      const result = await generateCaptionAction({ platform, prompt: aiPrompt.trim() });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCaption(result.data.caption);
      setAiOpen(false);
      setAiPrompt('');
      toast.success('Caption generated');
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as PostPlatform)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {POST_PLATFORM_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="caption">Caption</Label>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[11px] ${caption.length > charLimit ? 'text-brand-danger' : 'text-text-muted'}`}>
              {caption.length}/{charLimit.toLocaleString('en-IN')}
            </span>
            <Button variant="outline" size="sm" type="button" onClick={() => setAiOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" />
              Generate
            </Button>
          </div>
        </div>
        <Textarea
          id="caption"
          rows={6}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption or use Generate to draft one with AI."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="scheduledAt">Schedule for</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Assign to</Label>
          <Select value={assignedTo || 'none'} onValueChange={(v) => setAssignedTo(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mediaUrls">Media URLs (comma-separated)</Label>
        <Textarea
          id="mediaUrls"
          rows={2}
          value={mediaUrlsCsv}
          onChange={(e) => setMediaUrlsCsv(e.target.value)}
          placeholder="https://… , https://…"
        />
        <p className="text-xs text-text-muted">
          Paste up to 10 image/video URLs. Native upload lands in a later pass — for now, host the files anywhere and drop the URLs here.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Editor instructions, references, etc."
        />
      </div>

      <Button size="lg" className="w-full" onClick={submit} loading={isPending}>
        {submitLabel}
      </Button>

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>AI caption helper</SheetTitle>
            <SheetDescription>
              Describe your post in a few words. We&apos;ll draft a caption tuned to {POST_PLATFORM_LABEL[platform]}.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-3 space-y-3">
            <Textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. New 3BHK launch in Powai with lake views, target young professionals"
            />
            <Button onClick={runAi} loading={aiPending} className="w-full" size="lg">
              <Sparkles className="h-4 w-4" />
              Generate caption
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
