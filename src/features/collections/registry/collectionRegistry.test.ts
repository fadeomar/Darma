import { describe, expect, it } from "vitest";

import { getCollectionCoreEntities, isNavigableCollection } from "../lib/coreCollectionRegistry";
import { COLLECTIONS, getLiveCollections, getPlannedCollections } from "./collectionRegistry";

/** Routes that exist as pages under src/app. */
const LIVE_ROUTES = ["/tools", "/games", "/resources", "/learning-paths"];

/** Routes that have no page yet and must never be linked. */
const UNBUILT_ROUTES = ["/templates", "/components", "/ai", "/learning"];

describe("collection registry live routes", () => {
  it("marks Resources as live and points it at /resources", () => {
    const resources = COLLECTIONS.find((collection) => collection.id === "resources");

    expect(resources).toBeDefined();
    expect(resources.status).toBe("live");
    expect(resources.href).toBe("/resources");
    expect(resources.primaryAction).toBeDefined();
    expect(resources.primaryAction.href).toBe("/resources");
  });

  it("marks Learning Paths as live and points it at /learning-paths", () => {
    const learning = COLLECTIONS.find((collection) => collection.id === "learning");

    expect(learning).toBeDefined();
    expect(learning.status).toBe("live");
    expect(learning.href).toBe("/learning-paths");
    expect(learning.primaryAction).toBeDefined();
    expect(learning.primaryAction.href).toBe("/learning-paths");
  });

  it("keeps Templates, Components, and AI planned", () => {
    for (const id of ["templates", "components", "ai"]) {
      const collection = COLLECTIONS.find((item) => item.id === id);

      expect(collection, `expected a "${id}" collection`).toBeDefined();
      expect(collection.status, `"${id}" should still be planned`).toBe("planned");
    }
  });

  it("never gives a planned collection a navigable action", () => {
    for (const collection of getPlannedCollections()) {
      expect(collection.primaryAction, `"${collection.id}" must not expose a CTA`).toBeUndefined();
      expect(collection.secondaryAction, `"${collection.id}" must not expose a CTA`).toBeUndefined();
    }
  });

  it("only points live collections at routes that exist", () => {
    for (const collection of getLiveCollections()) {
      expect(LIVE_ROUTES, `"${collection.id}" href`).toContain(collection.href);
    }
  });
});

describe("collection core entity mapping", () => {
  it("excludes planned collections from navigable core entities", () => {
    const entities = getCollectionCoreEntities();
    const plannedIds = getPlannedCollections().map((collection) => collection.id);

    for (const plannedId of plannedIds) {
      expect(entities.some((entity) => entity.id === plannedId)).toBe(false);
    }
  });

  it("emits one navigable core entity per live collection", () => {
    const entities = getCollectionCoreEntities();
    const liveCollections = getLiveCollections();

    expect(entities).toHaveLength(liveCollections.length);

    for (const collection of liveCollections) {
      const entity = entities.find((item) => item.id === collection.id);

      expect(entity, `expected a core entity for "${collection.id}"`).toBeDefined();
      expect(entity.href).toBe(collection.href);
      expect(entity.status).toBe("live");
    }
  });

  it("never emits an href for a route that does not exist yet", () => {
    const hrefs = getCollectionCoreEntities().map((entity) => entity.href);

    for (const unbuilt of UNBUILT_ROUTES) {
      expect(hrefs).not.toContain(unbuilt);
    }
  });

  it("treats only live collections as navigable", () => {
    for (const collection of COLLECTIONS) {
      expect(isNavigableCollection(collection)).toBe(collection.status === "live");
    }
  });

  it("gives every navigable core entity a usable href", () => {
    for (const entity of getCollectionCoreEntities()) {
      expect(entity.href, `"${entity.id}" href`).toMatch(/^\/[a-z0-9-]+$/);
    }
  });
});
