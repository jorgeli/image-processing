import express from "express";
import { 
  getImagebyId, 
  deleteImage, 
  processImage, 
  getPresignedUrl, 
  getImages,
  uploadAndProcessImage,
  handleFileUpload
} from "../controllers/images.controller.js";
import { 
  ImageIdDto, 
  ImageDto, 
  PresignedUploadDto, 
  GetImagesQueryDto,
  DirectUploadDto 
} from "../dtos/image.dto.js";
import { validate } from "../middleware/validate.js";

export const imageRouter = express.Router();


/**
 * @swagger
 * /api/v1/images/actions/presigned-url:
 *   get:
 *     summary: Get presigned URL for upload
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: extension
 *         required: true
 *         schema:
 *           type: string
 *           enum: [jpg, jpeg, png, gif, webp, svg, avif, tiff]
 *         description: The file extension for the image
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uuid:
 *                   type: string
 *                 presignedUrl:
 *                   type: string
 *                 uniqueFilename:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
imageRouter.get("/actions/upload-url", validate(PresignedUploadDto, "query"), getPresignedUrl);


/**
 * @swagger
 * /api/v1/images/actions/process:
 *   post:
 *     summary: Process an image
 *     description: Sends the image data to Kafka for asynchronous processing
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uuid
 *               - path
 *               - filename
 *             properties:
 *               uuid:
 *                 type: string
 *                 format: uuid
 *                 description: Unique identifier for the image
 *               path:
 *                 type: string
 *                 description: Path or URL to the image
 *               filename:
 *                 type: string
 *                 description: Name of the image file
 *               description:
 *                 type: string
 *                 description: Optional description of the image
 *     responses:
 *       200:
 *         description: Image processing started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Processing started"
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
imageRouter.post("/actions/process", validate(ImageDto), processImage);


/**
 * @swagger
 * /api/v1/images/actions/upload:
 *   post:
 *     summary: Upload and process an image in one step
 *     description: Uploads an image directly and starts processing
 *     tags: [Images]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: The image file to upload (max 10MB, formats jpg, jpeg, png, gif, webp, svg, avif, tiff)
 *       - in: formData
 *         name: description
 *         type: string
 *         required: false
 *         description: Optional description for the image
 *     responses:
 *       200:
 *         description: Upload successful and processing started
 *       400:
 *         description: Invalid input or file type
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported file type
 *       500:
 *         description: Server error
 */
imageRouter.post("/actions/upload", handleFileUpload, validate(DirectUploadDto), uploadAndProcessImage);



/**
 * @swagger
 * /api/v1/images/{uuid}:
 *   get:
 *     summary: Get image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image unique identifier
 *     responses:
 *       200:
 *         description: The image resource with embedded base64 image data if completed
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
imageRouter.get("/:uuid", validate(ImageIdDto, "params"), getImagebyId);

/**
 * @swagger
 * /api/v1/images/{uuid}:
 *   delete:
 *     summary: Delete image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image unique identifier
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
imageRouter.delete("/:uuid", validate(ImageIdDto, "params"), deleteImage);


/**
 * @swagger
 * /api/v1/images:
 *   get:
 *     summary: List all images
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: true
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: true
 *         description: Sort direction
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt]
 *         required: true
 *         description: Field to sort by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter results
 *     responses:
 *       200:
 *         description: List of images with embedded base64 image data for completed thumbnails
 *       500:
 *         description: Server error
 */
imageRouter.get("/", validate(GetImagesQueryDto, "query"), getImages);

