import { z } from "zod";
import { ThumbnailImageDto } from "./image.dto.js";

export const CollectionUuidDto = z.object({
  uuid: z.string().uuid()
});

// Create - Input for POST /collections
export const CreateCollectionDto = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional()
});

// Update - Input for PATCH /collections/:id
export const UpdateCollectionDto = z.object({
  name: z.string().min(2).max(255).optional(),
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
    limit: z.coerce.number().max(100).optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
    search: z.string().optional()
});

// New DTO for querying images within a collection
export const GetCollectionImagesQueryDto = z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.enum(["createdAt", "filename", "status"]).optional().default("createdAt"),
    search: z.string().optional()
});

// Response types
export const CollectionResponseDto = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  imageCount: z.number()
});

export const CollectionWithImagesResponseDto = CollectionResponseDto.extend({
  images: z.array(ThumbnailImageDto),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number()
  })
});

// Types
export type CreateCollectionDtoType = z.infer<typeof CreateCollectionDto>;
export type UpdateCollectionDtoType = z.infer<typeof UpdateCollectionDto>;
export type AddToCollectionDtoType = z.infer<typeof AddToCollectionDto>;
export type DeleteFromCollectionDtoType = z.infer<typeof DeleteFromCollectionDto>;
export type GetCollectionsQueryDtoType = z.infer<typeof GetCollectionsQueryDto>;
export type GetCollectionImagesQueryDtoType = z.infer<typeof GetCollectionImagesQueryDto>;

// New response type exports
export type CollectionResponseDtoType = z.infer<typeof CollectionResponseDto>;
export type CollectionWithImagesResponseDtoType = z.infer<typeof CollectionWithImagesResponseDto>;