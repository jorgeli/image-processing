# Image Processing Service

A scalable microservice-based architecture for image processing with direct and presigned URL uploads, asynchronous processing, and a RESTful API.

#### Developed by Jorge Alviarez jorge.f.alviarez@gmail.com.

## 1. Overview

This service provides an efficient and scalable solution for image processing, designed to handle high loads and be easily extendable. It supports

- **Direct Uploads** (server-managed file handling)
- **Presigned URL Uploads** (client-side uploads to storage)
- **Asynchronous Image Processing** using Kafka message queues
- **Scalable Worker Nodes** for efficient processing
- **RESTful API** with OpenAPI/Swagger documentation
- **Collection Management** for organizing images

## 2. System Architecture

### Components

1. **API Service** (Node.js + Express + Prisma)

   - Handles HTTP requests
   - Manages database operations
   - Issues presigned URLs for uploads of big files
   - Sends messages to Kafka for async processing

2. **Worker Service** (Node.js)

   - Listens for messages from Kafka
   - Processes images
   - Stores processed images in MinIO
   - In a productive scenario, Python would typically be the preferred choice for image processing due to its rich ecosystem and specialized libraries. However, for this initial approach, we have chosen to implement the worker service in Node.js to reduce complexity within the mono-repo

3. **Storage** (MinIO - S3 compatible)

   - Stores raw and processed images
   - Separate buckets for uploads and processed images

4. **Database** (PostgreSQL + Prisma ORM)

   - Stores image metadata and collection info

5. **Message Queue** (Kafka)

   - Handles async image processing requests
   - Enables horizontal scaling of workers

6. **Containerization** (Docker + Docker Compose)

   - Simplifies deployment and local development

---

## 3. Getting Started

### 3.1 Prerequisites

