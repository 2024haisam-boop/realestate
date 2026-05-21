'use client';

import { format, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { BarChart2 } from 'lucide-react';
import { initialsFromName } from '@/lib/utils';
import type {
  AgentRow,
  CompletionPoint,
  FunnelStage,
  PropertyShareCount,
  SourceCount,
  StatusCount,
} from '@/lib/db/reports';

const PALETTE = [
  '#0F4C81',
  '#F97316',
  '#16A34A',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#0EA5E9',
  '#475569',
  '#EC4899',
];

function NoData() {
  return (
    <EmptyState
      icon={<BarChart2 className="h-6 w-6" />}
      title="No data for this range"
      description="Try widening the date range above."
    />
  );
}

export function LeadsBySourceChart({ data }: { data: SourceCount[] }) {
  if (data.length === 0) return <NoData />;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ fill: 'rgba(15, 76, 129, 0.08)' }} />
          <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadsByStatusChart({ data }: { data: StatusCount[] }) {
  if (data.length === 0) return <NoData />;
  const total = data.reduce((sum, x) => sum + x.count, 0) || 1;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            iconSize={8}
            formatter={(_, entry) => {
              // Recharts feeds the payload through `entry.payload`.
              const p = entry?.payload as { label?: string; count?: number } | undefined;
              if (!p) return '';
              return `${p.label} · ${p.count} (${Math.round(((p.count ?? 0) / total) * 100)}%)`;
            }}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FollowupCompletionChart({ data }: { data: CompletionPoint[] }) {
  if (data.length === 0) return <NoData />;
  const points = data.map((p) => ({
    date: p.date,
    label: format(parseISO(p.date), 'd MMM'),
    pct: p.pct,
    completed: p.completed,
    due: p.due,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Completion']}
            labelFormatter={(l) => `Date: ${l}`}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="#0F4C81"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="% completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PropertiesSharedChart({ data }: { data: PropertyShareCount[] }) {
  if (data.length === 0) return <NoData />;
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis dataKey="title" type="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }} />
          <Bar dataKey="count" name="Shares" radius={[0, 6, 6, 0]} fill="#F97316" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WonLostFunnelChart({ data }: { data: FunnelStage[] }) {
  if (data.every((s) => s.count === 0)) return <NoData />;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ fill: 'rgba(15, 76, 129, 0.08)' }} />
          <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgentPerformanceTable({ data }: { data: AgentRow[] }) {
  if (data.length === 0) return <NoData />;
  return (
    <div className="space-y-3">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="agentName" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="leadsAssigned" name="Leads" stackId="a" fill="#0F4C81" />
            <Bar dataKey="wonLeads" name="Won" stackId="b" fill="#16A34A" />
            <Bar dataKey="callsConnected" name="Calls connected" stackId="c" fill="#F97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Calls</TableHead>
            <TableHead className="text-right">Connected</TableHead>
            <TableHead className="text-right">Follow-ups</TableHead>
            <TableHead className="text-right">Won</TableHead>
            <TableHead className="text-right">Conv %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.agentId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">{initialsFromName(row.agentName)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{row.agentName}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">{row.leadsAssigned}</TableCell>
              <TableCell className="text-right font-mono">{row.callsMade}</TableCell>
              <TableCell className="text-right font-mono">{row.callsConnected}</TableCell>
              <TableCell className="text-right font-mono">{row.followupsCompleted}</TableCell>
              <TableCell className="text-right font-mono">{row.wonLeads}</TableCell>
              <TableCell className="text-right">
                <Badge variant={row.conversionRate >= 20 ? 'success' : 'muted'}>
                  {row.conversionRate}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
