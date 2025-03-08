import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables


// Initialize MinIO Client
export const minioClient = new Client({
  endPoint: process.env.MINIO_URL as string,
  port: Number(process.env.MINIO_PORT),
  useSSL: false, // Set to true if using HTTPS
  accessKey: process.env.MINIO_ROOT_USER as string,
  secretKey: process.env.MINIO_ROOT_PASSWORD as string
});
