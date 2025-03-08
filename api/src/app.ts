import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger.js";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Set up middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Set up Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Register your existing routes
app.use('/api', router);

// Error handling middleware
app.use(errorHandler);

