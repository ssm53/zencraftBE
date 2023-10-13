-- CreateTable
CREATE TABLE "VarImage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "size" TEXT,
    "url" TEXT,

    CONSTRAINT "VarImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VarImage_url_key" ON "VarImage"("url");

-- AddForeignKey
ALTER TABLE "VarImage" ADD CONSTRAINT "VarImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
