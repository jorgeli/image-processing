import { prisma } from "../config/prisma.js";
import { CreateCollectionDtoType, UpdateCollectionDtoType } from "../dtos/collection.dto.js";
import { v4 as uuidv4 } from 'uuid';

export const collectionService = {

  /**
   * Get all collections with optional filtering
   */
  getCollections: async (filter?: any) => {
  return prisma.collection.findMany({
    where: filter,
    include: {
      _count: {
        select: {
          images: true
        }
      }
    }
  })
},


/**
 * Create a new collection
 */
  createCollection: async (data: CreateCollectionDtoType) => {
    return prisma.collection.create({
      data: {
        uuid: uuidv4(),
        name: data.name,
        description: data.description,
        createdAt: new Date()
    }
  });
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
 * Get collection using collection uuid, returns collection with image count
 */
  getCollectionById: async (uuid: string) => {
    // Otherwise get images for the specified collection
    return prisma.collection.findUnique({
      where: { uuid: uuid },
      include: {
        _count: {
          select: {
            images: true
          }
        }
      }
    });
  }
} 
