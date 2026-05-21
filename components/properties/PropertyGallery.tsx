'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyImageRow } from '@/lib/supabase/types';

interface PropertyGalleryProps {
  images: PropertyImageRow[];
  title: string;
}

/**
 * Swipeable, snap-scrolled property gallery.
 * - Mobile: horizontal scroll with snap points (browser-native swipe).
 * - Desktop: same layout + prev/next chevrons + thumbnail strip.
 */
export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const sorted = useMemo(
    () =>
      [...images].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.display_order - b.display_order;
      }),
    [images],
  );

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children.item(index) as HTMLElement | null;
    if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const width = el.clientWidth;
      if (width > 0) {
        const idx = Math.round(el.scrollLeft / width);
        setActiveIndex(idx);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-border bg-surface-2 text-text-muted">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex aspect-[16/10] w-full snap-x snap-mandatory overflow-x-auto rounded-xl border border-border bg-surface-2 scrollbar-hide"
        >
          {sorted.map((img, i) => (
            <div key={img.id} className="relative h-full w-full shrink-0 snap-start">
              <Image
                src={img.public_url}
                alt={`${title} — photo ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
                priority={i === 0}
                unoptimized
              />
            </div>
          ))}
        </div>

        {sorted.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-opacity hover:bg-black/75 md:block"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(sorted.length - 1, activeIndex + 1))}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-opacity hover:bg-black/75 md:block"
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 px-2 py-1">
              {sorted.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    i === activeIndex ? 'bg-white' : 'bg-white/50',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {sorted.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => scrollTo(i)}
              className={cn(
                'relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                i === activeIndex ? 'border-brand-primary' : 'border-transparent',
              )}
            >
              <Image
                src={img.public_url}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
