// utils/slug.ts
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-") // Convert spaces to hyphens
    .replace(/[^\w\-]/g, "") // Remove non-word chars
    .replace(/\-+/g, "-") // Replace multiple hyphens
    .replace(/^-|-$/g, ""); // Trim hyphens from both ends
}

export function slugToName(slug: string): string {
  return slug
    .replace(/-/g, " ") // Convert hyphens to spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces
    .trim();
}
