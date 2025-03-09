import express from "express";
import { CreateCollectionDto, UpdateCollectionDto, CollectionUuidDto, AddToCollectionDto, 
    DeleteFromCollectionDto, GetCollectionsQueryDto } from "../dtos/collection.dto.js";
import { validate } from "../middleware/validate.js";
import { createCollection, getCollections, getCollectionById, updateCollection, deleteCollection, 
    addToCollection, deleteFromCollection } from "../controllers/collections.controller.js";

export const collectionRouter = express.Router();

/**
 * @swagger
 * /api/v1/collections:
 *   get:
 *     summary: List all collections
 *     tags: [Collections]
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
 *           enum: [createdAt, updatedAt]
 *         required: false
 *         default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter collections by name
 *     responses:
 *       200:
 *         description: List of collections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collection'
 *             example:
 *               data: [
 *                 {
 *                   "uuid": "b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6",
 *                   "name": "Vacation Photos",
 *                   "description": "Photos from summer vacation",
 *                   "createdAt": "2025-03-08T15:30:00.000Z",
 *                   "updatedAt": "2025-03-08T15:30:00.000Z",
 *                   "imageCount": 5
 *                 },
 *                 {
 *                   "uuid": "c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7",
 *                   "name": "Work Projects",
 *                   "description": "Screenshots of design projects",
 *                   "createdAt": "2025-03-07T10:15:00.000Z",
 *                   "updatedAt": "2025-03-07T14:20:00.000Z",
 *                   "imageCount": 12
 *                 }
 *               ]
 *       500:
 *         description: Server error
 */
collectionRouter.get("/", validate(GetCollectionsQueryDto, "query"), getCollections);

/**
 * @swagger
 * /api/v1/collections:
 *   post:
 *     summary: Create a new collection
 *     tags: [Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               description:
 *                 type: string
 *           example:
 *             name: "Nature Photography"
 *             description: "Collection of landscape and wildlife photos"
 *     responses:
 *       201:
 *         description: Collection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *             example:
 *               data: {
 *                 "uuid": "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
 *                 "name": "Nature Photography",
 *                 "description": "Collection of landscape and wildlife photos",
 *                 "createdAt": "2025-03-09T08:45:30.123Z",
 *                 "updatedAt": "2025-03-09T08:45:30.123Z",
 *                 "imageCount": 0
 *               }
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
collectionRouter.post("/", validate(CreateCollectionDto), createCollection);

/**
 * @swagger
 * /api/v1/collections/{uuid}:
 *   get:
 *     summary: Get collection by UUID with its images
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Collection unique identifier
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         default: 1
 *         description: Page number for images pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         default: 10
 *         description: Number of images per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: false
 *         default: desc
 *         description: Sort direction for images
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, filename, status]
 *         required: false
 *         default: createdAt
 *         description: Field to sort images by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter images
 *     responses:
 *       200:
 *         description: The collection with its images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CollectionWithImages'
 *             example:
 *               data: {
 *                 "uuid": "b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6",
 *                 "name": "Vacation Photos",
 *                 "description": "Photos from summer vacation",
 *                 "createdAt": "2025-03-08T15:30:00.000Z",
 *                 "updatedAt": "2025-03-08T15:30:00.000Z",
 *                 "imageCount": 5,
 *                 "images": [
 *                   {
 *                     "uuid": "76466f50-10e5-46b6-a7ec-9b8c1721392a",
 *                     "filename": "beach.jpg",
 *                     "description": "Beach sunset",
 *                     "status": "succeeded",
 *                     "createdAt": "2025-03-08T19:02:11.614Z",
 *                     "completedAt": "2025-03-08T19:02:11.878Z",
 *                     "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
 *                   },
 *                   {
 *                     "uuid": "98765432-abcd-efgh-ijkl-1234567890ab",
 *                     "filename": "hotel.jpg",
 *                     "description": "Hotel view",
 *                     "status": "succeeded",
 *                     "createdAt": "2025-03-08T18:45:30.123Z",
 *                     "completedAt": "2025-03-08T18:45:45.789Z",
 *                     "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
 *                   }
 *                 ],
 *                 "pagination": {
 *                   "page": 1,
 *                   "limit": 10,
 *                   "totalItems": 5,
 *                   "totalPages": 1
 *                 }
 *               }
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
collectionRouter.get("/:uuid", validate(CollectionUuidDto, "params"), getCollectionById);

/**
 * @swagger
 * /api/v1/collections/{uuid}:
 *   patch:
 *     summary: Update collection by ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Collection unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               description:
 *                 type: string
 *           example:
 *             name: "Summer Vacation 2025"
 *             description: "Updated collection of beach photos"
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *             example:
 *               data: {
 *                 "uuid": "b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6",
 *                 "name": "Summer Vacation 2025",
 *                 "description": "Updated collection of beach photos",
 *                 "createdAt": "2025-03-08T15:30:00.000Z",
 *                 "updatedAt": "2025-03-09T10:15:22.456Z",
 *                 "imageCount": 5
 *               }
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
collectionRouter.patch("/:uuid", validate(UpdateCollectionDto), updateCollection);

/**
 * @swagger
 * /api/v1/collections/{uuid}:
 *   delete:
 *     summary: Delete collection by ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Collection unique identifier
 *     responses:
 *       200:
 *         description: Collection deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *             example:
 *               meta: {
 *                 "message": "Collection deleted successfully"
 *               }
 *       404:
 *         description: Collection not found
 *       409:
 *         description: Cannot delete non-empty collection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       detail:
 *                         type: string
 *             example:
 *               errors: [
 *                 {
 *                   "title": "Cannot delete non-empty collection",
 *                   "detail": "Remove all images from the collection before deleting it"
 *                 }
 *               ]
 *       500:
 *         description: Server error
 */
