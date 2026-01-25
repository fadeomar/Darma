import { VariantCheck } from "@/types/buttonGeneratorTypes";

export function shouldShowElement(
  variant: string | undefined,
  hideVariants: VariantCheck
): boolean {
  if (!variant) return false;
  if (Array.isArray(hideVariants)) {
    return !hideVariants.includes(variant);
  }
  return variant !== hideVariants;
}
