import { z } from 'zod';

export const createPartnerRequestSchema = z.object({
  message: z.string().max(500).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'open']).optional(),
});

export type CreatePartnerRequestInput = z.infer<typeof createPartnerRequestSchema>;
