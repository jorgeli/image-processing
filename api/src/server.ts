import { app } from "./app.js";
import dotenv from "dotenv";
import { initializeKafkaSystem } from "./services/kafka.service.js";

dotenv.config();

const PORT = process.env.PORT ?? 5000;

const start = async () => {
  try {
    // Initialize Kafka system (connections + listener)
    console.log(`[${new Date().toISOString()}] Starting server initialization...`);
    await initializeKafkaSystem();
    
    // Start the HTTP server after Kafka is initialized
    app.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to start server:`, error);
    process.exit(1);
  }
};

start();