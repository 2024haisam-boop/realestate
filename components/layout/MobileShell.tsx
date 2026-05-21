import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

interface MobileShellProps {
  userId: string;
  userName: string;
  topBarRight?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Mobile-first shell:
 *   - Fixed 56px TopBar (reads title from the UI store; pages set it via
 *     <SetPageTitle />)
 *   - Hidden Sidebar on mobile, fixed left rail on md+ desktop
 *   - Fixed 60px BottomNav on mobile, hidden on md+
 *   - Content area centred with safe paddings on both axes
 */
export function MobileShell({ userId, userName, topBarRight, children }: MobileShellProps) {
  return (
    <div className="min-h-dvh bg-surface-2">
      <TopBar userId={userId} userName={userName} rightSlot={topBarRight} />
      <Sidebar />
      <main className="pb-[76px] pt-14 md:pb-6 md:pl-64">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 md:max-w-6xl md:px-8 md:py-7 page-enter">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
