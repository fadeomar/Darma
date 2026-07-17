/**
 * Source group registry for the CSS loaders catalog.
 *
 * A "source group" is the top-level directory under `data/source/loaders/`. The
 * generator derives each loader's `sourceId` from that directory name and fails
 * if the directory is not registered here, so this file is the single source of
 * truth for source metadata, ordering, and filtering.
 *
 * Metadata rules:
 * - `license` records what is actually verifiable from the upstream project or
 *   the loader files themselves. Use "Unknown" rather than guessing.
 * - `licenseVerified: false` marks a group whose licensing still needs review.
 *   Do not flip it to `true` without checking the upstream repository.
 * - `isOriginal: true` marks Darma-authored designs.
 */

export type LoaderSourceGroupId =
  | "cssloaders-github"
  | "darma"
  | "darma-custom"
  | "darma-research-batch-6"
  | "loaders-css"
  | "loading-io"
  | "open-pack-2026"
  | "uiverse"
  | "uiverse-batch-2"
  | "uiverse-batch-3"
  | "uiverse-batch-4"
  | "uiverse-batch-5";

export type LoaderSourceGroup = {
  /** Matches the directory name under `data/source/loaders/`. */
  id: LoaderSourceGroupId;
  /** Short label used in filters and cards. */
  name: string;
  /** One-line explanation shown on detail views. */
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  licenseUrl?: string;
  /** Attribution line required when redistributing these loaders. */
  attribution?: string;
  /** True for Darma-authored designs, false for adapted external collections. */
  isOriginal: boolean;
  /** False when the upstream license has not been confirmed from the source. */
  licenseVerified: boolean;
};

export const LOADER_SOURCE_GROUPS: readonly LoaderSourceGroup[] = [
  {
    id: "darma",
    name: "Darma Originals",
    description: "Darma original seed loaders from the earliest catalog sprints.",
    author: "Darma",
    license: "Custom (Darma)",
    isOriginal: true,
    licenseVerified: true,
  },
  {
    id: "darma-custom",
    name: "Darma Custom",
    description: "The main body of Darma-authored loaders added across catalog batches.",
    author: "Darma",
    license: "Custom (Darma)",
    isOriginal: true,
    licenseVerified: true,
  },
  {
    id: "darma-research-batch-6",
    name: "Darma Research Batch 6",
    description: "Darma original implementations inspired by public CSS loader galleries.",
    author: "Darma",
    license: "Custom (Darma)",
    isOriginal: true,
    licenseVerified: true,
  },
  {
    id: "cssloaders-github",
    name: "CSS Loaders",
    description: "Adapted from the cssloaders.github.io collection of single-element loaders.",
    author: "cssloaders",
    homepage: "https://cssloaders.github.io/",
    repository: "https://github.com/cssloaders/cssloaders.github.io",
    license: "MIT",
    licenseUrl: "https://github.com/cssloaders/cssloaders.github.io/blob/main/LICENSE",
    attribution: "Loaders adapted from cssloaders.github.io (MIT).",
    isOriginal: false,
    licenseVerified: true,
  },
  {
    id: "loaders-css",
    name: "Loaders.css",
    description: "Adapted from Connor Atherton's loaders.css animation collection.",
    author: "Connor Atherton",
    repository: "https://github.com/ConnorAtherton/loaders.css",
    license: "MIT",
    licenseUrl: "https://github.com/ConnorAtherton/loaders.css/blob/master/license",
    attribution: "Loaders adapted from loaders.css by Connor Atherton (MIT).",
    isOriginal: false,
    licenseVerified: true,
  },
  {
    id: "loading-io",
    name: "loading.io",
    description: "Adapted from the loading.io pure CSS spinner examples.",
    author: "loading.io",
    homepage: "https://loading.io/css/",
    license: "CC0-1.0",
    licenseUrl: "https://loading.io/css/",
    attribution: "Loaders adapted from loading.io CSS spinners (CC0).",
    isOriginal: false,
    licenseVerified: true,
  },
  {
    id: "open-pack-2026",
    name: "Open Pack 2026",
    description:
      "Patterns normalized by Darma from several open-source loader projects, including SpinKit, Whirl, and loaders.css.",
    author: "Darma, from open-source CSS loader projects",
    license: "MIT-inspired patterns, normalized by Darma",
    attribution: "Patterns inspired by SpinKit (Tobias Ahlin), Whirl (Jhey Tompkins), and loaders.css (Connor Atherton).",
    isOriginal: false,
    licenseVerified: true,
  },
  {
    id: "uiverse",
    name: "Uiverse",
    description: "Selected community loading patterns from Uiverse.",
    author: "Uiverse community",
    homepage: "https://uiverse.io/ui/loading-ui",
    license: "MIT / per-component open-source license",
    isOriginal: false,
    licenseVerified: true,
  },
  {
    id: "uiverse-batch-2",
    name: "Uiverse Batch 2",
    description: "Second batch of selected community loading patterns from Uiverse.",
    author: "Uiverse community",
    homepage: "https://uiverse.io/ui/loading-ui",
    license: "MIT / per-component open-source license",
    isOriginal: false,
    licenseVerified: true,
  },
  {
    id: "uiverse-batch-3",
    name: "Uiverse Batch 3",
    description: "Third batch of selected community loading patterns from Uiverse.",
    author: "Uiverse community",
    homepage: "https://uiverse.io/ui/loading-ui",
    license: "MIT / per-component open-source license",
    isOriginal: false,
    licenseVerified: true,
  },
  {
    id: "uiverse-batch-4",
    name: "Uiverse Batch 4",
    description: "Fourth batch of Uiverse community snippets. Licensing has not been confirmed per component.",
    author: "Uiverse community",
    homepage: "https://uiverse.io/ui/loading-ui",
    license: "Unknown",
    isOriginal: false,
    licenseVerified: false,
  },
  {
    id: "uiverse-batch-5",
    name: "Uiverse Batch 5",
    description: "Fifth batch of Uiverse community snippets. Licensing has not been confirmed per component.",
    author: "Uiverse community",
    homepage: "https://uiverse.io/ui/loading-ui",
    license: "Unknown",
    isOriginal: false,
    licenseVerified: false,
  },
];

const sourceGroupsById = new Map(LOADER_SOURCE_GROUPS.map((group) => [group.id, group]));

export const LOADER_SOURCE_GROUP_IDS: readonly string[] = LOADER_SOURCE_GROUPS.map((group) => group.id);

export function isLoaderSourceGroupId(value: string): value is LoaderSourceGroupId {
  return sourceGroupsById.has(value as LoaderSourceGroupId);
}

export function getLoaderSourceGroup(id: string): LoaderSourceGroup | undefined {
  return sourceGroupsById.get(id as LoaderSourceGroupId);
}

export function getLoaderSourceGroupName(id: string): string {
  return sourceGroupsById.get(id as LoaderSourceGroupId)?.name ?? id;
}
