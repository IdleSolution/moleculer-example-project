-- CreateTable
CREATE TABLE "Post" (
    "id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "votes" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
