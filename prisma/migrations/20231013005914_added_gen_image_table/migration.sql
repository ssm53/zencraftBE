/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Image";

-- CreateTable
CREATE TABLE "GenImage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "prompt" TEXT,
    "url" TEXT,

    CONSTRAINT "GenImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GenImage_url_key" ON "GenImage"("url");

-- AddForeignKey
ALTER TABLE "GenImage" ADD CONSTRAINT "GenImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
