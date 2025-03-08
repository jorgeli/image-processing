# Image Processing Service

A scalable microservice architecture for image processing with direct and presigned URL uploads, asynchronous processing, and a RESTful API.

## Architecture Overview

This project implements a modern microservice architecture with:

- **API Service**: Handles HTTP requests, database operations, and coordinates with other services
- **Worker Service**: Processes images asynchronously, can be scaled horizontally
- **Shared Schemas**: Common type definitions and validation schemas shared between services

The system uses:

- **PostgreSQL**: For persistent data storage
- **MinIO**: S3-compatible object storage for images
- **Kafka**: Message queue for asynchronous processing
- **Docker**: For containerization and local development

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- Node.js 20+ (for local development outside containers)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/image-processing-service.git
   cd image-processing-service
   ```

2. Start the application:

   ```bash
   docker-compose up
   ```

   Or in detached mode with logs:

   ```bash
   docker-compose up -d && docker-compose logs -f --timestamps
   ```

3. The API will be available at http://localhost:5000

### Stopping the Application

```bash
docker-compose down -v
```

## Testing

The tests are designed to run inside the Docker environment to ensure they test the real behavior of the application with all dependencies.

### Automated Testing

Tests run automatically when you start the application with `docker-compose up`. The `node-api-test` service is configured to:

1. Wait for all dependencies to be ready
2. Run database migrations
3. Execute tests in watch mode (`npm run test:watch`)

You can see the test results in the Docker logs:

```bash
# View test logs
docker-compose logs -f node-api-test
```

## Development Workflow

### Database Migrations

After updating the schema, run:

```bash
# Generate Prisma client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration-name

# Reset database (caution: destroys all data)
npx prisma migrate reset --force
```

## Technical Documentation

### Project Structure

```
├── api/                  # API service
│   ├── src/
│   │   ├── config/       # Service initializers
│   │   ├── controllers/  # Request handlers
│   │   ├── dtos/         # Data transfer objects
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── app.ts        # Express app setup
│   │   └── server.ts     # Server entry point
├── worker/               # Worker service
│   └── src/              # Similar structure to API
├── packages/
│   └── shared-schemas/   # Shared type definitions
├── prisma/               # Database schema and migrations
├── tests/                # Test suites
│   ├── e2e/              # End-to-end tests
│   ├── api/              # API tests
│   └── fixtures/         # Test data
└── docker-compose.yml    # Service definitions
```

### Key Design Decisions

#### Validation

- Using Zod for schema validation with TypeScript integration
- Validation middleware in routes for consistent error handling

#### Database

- Prisma ORM for type-safe database access for Postgres
- Singleton pattern for connection management

#### Storage

- MinIO for S3-compatible object storage
- Separate buckets for uploaded and processed images
- Easy to migrate to S3

#### Message Queue

- Kafka for reliable asynchronous processing
- Multiple partitions to enable horizontal scaling of workers
- Topics initialized via Docker Compose for security

#### Testing

- E2E tests that verify the complete user journey
- Tests run in the Docker environment for realistic behavior
- Separate test files for different functional areas

### Producer / consumer message queue

We are using kafka as a message queue to orchestrate the image processing, in this configuration there is the same number of partitions as the number of workers to scale kafka horizontally. default number of partitions is 4.

### kafka topics and minio bucket initialization

Initialization can be done in initializers, but instead docker compose is used to initialize the topics and the bucket. This makes unnecessary for the api layer to be kafka admin adding security to the system.

### Path vs relative path

We are using relative paths ../../ for the imports instead of path aliases, the reason is that we have 2 different projects that share the same tsconfig.json file, so for example we can't use path aliases for @controllers since each project (api and worker) has its own folder.
On the other hand, in the shared-schemas project we are using path aliases to import the shared schemas

### Upload Strategies

The service supports two upload strategies:

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

For Download, this add extra unnecesary extra complexity so only direct download is supported

## API Documentation

Swagger UI is available at http://localhost:5000/api-docs/

## Management UIs

- **MinIO Console**: http://localhost:9001/ (Login with credentials from .env)
- **Kafka UI**: http://localhost:8080/

## Deployment Sequence

The application follows this deployment sequence:

1. Database (PostgreSQL) starts and initializes
2. Message broker (Kafka) and its dependencies start
3. Storage service (MinIO) initializes with required buckets
4. API service starts, connecting to all dependencies
5. Worker services start, consuming messages from Kafka
6. Testing initiate

This sequence ensures dependencies are available before services that need them.

### Logs

View logs for a specific service:

```bash
docker-compose logs -f --timestamps node-api
```

### Collections

The service includes a collection management system that allows users to organize images into logical groups:

#### Collection Features

- **Create Collections**: Users can create named collections with optional descriptions
- **Update Collections**: Collection names and descriptions can be modified
- **Delete Collections**: Collections can be deleted, but only if they contain no images
- **Image Organization**: Each image may belong to zero or one collection at a time
- **Relationship Management**: Add or remove images from collections via JSON:API style endpoints

#### Collection Rules

1. **Empty Collection Rule**: Collections can only be deleted if they contain no images
2. **Single Collection Rule**: An image can belong to at most one collection at a time
3. **Existence Rule**: Both the collection and image must exist before establishing a relationship
