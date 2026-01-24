-- CreateIndex
CREATE INDEX "Element_mainCategory_idx" ON "Element" USING GIN ("mainCategory");

-- CreateIndex
CREATE INDEX "Element_secondaryCategory_idx" ON "Element" USING GIN ("secondaryCategory");

-- CreateIndex
CREATE INDEX "Element_tags_idx" ON "Element" USING GIN ("tags");
