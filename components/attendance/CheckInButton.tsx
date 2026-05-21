'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, LogIn, LogOut, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  checkInAction,
  checkOutAction,
} from '@/app/(dashboard)/attendance/actions';
import type { AttendanceRow } from '@/lib/supabase/types';

interface CheckInButtonProps {
  today: AttendanceRow | null;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported on this device'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 60_000,
    });
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CheckInButton({ today }: CheckInButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selfie, setSelfie] = useState<{ file: File; preview: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const hasCheckedIn = !!today?.check_in_time;
  const hasCheckedOut = !!today?.check_out_time;

  const handleSelfie = async (file: File | null) => {
    if (!file) return setSelfie(null);
    if (file.size > 4_500_000) {
      toast.error('Selfie must be under 4.5 MB');
      return;
    }
    const preview = await fileToDataUrl(file);
    setSelfie({ file, preview });
  };

  const submitCheckIn = () => {
    startTransition(async () => {
      let position: GeolocationPosition;
      try {
        position = await getPosition();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Location access required for check-in');
        return;
      }

      const selfieDataUrl = selfie ? await fileToDataUrl(selfie.file) : undefined;
      const result = await checkInAction({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        selfieDataUrl,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.data.status === 'late' ? 'Checked in (late)' : 'Checked in (present)',
      );
      setSelfie(null);
      setOpen(false);
      router.refresh();
    });
  };

  const submitCheckOut = () => {
    startTransition(async () => {
      let position: GeolocationPosition;
      try {
        position = await getPosition();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Location access required for check-out');
        return;
      }
      const result = await checkOutAction({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Checked out');
      router.refresh();
    });
  };

  if (hasCheckedOut && today) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-5">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-text-primary">Done for the day</p>
            <p className="text-xs text-text-muted">
              In: <span className="font-mono">{new Date(today.check_in_time!).toLocaleTimeString('en-IN')}</span> ·
              Out: <span className="font-mono">{new Date(today.check_out_time!).toLocaleTimeString('en-IN')}</span>
            </p>
          </div>
          <Badge variant="success">Checked out</Badge>
        </CardContent>
      </Card>
    );
  }

  if (hasCheckedIn && today) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-5">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-text-primary">You&apos;re checked in</p>
            <p className="text-xs text-text-muted">
              Since <span className="font-mono">{new Date(today.check_in_time!).toLocaleTimeString('en-IN')}</span>
              {today.status === 'late' ? ' · Late' : ''}
            </p>
          </div>
          <Button onClick={submitCheckOut} loading={isPending} variant="outline">
            <LogOut className="h-4 w-4" />
            Check out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="w-full">
          <LogIn className="h-4 w-4" />
          Check in
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Confirm check-in</SheetTitle>
          <SheetDescription>
            We&apos;ll capture your location and (optionally) a selfie. Make sure you&apos;re at the right
            site before confirming.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-xs text-text-secondary">
            <MapPin className="h-3.5 w-3.5" />
            Location access will be requested when you press Confirm.
          </div>

          {selfie ? (
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border">
              <Image src={selfie.preview} alt="selfie preview" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setSelfie(null)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white"
                aria-label="Remove selfie"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Add selfie (optional)
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleSelfie(e.target.files?.[0] ?? null)}
          />
        </div>

        <SheetFooter className="mt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submitCheckIn} loading={isPending}>
            <LogIn className="h-4 w-4" />
            Confirm check-in
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
