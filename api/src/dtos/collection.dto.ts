import { z } from "zod";

export const CollectionUuidDto = z.object({
  uuid: z.string().uuid()
});

// Create - Input for POST /collections
export const CreateCollectionDto = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional()
});

// Update - Input for PATCH /collections/:id
export const UpdateCollectionDto = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional()
});

// Add to collection - Input for POST /collections/:id/relationships/images
export const AddToCollectionDto = z.object({
  data: z.array(
    z.object({
      type: z.literal("images"),
      uuid: z.string().uuid()
    })
  )
});

// Delete from collection - Input for DELETE /collections/:id/relationships/images/:imageId
export const DeleteFromCollectionDto = z.object({
  data: z.array(
    z.object({
      type: z.literal("images"),
      uuid: z.string().uuid()
    })
  )
});

export const GetCollectionsQueryDto = z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
    search: z.string().optional()
});

// Types
export type CreateCollectionDtoType = z.infer<typeof CreateCollectionDto>;
export type UpdateCollectionDtoType = z.infer<typeof UpdateCollectionDto>;
export type AddToCollectionDtoType = z.infer<typeof AddToCollectionDto>;
export type DeleteFromCollectionDtoType = z.infer<typeof DeleteFromCollectionDto>;
export type GetCollectionsQueryDtoType = z.infer<typeof GetCollectionsQueryDto>;