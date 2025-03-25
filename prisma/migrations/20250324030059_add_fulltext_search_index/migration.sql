-- CreateIndex
CREATE INDEX "Element_mainCategory_idx" ON "Element" USING GIN ("mainCategory");

-- CreateIndex
CREATE INDEX "Element_secondaryCategory_idx" ON "Element" USING GIN ("secondaryCategory");

-- CreateIndex
CREATE INDEX "Element_tags_idx" ON "Element" USING GIN ("tags");

-- Create a GIN index for full-text search
CREATE INDEX element_search_idx ON "Element" USING GIN (
  to_tsvector('english', 
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce("shortDescription", '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
);