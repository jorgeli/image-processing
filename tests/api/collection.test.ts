import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../api/src/app.js";  // Update to relative path
import { prisma } from "../../api/src/config/prisma.js";  // Update to relative path
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

// Use a real database connection but with a test database
// This assumes you have your database connection configured for tests

describe("Collection API E2E", () => {
  let createdCollectionId: string; 

  // Clean up any test data before and after tests
  beforeAll(async () => {
  
  });

  afterAll(async () => {
    // Clean up any remaining test collections
    await prisma.collection.deleteMany({
      where: {
        uuid: createdCollectionId
      }
    }); 
    
    // Close database connection
    await prisma.$disconnect();
  });

  it("should perform full collection lifecycle: create, update, delete", async () => {
    // Step 1: Create a collection
    const createResponse = await request(app)
      .post("/api/v1/collections")
      .send({
        name: "E2E Test Collection",
        description: "Initial description"
      })
      .expect(201);

    // Validate response structure rather than specific strings
    expect(createResponse.body).toHaveProperty("data");
    expect(createResponse.body.data).toHaveProperty("uuid");
    expect(createResponse.body.data).toHaveProperty("name");
    expect(createResponse.body.data).toHaveProperty("description");
    
    createdCollectionId = createResponse.body.data.uuid;
    expect(typeof createdCollectionId).toBe("string");
    console.log("createdCollectionId", createdCollectionId);
    
    let newDescription = "Updated description";
    // Step 2: Update the collection
    const updateResponse = await request(app)
      .patch(`/api/v1/collections/${createdCollectionId}`)
      .send({
        name: "E2E Test Updated",
        description: newDescription
      })
      .expect(200);

    // Validate structure but not exact content
    expect(updateResponse.body).toHaveProperty("data");
    expect(updateResponse.body.data).toHaveProperty("uuid");
    expect(updateResponse.body.data).toHaveProperty("name");
    expect(updateResponse.body.data).toHaveProperty("description");
    expect(updateResponse.body.data.description).toBe(newDescription);    
    // Confirm it's the same collection
    expect(updateResponse.body.data.uuid).toBe(createdCollectionId);

    // Step 3: Get the collection to verify it exists
    const getResponse = await request(app)
      .get(`/api/v1/collections/${createdCollectionId}`)
      .expect(200);

    // Validate structure only
    expect(getResponse.body).toHaveProperty("data");
    expect(getResponse.body.data.uuid).toBe(createdCollectionId);

    await request(app)
      .delete(`/api/v1/collections/${createdCollectionId}`)
      .expect(200);

    await request(app)
      .get(`/api/v1/collections/${createdCollectionId}`)
      .expect(404);
  });

  it("should not allow deleting a collection with images", async () => {
    // Step 1: Create a collection
    const createResponse = await request(app)
      .post("/api/v1/collections")
      .send({
        name: "E2E Test With Images",
        description: "Has images"
      })
      .expect(201);
    
    const collectionId = createResponse.body.data.uuid;
    
    // Create a dummy image
    const dummyImage = await prisma.thumbnailImage.create({
      data: {
        uuid: uuidv4(),
        filename : "dummy.jpg",
        createdAt: new Date(),
      }
    });
    

    // Add the dummy image to the collection
    await request(app)
      .post(`/api/v1/collections/${collectionId}/relationships/images`)
      .send({
        data: [{ type: "images", uuid: dummyImage.uuid }]
      })
      .expect(200);

    // Try to delete the collection with images
    const deleteResponse = await request(app)
      .delete(`/api/v1/collections/${collectionId}`)
      .expect(409); // Conflict status

    // Validate structure but not exact content
    expect(deleteResponse.body).toHaveProperty("errors");
    expect(Array.isArray(deleteResponse.body.errors)).toBe(true);
    expect(deleteResponse.body.errors.length).toBeGreaterThan(0);
    
    // remove the dummy image from the collection
    await request(app)
      .delete(`/api/v1/collections/${collectionId}/relationships/images`)
      .send({
        data: [{ type: "images", uuid: dummyImage.uuid }]
      })
      .expect(200);

    // Clean up
    await prisma.thumbnailImage.delete({
      where: { uuid: dummyImage.uuid }
    });
    
    // Now we can delete the collection
    await request(app)
      .delete(`/api/v1/collections/${collectionId}`)
      .expect(200);
  });
}); 