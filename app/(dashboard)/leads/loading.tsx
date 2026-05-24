import { Skeleton } from '@/components/ui/skeleton';
import { ListSkeleton } from '@/components/shared/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      <ListSkeleton count={6} />
    </div>
  );
}
