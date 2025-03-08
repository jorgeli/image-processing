-- CreateTable
CREATE TABLE "processed_images" (
    "uuid" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "description" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "collectionId" TEXT,

    CONSTRAINT "processed_images_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "collections" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("uuid")
);

-- AddForeignKey
ALTER TABLE "processed_images" ADD CONSTRAINT "processed_images_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
