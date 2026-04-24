-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED', 'FRIENDS_ONLY');

-- AlterTable
ALTER TABLE "PostPlatform" ADD COLUMN     "visibility" "PostVisibility";
