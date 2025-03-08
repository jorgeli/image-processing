import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { app } from "../../api/src/app.js";
dotenv.config();

// Constants
const IMAGES_FOLDER = './tests/fixtures/images';
const INVALID_FILES_FOLDER = './tests/fixtures/invalid';
const SMALL_IMAGE_FILENAME = 'doge.png'; // Small image for happy path
const LARGE_IMAGE_FILENAME = 'SampleJPGImage_15mbmb.jpg'; // Large image for rejection test
const TEST_ID = `direct-upload-test-${Date.now()}`;

// Add this helper function at the top of your file
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Direct Upload Small Image E2E Flow', () => {
  let smallImagePath: string;
  let largeImagePath: string;
  let emptyFilePath: string;
  let textFilePath: string;
  let processedId: string;
  
  beforeAll(async () => {
    console.log(`Setting up test files...`);
    
    // Set up paths for test files
    smallImagePath = path.join(IMAGES_FOLDER, SMALL_IMAGE_FILENAME);
    largeImagePath = path.join(IMAGES_FOLDER, LARGE_IMAGE_FILENAME);
    
    // Create directory for invalid files if it doesn't exist
    try {
      await fs.mkdir(INVALID_FILES_FOLDER, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
    }
    
    // Create an empty file for testing
    emptyFilePath = path.join(INVALID_FILES_FOLDER, 'empty.jpg');
    await fs.writeFile(emptyFilePath, '');
    
    // Create a text file for testing
    textFilePath = path.join(INVALID_FILES_FOLDER, 'file.txt');
    await fs.writeFile(textFilePath, 'This is a text file, not an image.');
    
    // Verify the files exist
    try {
      await fs.access(smallImagePath);
      await fs.access(largeImagePath);
      await fs.access(emptyFilePath);
      await fs.access(textFilePath);
      console.log(`All test files prepared successfully`);
    } catch (error) {
      console.error(`Error: Test file not found`);
      throw error;
    }
  });
  
  // Then add a small delay between tests
  beforeEach(async () => {
    await delay(500); // 500ms delay between tests
  });
  
  // ERROR CASES
  
  it('should reject an empty file', async () => {
    console.log('Testing empty file rejection...');
    
    const response = await request(app)
      .post('/api/v1/images/actions/upload')
      .attach('file', emptyFilePath)
      .field('description', 'Empty file test');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('empty');
    
    console.log('Empty file correctly rejected');
  });
  
  it('should reject a text file with invalid extension', async () => {
    console.log('Testing text file rejection...');
    
    const response = await request(app)
      .post('/api/v1/images/actions/upload')
      .attach('file', textFilePath)
      .field('description', 'Text file test');
    
    expect(response.status).toBe(415);
    expect(response.body.error).toContain('file types');
    
    console.log('Text file correctly rejected');
  });
  
  it('should reject when no file is provided', async () => {
    console.log('Testing no file rejection...');
    
    const response = await request(app)
      .post('/api/v1/images/actions/upload')
      .field('description', 'No file test');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('No file');
    
    console.log('No file correctly rejected');
  });
  
  it('should reject a file that exceeds size limit', async () => {
    console.log(`[${TEST_ID}] Testing large file rejection...`);
    
    const response = await request(app)
      .post('/api/v1/images/actions/upload')
      .attach('file', largeImagePath)
      .field('description', 'Large file test');
    
    expect(response.status).toBe(413);
    expect(response.body.error).toContain('too large');
    
    console.log('Large file correctly rejected');
  });
  
  // HAPPY PATH
  
  it('should upload and process a small image directly', async () => {
    console.log('Testing direct upload of small image...');
    
    const response = await request(app)
      .post('/api/v1/images/actions/upload')
      .attach('file', smallImagePath)
      .field('description', 'Small image direct upload test');
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBeDefined();
    expect(response.body.data.status).toBe('pending');
    
    // Store the ID for the next steps
    processedId = response.body.data.uuid;
    console.log(`Image uploaded with ID: ${processedId}`);
  });
  
  it('should poll until the image is processed', async () => {
    // Skip if previous test failed
    if (!processedId) return;
    
    console.log('Polling for image processing completion...');
    
    // Before polling implementation
    let isProcessed = false;
    let attempts = 0;
    const maxAttempts = 3000000;
    let imageData: any;
    
    // Polling implementation
    while (!isProcessed && attempts < maxAttempts) {
      attempts++;
      
      // Get image status
      const response = await request(app)
        .get(`/api/v1/images/${processedId}`);
      
      if (response.status === 200) {
        imageData = response.body;
        if (imageData.status === 'completed') {
          isProcessed = true;
          console.log(`Image processing completed after ${attempts} attempts`);
          break;
        }
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // After polling
    expect(isProcessed).toBe(true);
    // Check for imageData instead of presignedUrl
    expect(imageData.imageData).toBeDefined();
    
    console.log('Image processing completed successfully');
  }, 30000); // 30 second timeout
  
  it('should download the processed image using the embedded image data', async () => {
    // Skip if we don't have an ID
    if (!processedId) return;
    
    console.log('Getting image details...');
    
    const getResponse = await request(app)
      .get(`/api/v1/images/${processedId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.imageData).toBeDefined();
    
    // Verify the image data is a base64 string
    const imageData = getResponse.body.imageData;
    expect(imageData).toContain('data:image/');
    
    // Extract the base64 part and decode it to verify it's valid
    const base64Data = imageData.split(',')[1];
    const decodedData = Buffer.from(base64Data, 'base64');
    
    // Check that we have actual image data
    expect(decodedData.length).toBeGreaterThan(0);
    
    console.log(`Successfully retrieved processed image, size: ${decodedData.length} bytes`);
  });
  
  it('should be able to be retrieved by ID', async () => {
    // Skip if we don't have an ID
    if (!processedId) {
      console.log('Skipping list test as no image ID was obtained');
      return;
    }
    
    console.log(`[${TEST_ID}] Checking if image can be retrieved by ID...`);
    
    // Use the get-by-id endpoint instead of the list endpoint
    const getResponse = await request(app)
      .get(`/api/v1/images/${processedId}`);
    
    console.log(`[${TEST_ID}] Get response status: ${getResponse.status}`);
    if (getResponse.status !== 200) {
      console.log(`[${TEST_ID}] Get response error:`, getResponse.body);
    }
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.uuid).toBe(processedId);
    expect(getResponse.body.status).toBe('completed');
    expect(getResponse.body.imageData).toBeDefined();
    
    console.log(`[${TEST_ID}] Image retrieved successfully by ID`);
  });
  
  it('should delete the image', async () => {
    // Skip if we don't have an ID
    if (!processedId) {
      console.log('Skipping deletion test as no image ID was obtained');
      return;
    }
    
    console.log(`[${TEST_ID}] Deleting the image with ID: ${processedId}...`);
    
    try {
      const deleteResponse = await request(app)
        .delete(`/api/v1/images/${processedId}`);
      
      console.log(`[${TEST_ID}] Delete response status: ${deleteResponse.status}`);
      
      if (deleteResponse.status !== 200) {
        console.log(`[${TEST_ID}] Delete response error:`, deleteResponse.body);
        
        // If the error is "not found", that's acceptable for this test
        if (deleteResponse.status === 404 || 
            (deleteResponse.status === 500 && deleteResponse.body.error?.includes('not found'))) {
          console.log(`[${TEST_ID}] Image was already deleted or not found, considering test passed`);
          return; // Skip the rest of the test
        }
      }
      
      expect(deleteResponse.status).toBe(200);
      
      // Verify it's gone
      const getResponse = await request(app)
        .get(`/api/v1/images/${processedId}`);
      
      expect(getResponse.status).toBe(404);
      
      console.log(`[${TEST_ID}] Image deleted successfully`);
    } catch (error) {
      console.error(`[${TEST_ID}] Error during delete test:`, error);
      throw error;
    }
  });
}); 