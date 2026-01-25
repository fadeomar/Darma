import { getRepositories } from "@/server/repositories";
import { toElementDTO } from "@/features/projects/dto/element.dto.mapper";
import type { ElementDTO } from "@/features/projects/dto/element.dto";

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
  const { element: elementRepo } = getRepositories();
  const element = await elementRepo.getById(id);
  return element ? toElementDTO(element) : null;
}
