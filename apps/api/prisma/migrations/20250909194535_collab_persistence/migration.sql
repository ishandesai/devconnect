-- CreateTable
CREATE TABLE "public"."DocSnapshot" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "blob" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocUpdate" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "update" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocSnapshot_docId_idx" ON "public"."DocSnapshot"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "DocSnapshot_docId_version_key" ON "public"."DocSnapshot"("docId", "version");

-- CreateIndex
CREATE INDEX "DocUpdate_docId_idx" ON "public"."DocUpdate"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "DocUpdate_docId_seq_key" ON "public"."DocUpdate"("docId", "seq");
