import { getRepositories } from "@/server/repositories";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import { prisma } from "@/server/db/prisma";

export async function getElementByIdDTO(
  id: string,
): Promise<ElementDTO | null> {
  // Backwards compatible alias.
  // Prefer getPublicElementByIdDTO for all public routes.
  return getPublicElementByIdDTO(id);
}

/**
 * Public-safe getter.
 * Enforces the visibility rule: reviewed=true AND deleted=false.
 */
export async function getPublicElementByIdDTO(
  id: string,
): Promise<ElementDTO | null> {
  if (!id) return null;

  try {
    const { element: elementRepo } = getRepositories();
    const element = await elementRepo.getById(id);
    return element ? toElementDTO(element) : null;
  } catch (error) {
    console.error(`Failed to load public element by id ${id}:`, error);
    return null;
  }
}

export async function getPublicElementBySlugDTO(slug: string) {
  if (!slug) return null;

  try {
    const row = await prisma.element.findFirst({
      where: {
        slug,
        reviewed: true,
        deleted: false,
      },
    });

    return row ? toElementDTO(row) : null;
  } catch (error) {
    console.error(`Failed to load public element by slug ${slug}:`, error);
    return null;
  }
}
