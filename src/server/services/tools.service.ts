// src/server/services/tools.service.ts

import { getToolRegistry } from "@/features/tools";

export function listTools() {
  return getToolRegistry().list();
}
