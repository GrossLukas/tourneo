import { z } from 'zod';

export const postChatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});

export type PostChatMessageInput = z.infer<typeof postChatMessageSchema>;
