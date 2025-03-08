import { v4 as uuidv4 } from 'uuid';
import { minio } from "../config/minio.js";
import { prisma } from "../config/prisma.js";
import { GetImagesQueryDtoType, ImageDtoType, ImageIdDtoType, PresignedUploadDtoType, PresignedUrlResponseDtoType } from "../dtos/image.dto.js";
import { sendJobToKafka } from "./kafka.service.js";
import dotenv from "dotenv";
import { ThumbnailImage } from '@prisma/client';
dotenv.config();



/**
* Service layer for image-related business logic
*/
export const imageService = {

  getImages: async (params: GetImagesQueryDtoType) => {
    // Parse string parameters to numbers
    const page = typeof params.page === 'string' ? parseInt(params.page, 10) : params.page;
    const limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit;
    
    const images = await prisma.thumbnailImage.findMany({
      where: {
        status: "completed",
        ...(params.search ? {
          OR: [
            { filename: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } }
          ]
        } : {}),
      },
      orderBy: {
        [params.sortBy]: params.sort === "asc" ? "asc" : "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // For completed images, fetch the actual image data
    const imagesWithData = await Promise.all(
      images.map(async (image) => {
        if (image.status === "completed") {
          try {
            // Get the image data directly from MinIO
            const dataStream = await minio.client.getObject(
              minio.processedBucketName,
              image.uuid
            );
            
            // Convert stream to buffer
            const chunks: Buffer[] = [];
            for await (const chunk of dataStream) {
              chunks.push(chunk);
            }
            const imageBuffer = Buffer.concat(chunks);
            
            // Convert to base64 for embedding in JSON
            const base64Image = imageBuffer.toString('base64');
            
            return {
              ...image,
              imageData: `data:image/jpeg;base64,${base64Image}`
            };
          } catch (error) {
            console.error(`Error fetching image data for ${image.uuid}:`, error);
            return image; // Return without image data if there's an error
          }
        }
        return image;
      })
    );

    return imagesWithData;
  },

  createProcessingTask: async (imageData: ImageDtoType) => {
    try {
      // Send to Kafka first
      await sendJobToKafka(imageData);
      
      console.log(`createProcessingTask ${imageData.uuid}`);
      // Create database record
      return prisma.thumbnailImage.create({
        data: {
          filename: imageData.filename,
          uuid: imageData.uuid,
          description: imageData.description ?? undefined,
          collectionId: null,
          createdAt: new Date(),
          completedAt: new Date(0),
          status: "pending",
        }
      });
    } catch (error) {
      console.error(`Failed to create processing task for ${imageData.uuid}:`, error);
      throw error;
    }
  },

  /**
   * Generates a presigned URL for image upload
   */
  getPresignedUploadUrl: async (_params: PresignedUploadDtoType): Promise<PresignedUrlResponseDtoType> => {
    const uuid = uuidv4();
    
    const presignedUrl = await minio.client.presignedPutObject(minio.uploadBucketName, uuid, 60);
    
    return {
        uuid,
        presignedUrl,
      } satisfies PresignedUrlResponseDtoType;
  },

  
  /**
   * Gets an image by its UUID
   */
  getImageById: async (uuid: string) => {
    const dbimage = await prisma.thumbnailImage.findUnique({
      where: { uuid: uuid },
    });
    
    if (!dbimage) {
      return null;
    }
    
    if (dbimage.status === "completed") {
      try {
        // Get the image data directly from MinIO
        const dataStream = await minio.client.getObject(
          minio.processedBucketName,
          uuid
        );
        
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of dataStream) {
          chunks.push(chunk);
        }
        const imageBuffer = Buffer.concat(chunks);
        
        // Convert to base64 for embedding in JSON
        const base64Image = imageBuffer.toString('base64');
        
        return {
          ...dbimage,
          imageData: `data:image/jpeg;base64,${base64Image}`
        };
      } catch (error) {
        console.error(`Error fetching image data for ${uuid}:`, error);
        return dbimage; // Return without image data if there's an error
      }
    }
    
    return dbimage;
  },

  /**
   * Deletes an image by its UUID
   */
  deleteImageById: async (uuid: string) => {
    const image: ThumbnailImage | null = await prisma.thumbnailImage.findUnique({
      where: { uuid: uuid },
    });

    if (!image) {
      throw new Error("Image not found");
    }

    // Delete from database first
    const dbResult = await prisma.thumbnailImage.delete({
      where: { uuid: uuid },
    });
    
    // Then delete from completed bucket
    try {
      await  minio.client.removeObject(minio.processedBucketName, image.uuid);
    } catch (err) {
      console.warn(`Could not delete from completed bucket: ${image.uuid}`);
    }
    
    // Return the database deletion result
    return dbResult;
  },

  /**
   * Direct file upload and processing
   * This method handles both uploading the file to MinIO and starting the processing
   */
  uploadAndProcessImage: async (file: Express.Multer.File, description?: string) => {
    // Generate a UUID for the image
    const uuid = uuidv4();
    const filename = file.originalname;
    const startTime = Date.now();
    
    console.log(`[${new Date().toISOString()}] Starting direct upload for ${uuid}`);
    
    try {
      // 1. Upload the file to MinIO
      console.log(`[${new Date().toISOString()}] Uploading file to MinIO, size: ${file.size} bytes`);
      const minioStartTime = Date.now();
      await minio.client.putObject(
        minio.uploadBucketName,
        uuid,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );
      console.log(`[${new Date().toISOString()}] File uploaded to MinIO, time: ${Date.now() - minioStartTime}ms`);
      
      // 2. Create image data for processing
      const imageData: ImageDtoType = {
        uuid,
        filename,
        description
      };
      
      // 3. Create database record and send to Kafka (reusing existing method)
      console.log(`[${new Date().toISOString()}] Creating processing task`);
      const taskStartTime = Date.now();
      await imageService.createProcessingTask(imageData);
      console.log(`[${new Date().toISOString()}] Processing task created, time: ${Date.now() - taskStartTime}ms`);
      
      console.log(`[${new Date().toISOString()}] Direct upload and processing started for ${uuid}, total time: ${Date.now() - startTime}ms`);
      
      return {
        uuid,
        filename,
        status: "pending",
        message: "Upload successful and processing started"
      };
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in direct upload and process:`, error);
      throw error;
    }
  },

  /**
   * Checks if an image with the given UUID exists
   */
  imageExists: async (uuid: string): Promise<boolean> => {
    const count = await prisma.thumbnailImage.count({
      where: { uuid }
    });
    return count > 0;
  },
}