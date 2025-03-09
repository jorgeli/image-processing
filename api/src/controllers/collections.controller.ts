import { Request, Response } from "express";
import { 
  CreateCollectionDtoType,
  UpdateCollectionDtoType,
  AddToCollectionDtoType,
  DeleteFromCollectionDtoType
} from "../dtos/collection.dto.js";

import { 
  collectionService
} from "../services/collection.service.js";


/**
 * Get all collections
 */
export const getCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await collectionService.getCollections(req.query.filter);
    res.status(200).json({ data: collections });
  } catch (error) {
    console.error('Failed to get collections:', error);
    res.status(500).json({ errors: [{ title: "Failed to get collections" }] });
  }
};

/**
 * Get collection by ID
 */
export const getCollectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    const collection = await collectionService.getCollectionById(uuid);
    
    if (!collection) {
      res.status(404).json({ errors: [{ title: "Collection not found" }] });
      return;
    }
    
    res.status(200).json({ data: collection });
  } catch (error) {
    console.error('Failed to get collection:', error);
    res.status(500).json({ errors: [{ title: "Failed to get collection" }] });
  }
};

/**
 * Create new collection
 */
export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const collection = await collectionService.createCollection(req.body as CreateCollectionDtoType);
    res.status(201).json({ data: collection });
  } catch (error) {
    console.error('Failed to create collection:', error);
    res.status(500).json({ errors: [{ title: "Failed to create collection" }] });
  }
};

/**
 * Update collection
 */
export const updateCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    const updatedCollection = await collectionService.updateCollection(
      uuid, 
      req.body as UpdateCollectionDtoType
    );
    
    res.status(200).json({ data: updatedCollection });
  } catch (error) {
    console.error('Failed to update collection:', error);
    res.status(500).json({ errors: [{ title: "Failed to update collection" }] });
  }
};

/**
 * Delete collection
 */
export const deleteCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    
    // Check if collection has images
    const collection = await collectionService.getCollectionById(uuid);
    

    if (collection?.imageCount && collection.imageCount > 0) {
      res.status(409).json({ 
        errors: [{ 
          title: "Cannot delete non-empty collection", 
          detail: "Remove all images from the collection before deleting it"
        }] 
      });
    } else {
      await collectionService.deleteCollection(uuid);
      res.status(200).json({ meta: { message: "Collection deleted successfully" } });
    }
  } catch (error) {
    console.error('Failed to delete collection:', error);
    res.status(500).json({ errors: [{ title: "Failed to delete collection" }] });
  }
};

/**
 * Add images to collection (JSON:API relationship endpoint)
 */
export const addToCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    const { data } = req.body as AddToCollectionDtoType;
    
    // Extract image IDs from the relationship data
    const imageIds = data.map(item => item.uuid);
    
    await collectionService.addImagesToCollection(uuid, imageIds);
    res.status(200).json({ meta: { message: "Images added to collection" } });
  } catch (error) {
    console.error('Failed to add images to collection:', error);
    res.status(500).json({ errors: [{ title: "Failed to update relationship" }] });
  }
};

/**
 * Remove image from collection (JSON:API relationship endpoint)
 */
export const deleteFromCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data } = req.body as DeleteFromCollectionDtoType;
    
    // Extract image IDs from the relationship data
    const imageIds = data.map(item => item.uuid);
    
    await collectionService.removeImageFromCollection(id, imageIds);
    res.status(200).json({ meta: { message: "Image removed from collection" } });
  } catch (error) {
    console.error('Failed to remove image from collection:', error);
    res.status(500).json({ errors: [{ title: "Failed to remove relationship" }] });
  }
};


