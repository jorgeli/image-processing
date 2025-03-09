import { prisma } from "../config/prisma.js";
import { 
  CreateCollectionDtoType, 
  UpdateCollectionDtoType, 
  GetCollectionImagesQueryDtoType,
  CollectionResponseDtoType,
  CollectionWithImagesResponseDtoType
} from "../dtos/collection.dto.js";
import { v4 as uuidv4 } from 'uuid';
import { minio } from "../config/minio.js";

export const collectionService = {

  /**
   * Get all collections with optional filtering
   */
  getCollections: async (filter?: any): Promise<CollectionResponseDtoType[]> => {
    const collections = await prisma.collection.findMany({
      where: filter,
      include: {
        _count: {
          select: {
            images: true
          }
        }
      }
    });
    
    // Map to match the DTO structure
    return collections.map(collection => ({
      ...collection,
      imageCount: collection._count.images,
      _count: undefined // Remove the _count property
    }));
  },

  /**
   * Create a new collection
   */
  createCollection: async (data: CreateCollectionDtoType): Promise<CollectionResponseDtoType> => {
    const collection = await prisma.collection.create({
      data: {
        uuid: uuidv4(),
        name: data.name,
        description: data.description
      },
      include: {
        _count: {
          select: { images: true }
        }
      }
    });
    
    // Use destructuring to exclude _count
    const { _count, ...collectionData } = collection;
    
    return {
      ...collectionData,
      imageCount: _count.images
    };
  },

  /**
   * Update an existing collection
   */
  updateCollection: async (uuid: string, data: UpdateCollectionDtoType) => {
    return prisma.collection.update({
      where: { uuid: uuid },
      data: {
        name: data.name,
        description: data.description,
        updatedAt: new Date()
      }
    });
  },

  /**
   * Delete a collection
   */
  deleteCollection: async (uuid: string) => {
    return prisma.collection.delete({
      where: { uuid: uuid }
    });
  },

  /**
   * Add images to a collection
   */
  addImagesToCollection: async (collectionId: string, imageIds: string[]) => {
    // Create connections between collection and images
    const createPromises = imageIds.map(imageId => 
      prisma.thumbnailImage.update({
        where: { uuid: imageId },
        data: {
          collectionId: collectionId
        }
      })
    );
    return Promise.all(createPromises);
  },

  /**
   * Remove an image from a collection
   */
  removeImageFromCollection: async (collectionId: string, imageIds: string[]) => {
    return prisma.thumbnailImage.updateMany({
      where: { 
        uuid: { in: imageIds },
        collectionId: collectionId
      },
      data: {
        collectionId: null
      }
    });
  },

  /**
   * Get collection by UUID with images
   */
  getCollectionById: async (
    uuid: string, 
    imageQuery?: GetCollectionImagesQueryDtoType
  ): Promise<CollectionWithImagesResponseDtoType | null> => {
    // Default query parameters if not provided
    const page = imageQuery?.page ?? 1;
    const limit = imageQuery?.limit ?? 10;
    const sort = imageQuery?.sort ?? 'desc';
    const sortBy = imageQuery?.sortBy ?? 'createdAt';
    const search = imageQuery?.search ?? '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // First query: Get the collection with count
    const collection = await prisma.collection.findUnique({
      where: { uuid },
      include: {
        _count: {
          select: { images: true }
        }
      }
    });
    
    if (!collection) {
      return null;
    }
    
    // Second query: Get paginated images for this collection
    const imagesQuery = {
      where: {
        collectionId: collection.uuid,
        ...(search ? {
          OR: [
            { filename: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {})
      },
      select: {
        uuid: true,
        filename: true,
        description: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sort
      }
    };
    
    // Execute the images query
    const images = await prisma.thumbnailImage.findMany(imagesQuery);
    
    // For completed images, fetch the actual image data
    const imagesWithData = await Promise.all(
      images.map(async (image) => {
        if (image.status === "succeeded") {
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
    
    // Format the response
    const result = {
      ...collection,
      imageCount: collection._count.images,
      images: imagesWithData,
      pagination: {
        page,
        limit,
        totalItems: collection._count.images,
        totalPages: Math.ceil(collection._count.images / limit)
      }
    };
    
    return result;
  }
} 
