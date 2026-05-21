import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { Clock } from 'lucide-react';
import type { AttendanceRow, AttendanceStatus } from '@/lib/supabase/types';

interface AttendanceHistoryProps {
  rows: AttendanceRow[];
}

const STATUS_TONE: Record<AttendanceStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
  half_day: 'muted',
};

function hoursWorked(row: AttendanceRow): string {
  if (!row.check_in_time || !row.check_out_time) return '—';
  const ms = new Date(row.check_out_time).getTime() - new Date(row.check_in_time).getTime();
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

export function AttendanceHistory({ rows }: AttendanceHistoryProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-6 w-6" />}
        title="No history yet"
        description="Your check-ins will appear here."
      />
    );
  }
  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {format(new Date(row.date), 'EEE, d MMM yyyy')}
              </p>
              <p className="font-mono text-xs text-text-muted">
                {row.check_in_time ? format(new Date(row.check_in_time), 'h:mm a') : '—'}
                {row.check_out_time ? ` → ${format(new Date(row.check_out_time), 'h:mm a')}` : ' (still in)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-secondary">{hoursWorked(row)}</span>
              {row.status ? (
                <Badge variant={STATUS_TONE[row.status]}>{row.status.replace('_', ' ')}</Badge>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
