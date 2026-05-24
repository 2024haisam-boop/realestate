import { Skeleton } from '@/components/ui/skeleton';
import { ListSkeleton } from '@/components/shared/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <ListSkeleton count={5} />
    </div>
  );
}
