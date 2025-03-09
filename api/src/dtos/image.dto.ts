import { z } from "zod";

// Input DTO - Used when processing an image (POST)
export const ImageDto = z.object({
    uuid: z.string().uuid(),
    filename: z.string(),
    description: z.string().optional(),
});

export const ImageUpdateDto = z.object({
    uuid: z.string().uuid(),
    completedAt: z.date(),
    status: z.string(),
});

export const ImageIdDto = z.object({
    uuid: z.string().uuid()
});

export const PresignedUploadDto = z.object({
    extension: z.enum(["jpg", "jpeg", "png", "gif", "avif", "tiff", "webp", "svg"]),
});

// Response DTO for presigned URL endpoint
export const PresignedUrlResponseDto = z.object({
  uuid: z.string().uuid(),
  presignedUrl: z.string().url()
});

export const GetImagesQueryDto = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sort: z.enum(["asc", "desc"]).optional().default("desc"),
  sortBy: z.enum(["createdAt"]).optional().default("createdAt"),
  search: z.string().optional()
});

// Direct upload DTO
export const DirectUploadDto = z.object({
  description: z.string().optional(),
  // File validation will be handled by multer middleware
});

// Response types
export const ThumbnailImageDto = z.object({
  uuid: z.string().uuid(),
  filename: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
  imageData: z.string().optional()
});

export const ImageListResponseDto = z.object({
  images: z.array(ThumbnailImageDto),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number()
  })
});

export type ImageDtoType = z.infer<typeof ImageDto>;
export type ImageIdDtoType = z.infer<typeof ImageIdDto>;
export type PresignedUploadDtoType = z.infer<typeof PresignedUploadDto>;
export type PresignedUrlResponseDtoType = z.infer<typeof PresignedUrlResponseDto>;
export type ImageUpdateDtoType = z.infer<typeof ImageUpdateDto>;
export type GetImagesQueryDtoType = z.infer<typeof GetImagesQueryDto>;
export type DirectUploadDtoType = z.infer<typeof DirectUploadDto>;
export type ThumbnailImageDtoType = z.infer<typeof ThumbnailImageDto>;
export type ImageListResponseDtoType = z.infer<typeof ImageListResponseDto>;