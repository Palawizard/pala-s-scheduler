-- CreateTable
CREATE TABLE "AccountSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "snapshotDate" DATE NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformPostId" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT,
    "thumbnailUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountSnapshot_userId_platform_idx" ON "AccountSnapshot"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSnapshot_userId_platform_snapshotDate_key" ON "AccountSnapshot"("userId", "platform", "snapshotDate");

-- CreateIndex
CREATE INDEX "PlatformPost_userId_platform_idx" ON "PlatformPost"("userId", "platform");

-- CreateIndex
CREATE INDEX "PlatformPost_userId_publishedAt_idx" ON "PlatformPost"("userId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPost_userId_platform_platformPostId_key" ON "PlatformPost"("userId", "platform", "platformPostId");

-- AddForeignKey
ALTER TABLE "AccountSnapshot" ADD CONSTRAINT "AccountSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPost" ADD CONSTRAINT "PlatformPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
