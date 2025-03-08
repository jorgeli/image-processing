import { z } from "zod";

export const KafkaProcessImageDto = z.object({
    uuid: z.string().uuid(),
    startTime: z.number()
});

export const KafkaCompleteImageDto = z.object({
    uuid: z.string().uuid(),
    success: z.boolean(),
    error: z.string().optional(),
    processingTime: z.number()
});

export type KafkaProcessImageDtoType = z.infer<typeof KafkaProcessImageDto>;
export type KafkaCompleteImageDtoType = z.infer<typeof KafkaCompleteImageDto>;