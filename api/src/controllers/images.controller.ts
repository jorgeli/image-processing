import { Request, Response, NextFunction, RequestHandler } from "express";
import { GetImagesQueryDtoType, ImageDtoType, PresignedUploadDtoType } from "../dtos/image.dto.js";
import { imageService } from "../services/image.service.js";
import multer from "multer";
import { imageUpload, MAX_FILE_SIZE, MIN_FILE_SIZE } from "../utils/upload.js";

/**
 * Starts image processing
 */
const processImage = async (req: Request, res: Response): Promise<void> => {
  try {
    await imageService.createProcessingTask(req.body as ImageDtoType);
    res.status(200).json({ message: "Processing started" });
  } catch (err) {
    if (err instanceof Error)
    {
      if (err.name == "ImageNotFoundError")
        res.status(404).json({
      status: "error",
      message: "Image not found in storage, please upload before process"
        })
    }
    console.error('Failed to process image:', err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Generates a presigned URL for image upload
 */
const getPresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.query as unknown as PresignedUploadDtoType;
    const response = await imageService.getPresignedUploadUrl(params);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
};

/**
 * Gets an image by ID
 */
const getImagebyId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    const image = await imageService.getImageById(uuid);
    
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    
    res.status(200).json(image);
  } catch (error) {
    console.error("Failed to get image:", error);
    res.status(500).json({ error: "Failed to get image" });
  }
};

/**
 * Deletes an image by ID
 */
const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uuid } = req.params;
    await imageService.deleteImageById(uuid);
    res.status(200).json({ message: "Image deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete image" });
  }
};

const getImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.query as unknown as GetImagesQueryDtoType;
    const images = await imageService.getImages(params);
    res.status(200).json(images);
  } catch (error) {
    console.error("Failed to get images:", error);
    res.status(500).json({ error: "Failed to get images" });
  }
}

/**
 * Handles direct file upload and processing
 */
const uploadAndProcessImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    
    const description = req.body.description;
    const result = await imageService.uploadAndProcessImage(req.file, description);
    
    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error in direct upload endpoint:", error);
    res.status(500).json({ 
      error: "Failed to upload and process image",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

const handleFileUpload: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  imageUpload.single('file')(req, res, function handleUploadResult(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ 
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
          });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      } else {
        res.status(415).json({ error: err.message });
        return;
      }
    }
    
    if (req.file && req.file.size <= MIN_FILE_SIZE) {
      res.status(400).json({ error: "File is empty" });
      return;
    }
    
    next();
  });
};

export { 
  processImage, 
  getPresignedUploadUrl as getPresignedUrl, 
  getImagebyId, 
  deleteImage, 
  getImages,
  uploadAndProcessImage,
  handleFileUpload
};