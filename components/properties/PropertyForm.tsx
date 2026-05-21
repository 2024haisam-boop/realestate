'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABEL,
} from '@/lib/constants';
import {
  propertyCreateSchema,
  type PropertyCreateInput,
} from '@/lib/validations/property.schema';

const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-furnished' },
  { value: 'fully_furnished', label: 'Fully furnished' },
] as const;

interface PropertyFormProps {
  defaultValues?: Partial<PropertyCreateInput>;
  isPending: boolean;
  submitLabel?: string;
  onSubmit: (values: PropertyCreateInput) => void;
}

export function PropertyForm({
  defaultValues,
  isPending,
  submitLabel = 'Save property',
  onSubmit,
}: PropertyFormProps) {
  const [amenities, setAmenities] = useState<string[]>(defaultValues?.amenities ?? []);
  const [amenityInput, setAmenityInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyCreateInput>({
    resolver: zodResolver(propertyCreateSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      location: defaultValues?.location ?? '',
      address: defaultValues?.address ?? '',
      propertyType: defaultValues?.propertyType ?? 'apartment',
      price: defaultValues?.price ?? 0,
      sizeSqft: defaultValues?.sizeSqft ?? undefined,
      bedrooms: defaultValues?.bedrooms ?? undefined,
      bathrooms: defaultValues?.bathrooms ?? undefined,
      floor: defaultValues?.floor ?? undefined,
      furnishing: defaultValues?.furnishing ?? 'unfurnished',
      status: defaultValues?.status ?? 'available',
      description: defaultValues?.description ?? '',
      developerName: defaultValues?.developerName ?? '',
      amenities: defaultValues?.amenities ?? [],
    },
  });

  const propertyType = watch('propertyType');
  const furnishing = watch('furnishing');
  const status = watch('status');

  const addAmenity = () => {
    const trimmed = amenityInput.trim();
    if (!trimmed) return;
    if (amenities.includes(trimmed)) {
      setAmenityInput('');
      return;
    }
    const next = [...amenities, trimmed];
    setAmenities(next);
    setValue('amenities', next, { shouldValidate: true });
    setAmenityInput('');
  };

  const removeAmenity = (a: string) => {
    const next = amenities.filter((x) => x !== a);
    setAmenities(next);
    setValue('amenities', next, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Prestige Heights — 3BHK" {...register('title')} />
        {errors.title ? <p className="text-xs text-brand-danger">{errors.title.message}</p> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="Gurgaon" {...register('location')} />
          {errors.location ? <p className="text-xs text-brand-danger">{errors.location.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Full address</Label>
          <Input id="address" placeholder="Sector 54, Golf Course Road" {...register('address')} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Property type</Label>
          <Select
            value={propertyType}
            onValueChange={(v) => setValue('propertyType', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {PROPERTY_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setValue('status', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROPERTY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROPERTY_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Furnishing</Label>
          <Select
            value={furnishing}
            onValueChange={(v) => setValue('furnishing', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FURNISHING_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" type="number" inputMode="numeric" {...register('price')} />
          {errors.price ? <p className="text-xs text-brand-danger">{errors.price.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sizeSqft">Size (sqft)</Label>
          <Input id="sizeSqft" type="number" inputMode="numeric" {...register('sizeSqft')} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input id="bedrooms" type="number" inputMode="numeric" {...register('bedrooms')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input id="bathrooms" type="number" inputMode="numeric" {...register('bathrooms')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="floor">Floor</Label>
          <Input id="floor" type="number" inputMode="numeric" {...register('floor')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="developerName">Developer</Label>
        <Input id="developerName" placeholder="Prestige Group" {...register('developerName')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Highlight what makes this property special"
          {...register('description')}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Amenities</Label>
        <div className="flex gap-2">
          <Input
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAmenity();
              }
            }}
            placeholder="Swimming Pool, Gym, Clubhouse…"
          />
          <Button type="button" variant="outline" onClick={addAmenity} className="shrink-0">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {amenities.map((a) => (
              <Badge key={a} variant="muted" className="flex items-center gap-1">
                {a}
                <button type="button" onClick={() => removeAmenity(a)} aria-label={`Remove ${a}`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
