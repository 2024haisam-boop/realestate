'use client';

import { useTransition } from 'react';
import { Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { initialsFromName } from '@/lib/utils';
import { ROLE_LABEL, ROLES } from '@/lib/constants';
import type { AppRole, ProfileRow } from '@/lib/supabase/types';
import { removeMemberAction, updateMemberAction } from './actions';

interface TeamListProps {
  members: ProfileRow[];
  currentUserId: string;
  canManage: boolean;
}

export function TeamList({ members, currentUserId, canManage }: TeamListProps) {
  const [isPending, startTransition] = useTransition();

  const updateMember = (memberId: string, patch: Parameters<typeof updateMemberAction>[0]) => {
    startTransition(async () => {
      const result = await updateMemberAction({ ...patch, memberId });
      if (!result.success) toast.error(result.error);
      else toast.success('Member updated');
    });
  };

  const removeMember = (memberId: string) => {
    startTransition(async () => {
      const result = await removeMemberAction(memberId);
      if (!result.success) toast.error(result.error);
      else toast.success('Member removed');
    });
  };

  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {members.map((member) => {
          const isSelf = member.id === currentUserId;
          return (
            <div
              key={member.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initialsFromName(member.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {member.full_name}
                    </p>
                    {isSelf ? (
                      <Badge variant="muted" className="text-[10px] uppercase">You</Badge>
                    ) : null}
                    {!member.is_active ? (
                      <Badge variant="danger" className="text-[10px] uppercase">Inactive</Badge>
                    ) : null}
                  </div>
                  {member.phone ? (
                    <p className="font-mono text-xs text-text-muted">{member.phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                {canManage ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      updateMember(member.id, { memberId: member.id, role: value as AppRole })
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-9 w-44 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="info">{ROLE_LABEL[member.role]}</Badge>
                )}

                {canManage ? (
                  <label className="flex items-center gap-2 text-xs text-text-secondary">
                    <Switch
                      checked={member.is_active}
                      onCheckedChange={(v) =>
                        updateMember(member.id, { memberId: member.id, isActive: v })
                      }
                      disabled={isPending || isSelf}
                    />
                    <Power className="h-3.5 w-3.5" /> Active
                  </label>
                ) : null}

                {canManage && !isSelf ? (
                  <ConfirmDialog
                    title={`Remove ${member.full_name}?`}
                    description="They will lose access to this workspace immediately. This cannot be undone."
                    confirmLabel="Remove"
                    onConfirm={() => removeMember(member.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="text-brand-danger">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
