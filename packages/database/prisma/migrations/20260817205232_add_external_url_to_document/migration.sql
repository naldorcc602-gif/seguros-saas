-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "externalUrl" TEXT,
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "sizeBytes" DROP NOT NULL,
ALTER COLUMN "storageKey" DROP NOT NULL;
