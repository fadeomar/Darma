/* eslint-disable @typescript-eslint/no-explicit-any */

// import your existing service + spec builder
// import { searchElementsDTO } from "@/searchElementsDTO";
import { searchElementsDTO } from "@/server/services/search.service";

// You likely already have some "buildSearchSpecification" used internally.
// If searchElementsDTO already accepts a "spec" param, plug policy there.
// Otherwise: add an optional "specOverride" param to searchElementsDTO.

export async function searchPublicElementsDTO(params: any) {
  // Option A: if searchElementsDTO builds spec internally,
  // add a "visibility" mode param there (recommended).
  return searchElementsDTO({ ...params, visibility: "public" });
}

export async function searchAdminElementsDTO(params: any) {
  return searchElementsDTO({ ...params, visibility: "admin" });
}
