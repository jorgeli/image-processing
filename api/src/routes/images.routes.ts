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
 *                   format: uuid
 *                 presignedUrl:
 *                   type: string
 *                   format: url
 *             example:
 *               uuid: "a8b7c6d5-e4f3-2g1h-0i9j-8k7l6m5n4o3p"
 *               presignedUrl: "http://minio:9000/upload-images/a8b7c6d5-e4f3-2g1h-0i9j-8k7l6m5n4o3p?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
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
 *               - filename
 *             properties:
 *               uuid:
 *                 type: string
 *                 format: uuid
 *                 description: Unique identifier for the image
 *               filename:
 *                 type: string
 *                 description: Name of the image file
 *               description:
 *                 type: string
 *                 description: Optional description of the image
 *           example:
 *             uuid: "76466f50-10e5-46b6-a7ec-9b8c1721392a"
 *             filename: "vacation-photo.jpg"
 *             description: "Beach sunset in Hawaii"
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
 *             example:
 *               message: "Processing started"
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload (max 10MB, formats jpg, jpeg, png, gif, webp, svg, avif, tiff)
 *               description:
 *                 type: string
 *                 description: Optional description for the image
 *     responses:
 *       200:
 *         description: Upload successful and processing started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     uuid:
 *                       type: string
 *                       format: uuid
 *                     filename:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending]
 *                     message:
 *                       type: string
 *             example:
 *               data:
 *                 uuid: "a8b7c6d5-e4f3-2g1h-0i9j-8k7l6m5n4o3p"
 *                 filename: "mountain-view.jpg"
 *                 status: "pending"
 *                 message: "Upload successful and processing started"
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
 *         description: The image resource with embedded base64 image data if succeeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uuid:
 *                   type: string
 *                   format: uuid
 *                 filename:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 status:
 *                   type: string
 *                   enum: [pending, succeeded, failed]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 imageData:
 *                   type: string
 *                   description: Base64 encoded image data with MIME type prefix
 *             example:
 *               uuid: "76466f50-10e5-46b6-a7ec-9b8c1721392a"
 *               filename: "sunset.jpg"
 *               description: "Beautiful sunset at the beach"
 *               status: "succeeded"
 *               createdAt: "2025-03-08T19:02:11.614Z"
 *               completedAt: "2025-03-08T19:02:11.878Z"
 *               imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Image deleted"
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
 *         required: false
 *         default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: false
 *         default: desc
 *         description: Sort direction
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt]
 *         required: false
 *         default: createdAt
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   uuid:
 *                     type: string
 *                     format: uuid
 *                   filename:
 *                     type: string
 *                   description:
 *                     type: string
 *                     nullable: true
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   imageData:
 *                     type: string
 *             example:
 *               - uuid: "76466f50-10e5-46b6-a7ec-9b8c1721392a"
 *                 filename: "beach.jpg"
 *                 description: "Beach vacation"
 *                 status: "succeeded"
 *                 createdAt: "2025-03-08T19:02:11.614Z"
 *                 completedAt: "2025-03-08T19:02:11.878Z"
 *                 imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
 *               - uuid: "98765432-abcd-efgh-ijkl-1234567890ab"
 *                 filename: "mountains.jpg"
 *                 description: "Mountain hiking trip"
 *                 status: "succeeded"
 *                 createdAt: "2025-03-08T18:45:30.123Z"
 *                 completedAt: "2025-03-08T18:45:45.789Z"
 *                 imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
 *       500:
 *         description: Server error
 */
imageRouter.get("/", validate(GetImagesQueryDto, "query"), getImages);

