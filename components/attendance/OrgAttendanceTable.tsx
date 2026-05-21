'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, MapPin } from 'lucide-react';
import { initialsFromName } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/supabase/types';
import type { AttendanceWithUser } from '@/lib/db/attendance';

interface OrgAttendanceTableProps {
  rows: AttendanceWithUser[];
  dateLabel: string;
}

const STATUS_TONE: Record<AttendanceStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
  half_day: 'muted',
};

function hoursWorked(row: AttendanceWithUser): string {
  if (!row.check_in_time || !row.check_out_time) return '—';
  const ms = new Date(row.check_out_time).getTime() - new Date(row.check_in_time).getTime();
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function toCSV(rows: AttendanceWithUser[]): string {
  const header = ['Name', 'Check-in', 'Check-out', 'Status', 'Hours', 'Check-in Lat', 'Check-in Lng'];
  const lines = rows.map((r) =>
    [
      r.user?.full_name ?? '',
      r.check_in_time ?? '',
      r.check_out_time ?? '',
      r.status ?? '',
      hoursWorked(r),
      r.check_in_lat ?? '',
      r.check_in_lng ?? '',
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function OrgAttendanceTable({ rows, dateLabel }: OrgAttendanceTableProps) {
  const csv = useMemo(() => toCSV(rows), [rows]);
  const downloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${dateLabel}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button onClick={downloadCsv} variant="outline" size="sm" disabled={rows.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Map</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-text-muted">
                No attendance for this date.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">
                        {initialsFromName(row.user?.full_name ?? '')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{row.user?.full_name ?? '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.check_in_time ? format(new Date(row.check_in_time), 'h:mm a') : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.check_out_time ? format(new Date(row.check_out_time), 'h:mm a') : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs">{hoursWorked(row)}</TableCell>
                <TableCell>
                  {row.status ? (
                    <Badge variant={STATUS_TONE[row.status]}>{row.status.replace('_', ' ')}</Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {row.check_in_lat != null && row.check_in_lng != null ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${row.check_in_lat},${row.check_in_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
                    >
                      <MapPin className="h-3 w-3" /> Open
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
