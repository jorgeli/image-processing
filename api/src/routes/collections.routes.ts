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
 *         name: filter
 *         schema:
 *           type: object
 *         description: Filtering parameters
 *     responses:
 *       200:
 *         description: List of collections
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
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Collection created successfully
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
 *     summary: Get collection by UUID
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
 *         description: The collection resource
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collection updated successfully
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
 *       404:
 *         description: Collection not found
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
 *     responses:
 *       200:
 *         description: Relationship updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Collection or image not found
 *       409:
 *         description: Collection already contains image
 *       500:
 *         description: Server error
 */
collectionRouter.post("/:uuid/relationships/images", 
    validate(CollectionUuidDto, "params"),
    validate(AddToCollectionDto),
    addToCollection);

/**
 * @swagger
 * /api/v1/collections/{uuid}/relationships/images/{imageId}:
 *   delete:
 *     summary: Remove image from collection
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
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image unique identifier to remove
 *     responses:
 *       200:
 *         description: Relationship removed successfully
 *       404:
 *         description: Collection, image, or relationship not found
 *       500:
 *         description: Server error
 */
collectionRouter.delete("/:uuid/relationships/images",
     validate(CollectionUuidDto, "params"),
     validate(DeleteFromCollectionDto),
     deleteFromCollection);


