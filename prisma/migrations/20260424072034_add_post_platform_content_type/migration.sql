-- CreateEnum
CREATE TYPE "PostContentType" AS ENUM ('YOUTUBE_VIDEO', 'YOUTUBE_SHORT', 'INSTAGRAM_POST', 'INSTAGRAM_REEL');

-- AlterTable
ALTER TABLE "PostPlatform" ADD COLUMN     "contentType" "PostContentType";
