import express, { Request, Response } from "express";
import { imageRouter } from "./images.routes.js";
import { collectionRouter } from "./collections.routes.js";

export const router = express.Router();

// API versioning
const v1Router = express.Router();
router.use("/v1", v1Router);

// Mount feature routes with consistent plural resource naming
v1Router.use("/images", imageRouter);
v1Router.use("/collections", collectionRouter);

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
