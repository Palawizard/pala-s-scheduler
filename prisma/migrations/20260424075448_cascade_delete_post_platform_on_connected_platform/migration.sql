-- DropForeignKey
ALTER TABLE "PostPlatform" DROP CONSTRAINT "PostPlatform_connectedPlatformId_fkey";

-- AddForeignKey
ALTER TABLE "PostPlatform" ADD CONSTRAINT "PostPlatform_connectedPlatformId_fkey" FOREIGN KEY ("connectedPlatformId") REFERENCES "ConnectedPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
