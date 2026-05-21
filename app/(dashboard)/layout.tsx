import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/db/users';
import { MobileShell } from '@/components/layout/MobileShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <MobileShell userId={user.id} userName={user.fullName}>
      {children}
    </MobileShell>
  );
}
