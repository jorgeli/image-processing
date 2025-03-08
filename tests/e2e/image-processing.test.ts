import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import dotenv from 'dotenv';
import { app } from "../../api/src/app.js";
import { PresignedUrlResponseDtoType } from '../../api/src/dtos/image.dto';
dotenv.config();

// Constants
const IMAGES_FOLDER = './tests/fixtures/images';
const LARGE_IMAGE_FILENAME = 'SampleJPGImage_15mbmb.jpg'; // Specifically use the large image

describe('Image Upload & Processing Flow', () => {
  let processedId: string;
  let presignedURLData: PresignedUrlResponseDtoType;
  let imageBuffer: Buffer;
  let contentType: string;
  let largeImagePath: string;
  
  beforeAll(async () => {
    console.log(`Looking for large image in: ${IMAGES_FOLDER}`);
    
    // Use the large image specifically
    largeImagePath = path.join(IMAGES_FOLDER, LARGE_IMAGE_FILENAME);
    
    // Verify the file exists
    try {
      await fs.access(largeImagePath);
      console.log(`Using large test image: ${LARGE_IMAGE_FILENAME}`);
    } catch (error) {
      console.error(`Error: ${LARGE_IMAGE_FILENAME} not found in ${IMAGES_FOLDER}`);
      throw error;
    }
  });
  
  it('should get a presigned URL for upload', async () => {
    const extension = path.extname(LARGE_IMAGE_FILENAME).toLowerCase().substring(1);
    
    const presignedResponse = await request(app)
      .get(`/api/v1/images/actions/upload-url?extension=${extension}`)
      .expect(200);
    
    presignedURLData = presignedResponse.body;
    expect(presignedURLData.presignedUrl).toBeDefined();
    expect(presignedURLData.uuid).toBeDefined();
    processedId = presignedURLData.uuid;
    
    console.log(`Presigned URL data: ${JSON.stringify(presignedURLData)}`);
  });
  
  it('should upload the large image using the presigned URL', async () => {
    // Skip if previous test failed
    if (!presignedURLData) return;
    
    const extension = path.extname(LARGE_IMAGE_FILENAME).toLowerCase().substring(1);
    
    imageBuffer = await fs.readFile(largeImagePath);
    contentType = mime.lookup(extension) || 'application/octet-stream';
    
    console.log(`Uploading large image (${imageBuffer.length} bytes) to presigned URL...`);
    
    // We need to use fetch for the presigned URL upload
    const uploadResponse = await fetch(presignedURLData.presignedUrl, {
      method: 'PUT',
      body: imageBuffer,
      headers: {
        'Content-Type': contentType
      }
    });
    
    expect(uploadResponse.status).toBe(200);
    console.log(`Upload response status: ${uploadResponse.status}`);
  });
  
  it('should handle polling for image processing', async () => {
    // Skip if previous test failed
    if (!presignedURLData) return;
    
    console.log('Testing image processing with polling...');
    
    // Create process request data
    const processData = {
      uuid: presignedURLData.uuid,
      filename: LARGE_IMAGE_FILENAME,
      description: `Large image uploaded in e2e test`
    };
    
    console.log('Sending process request for image:', processData.uuid);
    
    // Send the process request to trigger Kafka flow
    const processResponse = await request(app)
      .post(`/api/v1/images/actions/process`)
      .set('Content-Type', 'application/json')
      .send(processData);
    
    console.log('Process API response status:', processResponse.status);
    expect(processResponse.status).toBe(200);
    
    // Before polling implementation
    let isProcessed = false;
    let attempts = 0;
    const maxAttempts = 3000000;
    
    // Polling implementation
    while (!isProcessed && attempts < maxAttempts) {
      attempts++;
      
      // Get image status
      const response = await fetch(`http://node-api:5000/api/v1/images/${presignedURLData.uuid}`);
      const imageData = await response.json();
      
      if (imageData.status === 'completed') {
        isProcessed = true;
        break;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time for large image
    }
    
    // After polling
    expect(isProcessed).toBe(true);
  }, 60000); // 60 second timeout for the entire test (increased for large image)
  
  // For debugging, let's add a simple test to check if the image exists
  it('should check if the image exists', async () => {
    // Skip if we don't have an ID
    if (!processedId) return;
    
    const getResponse = await request(app)
      .get(`/api/v1/images/${processedId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBeDefined();
    
    // Check for the imageData property instead of presignedUrl
    expect(getResponse.body.imageData).toBeDefined();
  });

  it('should download the processed large image using the embedded image data', async () => {
    // Skip if we don't have an ID
    if (!processedId) return;
    
    const getResponse = await request(app)
      .get(`/api/v1/images/${processedId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.imageData).toBeDefined();
    
    // Verify the image data is a base64 string
    const imageData = getResponse.body.imageData;
    expect(imageData).toContain('data:image/jpeg;base64,');
    
    // Extract the base64 part and decode it to verify it's valid
    const base64Data = imageData.split(',')[1];
    const decodedData = Buffer.from(base64Data, 'base64');
    
    // Check that we have actual image data
    expect(decodedData.length).toBeGreaterThan(1000); // Should be a reasonable size
    
    console.log(`Successfully retrieved processed large image, size: ${decodedData.length} bytes`);
    
    // Verify the filename is included in the response
    expect(getResponse.body.filename).toBe(LARGE_IMAGE_FILENAME);
  });
  
  it('should delete the image after testing', async () => {
    // Skip if we don't have an ID
    if (!processedId) return;
    
    console.log(`Deleting test image with ID: ${processedId}...`);
    
    const deleteResponse = await request(app)
      .delete(`/api/v1/images/${processedId}`);
    
    expect(deleteResponse.status).toBe(200);
    
    // Verify it's gone
    const getResponse = await request(app)
      .get(`/api/v1/images/${processedId}`);
    
    expect(getResponse.status).toBe(404);
    
    console.log(`Successfully deleted test image: ${processedId}`);
  });
});