collectionRouter.delete("/:uuid", validate(CollectionUuidDto, "params"), deleteCollection);

/**
 * @swagger
 * /api/v1/collections/{uuid}/relationships/images:
 *   post:
 *     summary: Add images to collection
 *     tags: [Collections]
 *     description: JSON:API relationship management endpoint
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Collection unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - uuid
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [images]
 *                     uuid:
 *                       type: string
 *                       format: uuid
 *           example:
 *             data: [
 *               {
 *                 "type": "images",
 *                 "uuid": "76466f50-10e5-46b6-a7ec-9b8c1721392a"
 *               },
 *               {
 *                 "type": "images",
 *                 "uuid": "98765432-abcd-efgh-ijkl-1234567890ab"
 *               }
 *             ]
 *     responses:
 *       200:
 *         description: Relationship updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *             example:
 *               meta: {
 *                 "message": "Images added to collection"
 *               }
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Collection or image not found
 *       500:
 *         description: Server error
 */
collectionRouter.post("/:uuid/relationships/images", 
    validate(CollectionUuidDto, "params"),
    validate(AddToCollectionDto),
    addToCollection);

/**
 * @swagger
 * /api/v1/collections/{uuid}/relationships/images:
 *   delete:
 *     summary: Remove images from collection
 *     tags: [Collections]
 *     description: JSON:API relationship management endpoint
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Collection unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - uuid
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [images]
 *                     uuid:
 *                       type: string
 *                       format: uuid
 *           example:
 *             data: [
 *               {
 *                 "type": "images",
 *                 "uuid": "76466f50-10e5-46b6-a7ec-9b8c1721392a"
 *               }
 *             ]
 *     responses:
 *       200:
 *         description: Relationship removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *             example:
 *               meta: {
 *                 "message": "Image removed from collection"
 *               }
 *       404:
 *         description: Collection, image, or relationship not found
 *       500:
 *         description: Server error
 */
collectionRouter.delete("/:uuid/relationships/images",
     validate(CollectionUuidDto, "params"),
     validate(DeleteFromCollectionDto),
     deleteFromCollection);

/**
 * @swagger
 * components:
 *   schemas:
 *     Collection:
 *       type: object
 *       properties:
 *         uuid:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         imageCount:
 *           type: integer
 *     CollectionWithImages:
 *       allOf:
 *         - $ref: '#/components/schemas/Collection'
 *         - type: object
 *           properties:
 *             images:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ThumbnailImage'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *     ThumbnailImage:
 *       type: object
 *       properties:
 *         uuid:
 *           type: string
 *           format: uuid
 *         filename:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, succeeded, failed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         imageData:
 *           type: string
 *           description: Base64 encoded image data with MIME type prefix
 */


