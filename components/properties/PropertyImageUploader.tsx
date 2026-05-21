'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, Trash2, Star, StarOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  removePropertyImageAction,
  setPrimaryImageAction,
  uploadPropertyImagesAction,
} from '@/app/(dashboard)/properties/actions';
import type { PropertyImageRow } from '@/lib/supabase/types';

interface PropertyImageUploaderProps {
  propertyId: string;
  images: PropertyImageRow[];
}

export function PropertyImageUploader({ propertyId, images }: PropertyImageUploaderProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [previewing, setPreviewing] = useState<File[]>([]);

  const upload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setPreviewing(list);

    startTransition(async () => {
      const fd = new FormData();
      fd.set('propertyId', propertyId);
      if (images.length === 0) fd.set('setFirstAsPrimary', 'true');
      list.forEach((f) => fd.append('files', f));

      const result = await uploadPropertyImagesAction(fd);
      setPreviewing([]);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Uploaded ${result.data.uploaded} photo${result.data.uploaded === 1 ? '' : 's'}`);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  };

  const setPrimary = (imageId: string) => {
    startTransition(async () => {
      const result = await setPrimaryImageAction({ propertyId, imageId });
      if (!result.success) toast.error(result.error);
      else {
        toast.success('Primary photo updated');
        router.refresh();
      }
    });
  };

  const removeImage = (image: PropertyImageRow) => {
    startTransition(async () => {
      const result = await removePropertyImageAction({
        imageId: image.id,
        storagePath: image.storage_path,
        propertyId,
      });
      if (!result.success) toast.error(result.error);
      else {
        toast.success('Photo removed');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-primary">
          Photos {images.length > 0 ? `(${images.length})` : ''}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          loading={isPending}
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {previewing.length > 0 ? (
        <p className="text-xs text-text-muted">Uploading {previewing.length}…</p>
      ) : null}

      {images.length === 0 ? (
        <Card className="border-dashed bg-surface-2 p-6 text-center">
          <p className="text-sm text-text-secondary">
            No photos yet. Upload at least one — it&apos;ll be set as the primary photo automatically.
          </p>
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <li key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-2">
              <Image src={img.public_url} alt="" fill sizes="180px" className="object-cover" unoptimized />
              {img.is_primary ? (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-medium uppercase text-white">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-black/55 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.is_primary ? (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    className="rounded p-1 text-white hover:bg-white/15"
                    aria-label="Set as primary"
                  >
                    <StarOff className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <ConfirmDialog
                  title="Remove this photo?"
                  description="This permanently deletes the file from storage."
                  confirmLabel="Remove"
                  onConfirm={() => removeImage(img)}
                  trigger={
                    <button
                      type="button"
                      className="rounded p-1 text-white hover:bg-white/15"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