Ensure you have the following installed:

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Git](https://git-scm.com/)
- [Node.js 20+](https://nodejs.org/) (for local development outside containers)

### 3.2 Installation & Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/jorgeli/image-processing.git
   cd image-processing
   ```

2. Build Docker images before starting services:

   ```sh
   docker-compose build
   ```

   This step is highly recommended, especially for first-time setup, as it ensures all images are properly built before the services start. Building can take several minutes on the first run, and attempting to start services before builds complete may cause health checks to fail.

3. Start all services using Docker Compose:

   ```sh
   docker-compose up
   ```

   To run in detached mode with logs:

   ```sh
   docker-compose up -d && docker-compose logs -f --timestamps
   ```

4. Access the system:

   - **API Service:** [http://localhost:5000](http://localhost:5000)
   - **Swagger API Docs:** [http://localhost:5000/api-docs/](http://localhost:5000/api-docs/)
   - **MinIO Console:** [http://localhost:9001](http://localhost:9001) (login with `.env` credentials)
   - **Kafka UI:** [http://localhost:8080/](http://localhost:8080/)

5. To stop the services:

   ```sh
   docker-compose down -v
   ```

6. Scaling with Docker Compose

Even though Docker Compose is not the best tool for production scaling, we can still achieve basic horizontal scaling:

7. Scaling API and Worker Services

To scale services using Docker Compose, use the --scale option:

Scale Worker service to 6 instances

```sh
docker-compose up --scale image-worker=6
```

Of course the docker-compose file starts with the number of instances we want.

Kafka allows horizontal scaling by partitioning topics:
It is important to also increate partitions so al least match number of workers

## 4. API Documentation

### Accessing API Documentation

- **Swagger UI**: Available at http://localhost:5000/api-docs/

  - Interactive documentation with request/response examples
  - Try out API endpoints directly from the browser
  - Complete schema definitions for all models

- **Postman Collection**: Import the provided `api/Image-Processing-API.postman_collection.json` file into Postman for ready-to-use requests with examples.

### 4.1 Available Endpoints

| Endpoint                                         | Method | Description                        |
| ------------------------------------------------ | ------ | ---------------------------------- |
| `/api/v1/images`                                 | GET    | List all images with pagination    |
| `/api/v1/images/:uuid`                           | GET    | Get image metadata                 |
| `/api/v1/images/:uuid`                           | DELETE | Delete an image                    |
| `/api/v1/images/actions/upload-url`              | GET    | Generate a presigned URL           |
| `/api/v1/images/actions/upload`                  | POST   | Direct upload (server-managed)     |
| `/api/v1/images/actions/process`                 | POST   | Start processing an uploaded image |
| `/api/v1/collections`                            | GET    | List all image collections         |
| `/api/v1/collections`                            | POST   | Create a new collection            |
| `/api/v1/collections/:uuid`                      | GET    | Get a collection with its images   |
| `/api/v1/collections/:uuid`                      | PATCH  | Update a collection                |
| `/api/v1/collections/:uuid`                      | DELETE | Delete an empty collection         |
| `/api/v1/collections/:uuid/relationships/images` | POST   | Add images to a collection         |
| `/api/v1/collections/:uuid/relationships/images` | DELETE | Remove images from a collection    |

For complete request/response examples, refer to the Swagger documentation.

### Collections

The service includes a collection management system that allows users to organize images into logical groups:

#### Collection Rules

1. **Empty Collection Rule**: Collections can only be deleted if they contain no images
2. **Single Collection Rule**: An image can belong to at most one collection at a time
3. **Existence Rule**: Both the collection and image must exist before establishing a relationship

---

## 5. Technical Decisions & Trade-offs

### 5.1 Why These Technologies?

- **Node.js (API Service)**: Asynchronous, performant, and widely used for RESTful APIs.
- **Node.js (Worker Service)**: In a productive scenario, Python would typically be the preferred choice for image processing due to its rich ecosystem and specialized libraries.

However, for this initial approach, we have chosen to implement the worker service in Node.js to reduce complexity within the mono-repo.

- **Kafka (Message Queue)**: Ensures reliable and scalable async processing.
- **MinIO (Storage)**: S3-compatible, allowing easy migration to AWS S3.
- **PostgreSQL (Database)**: SQL database with Prisma ORM for type-safe queries.

### 5.2 Trade-offs & Considerations

#### Path vs. Path Aliases

- Relative paths (`../../`) are used instead of path aliases due to shared `tsconfig.json` across multiple services.
- Path aliases (`@shared`) are used inside shared schemas for better modularity.

#### Upload Strategies

1. **Direct Upload** (via `/api/v1/images/actions/upload`):

   - Server-mediated upload where the API handles the file
   - Simpler for clients but uses server resources
   - Suitable for smaller files (up to 10MB)
   - Validation happens on the server before storage

2. **Presigned URL Upload** (via `/api/v1/images/actions/upload-url`):
   - Client uploads directly to storage using a presigned URL
   - More efficient for large files as it bypasses the API server
   - Requires two API calls (get URL, then start processing)
   - From client-side the upload to minio is another additional request
   - Better scalability for production environments with S3

For Download, this add extra unnecesary extra complexity so images are passed via Base64

#### Validation

- Using Zod for schema validation with TypeScript integration
- Validation middleware in routes for consistent error handling

#### Deployment Readiness & Scalability

While Docker Compose is useful for local development and basic scaling, in a real production environment, a more robust orchestration tool like Kubernetes should be used. However, for now:

- Scaling with Docker Compose allows basic multi-instance deployments of workers.
- Kafka partitions enable distributed processing across worker instances.

---

## 6. Testing & Development Workflow

### 6.1 Running Tests

Tests run inside the Docker environment:

```sh
# View test logs
docker-compose logs -f node-api-test
```

- It was prefered an approach of E2E test over unit test
- Tests run in the Docker environment for realistic behavior
- Separate test files for different functional areas

### 6.2 Artillery

Artillery is installed to test load of the system, this is the testing scenario

![Artillery Load Test Configuration](/image-processing/tests/artillery/testin-config.png)

#### Running Load Tests

The load tests must be executed inside the `node-api-test` Docker container:

```bash
# Connect to the node-api-test container
docker exec -it node-api-test sh

# Inside the container, run the load test
npm run test:load

# Generate an HTML report of the results
npm run test:load:report
```

Last report can be seen [here](/image-processing/tests/artillery/report.html)

## 7 Database Migrations

After updating the schema, run:

```sh
npx prisma generate
npx prisma migrate dev --name migration-name
```

For a clean reset:

```sh
npx prisma migrate reset --force
```

---

## 8. Deployment & Monitoring

### 8.1 Deployment Sequence

1. Start **PostgreSQL** and **Kafka** (dependencies first).
2. Start **MinIO** (storage service).
3. Start **API Service** (Node.js + Express).
4. Start **Worker Service** (Node.js-based processing workers).
5. Start the E2E test with Vitest

### 8.2 Monitoring & Logging

- **Logs:**
  ```sh
  docker-compose logs -f --timestamps node-api
  ```

#### Future Enhancements

Future Enhancements:

Implement retry mechanisms for failed processing jobs.

Add metrics collection for API usage monitoring.

Integrate authentication (e.g., JWT) for API security.

Implement image caching and CDN integration to improve delivery performance and reduce load on the primary storage.

Expand image processing capabilities beyond simple resizing (e.g., cropping, filtering, watermarking, format conversion).

Migrate worker services to Python to leverage its superior image processing libraries.

Enable batch processing to handle multiple images in a single request.

Implement a watcher mechanism to monitor external image repositories and trigger automatic processing for client uploads.
