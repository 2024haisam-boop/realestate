import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { SetPageTitle } from '@/components/shared/SetPageTitle';
import { CheckInButton } from '@/components/attendance/CheckInButton';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';
import { OrgAttendanceTable } from '@/components/attendance/OrgAttendanceTable';
import { OrgDatePicker } from './org-date-picker';
import { requireSessionUser } from '@/lib/db/users';
import {
  getTodayAttendance,
  listOrgAttendanceForDate,
  listUserAttendance,
} from '@/lib/db/attendance';
import { todayISO } from '@/lib/services/attendanceService';
import { isManagerial } from '@/lib/constants';

type SP = Record<string, string | string[] | undefined>;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const me = await requireSessionUser();
  const sp = await searchParams;
  const orgDate = typeof sp.date === 'string' ? sp.date : todayISO();
  const showOrgView = isManagerial(me.role);

  const today = await getTodayAttendance(me.id, todayISO());
  const myHistory = await listUserAttendance(me.id, 30);
  const orgRows = showOrgView ? await listOrgAttendanceForDate(me.organizationId, orgDate) : [];

  return (
    <div className="space-y-5">
      <SetPageTitle title="Attendance" subtitle={showOrgView ? 'team view' : 'personal'} />
      <PageHeader
        title="Attendance"
        description={
          showOrgView
            ? 'Check in for the day, then review the team roster below.'
            : 'GPS-based check in and check out.'
        }
      />

      <CheckInButton today={today} />

      {showOrgView ? (
        <Tabs defaultValue="me">
          <TabsList className="w-full justify-start gap-1 overflow-x-auto bg-surface-2 p-1 scrollbar-hide sm:w-auto">
            <TabsTrigger value="me">My history</TabsTrigger>
            <TabsTrigger value="team">Team ({orgRows.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="me">
            <Card className="mt-3">
              <CardHeader>
                <CardTitle className="text-base">Last 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceHistory rows={myHistory} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team">
            <Card className="mt-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Team attendance</CardTitle>
                  <CardDescription>Pick a date to view the roster.</CardDescription>
                </div>
                <OrgDatePicker defaultDate={orgDate} />
              </CardHeader>
              <CardContent>
                <OrgAttendanceTable rows={orgRows} dateLabel={orgDate} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceHistory rows={myHistory} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
