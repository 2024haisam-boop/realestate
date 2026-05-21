import { z } from 'zod';

export const checkInSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  selfieDataUrl: z.string().max(5_000_000).optional(),
  notes: z.string().max(500).optional(),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type CheckOutInput = z.infer<typeof checkOutSchema>;
