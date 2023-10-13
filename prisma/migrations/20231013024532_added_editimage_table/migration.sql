-- CreateTable
CREATE TABLE "EditImage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "prompt" TEXT,
    "size" TEXT,
    "url" TEXT,

    CONSTRAINT "EditImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditImage_url_key" ON "EditImage"("url");

-- AddForeignKey
ALTER TABLE "EditImage" ADD CONSTRAINT "EditImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
