import type { CoreEntity } from "@/core";
import { getLearningPaths } from "@/features/learning-paths";
import { getResourceCatalog } from "@/features/resources";
import { getGlossaryTerms } from "@/features/tech-glossary";
import { getTechCareers } from "@/features/tech-careers";
import { getDeliveryFlow, getTeamModels } from "@/features/tech-teams";
import { getWaysOfWorking } from "@/features/ways-of-working";
import { getEditorialPages, getResourceHubs } from "@/features/editorial";

const searchHref = (name: string) => `/resources?q=${encodeURIComponent(name)}`;

export function getAtlasSearchEntities(): CoreEntity[] {
  const resources: CoreEntity[] = getResourceCatalog().map((resource) => ({
    id: `atlas-resource-${resource.id}`,
    slug: `atlas-resource-${resource.slug}`,
    kind: "resource",
    title: resource.name,
    description: resource.summary,
    href: searchHref(resource.name),
    status: resource.review.status === "archived" ? "deprecated" : "live",
    categories: resource.categories,
    tags: resource.tags,
    keywords: [resource.domain, resource.resourceType, resource.publisherType, resource.pricing, ...resource.levels],
    featured: resource.featured,
    updatedAt: resource.review.lastChecked ?? undefined,
    metadata: {
      domain: resource.domain,
      resourceType: resource.resourceType,
      publisherType: resource.publisherType,
      reviewStatus: resource.review.status,
    },
  }));

  const learningPaths: CoreEntity[] = getLearningPaths().map((path) => ({
    id: `atlas-path-${path.slug}`,
    slug: `atlas-path-${path.slug}`,
    kind: "learning",
    title: path.title,
    description: path.summary,
    href: `/learning-paths/${path.slug}`,
    status: "live",
    categories: ["Learning Paths", path.track],
    tags: path.tags,
    keywords: [...path.audience, ...path.outcomes, ...path.stages.flatMap((stage) => stage.topics)],
    featured: path.featured,
    metadata: {
      track: path.track,
      difficulty: path.difficulty,
      estimatedWeeks: path.estimatedWeeks,
    },
  }));

  const careers: CoreEntity[] = getTechCareers().map((career) => ({
    id: `atlas-career-${career.slug}`,
    slug: `atlas-career-${career.slug}`,
    kind: "learning",
    title: career.title,
    description: career.summary,
    href: `/tech-careers/${career.slug}`,
    status: "live",
    categories: ["Tech Careers", career.category],
    tags: career.tags,
    keywords: [...career.skills.technical, ...career.skills.human, ...career.tools, career.focus],
    featured: career.featured,
  }));

  const ways: CoreEntity[] = getWaysOfWorking().map((way) => ({
    id: `atlas-way-${way.slug}`,
    slug: `atlas-way-${way.slug}`,
    kind: "learning",
    title: way.title,
    description: way.summary,
    href: `/ways-of-working/${way.slug}`,
    status: "live",
    categories: ["Ways of Working", way.kind],
    tags: way.tags,
    keywords: [...way.coreIdeas, ...way.roles, ...way.artifacts, ...way.relatedTerms],
    featured: way.featured,
  }));

  const glossary: CoreEntity[] = getGlossaryTerms().map((term) => ({
    id: `atlas-term-${term.slug}`,
    slug: `atlas-term-${term.slug}`,
    kind: "learning",
    title: term.acronym ? `${term.term} (${term.acronym})` : term.term,
    description: term.definition,
    href: `/tech-glossary#${term.slug}`,
    status: "live",
    categories: ["Tech Glossary", term.category],
    tags: term.tags,
    keywords: [...term.aliases, term.practicalMeaning, term.example, ...term.relatedTerms],
  }));

  const teamModels: CoreEntity[] = getTeamModels().map((model) => ({
    id: `atlas-team-${model.slug}`,
    slug: `atlas-team-${model.slug}`,
    kind: "learning",
    title: model.title,
    description: model.summary,
    href: "/tech-teams#team-models",
    status: "live",
    categories: ["Technology Teams", "Team Models"],
    tags: model.tags,
    keywords: [...model.usefulWhen, ...model.watchOutFor, model.decisionPattern, model.communicationPattern],
  }));

  const deliveryStages: CoreEntity[] = getDeliveryFlow().map((stage) => ({
    id: `atlas-delivery-${stage.id}`,
    slug: `atlas-delivery-${stage.id}`,
    kind: "learning",
    title: stage.title,
    description: stage.description,
    href: "/tech-teams#delivery-flow",
    status: "live",
    categories: ["Technology Teams", "Delivery Flow"],
    tags: stage.glossaryTerms,
    keywords: [stage.question, ...stage.outputs, ...stage.roleSlugs],
  }));


  const editorial: CoreEntity[] = getEditorialPages().map((page) => ({
    id: `atlas-editorial-${page.slug}`,
    slug: `atlas-editorial-${page.slug}`,
    kind: "learning",
    title: page.title,
    description: page.summary,
    href: `/${page.kind === "guide" ? "guides" : "comparisons"}/${page.slug}`,
    status: "live",
    categories: [page.kind === "guide" ? "Technology Guides" : "Technology Comparisons"],
    tags: page.secondaryKeywords,
    keywords: [page.primaryKeyword, page.searchIntent, ...page.audience, ...page.keyTakeaways],
    featured: page.featured,
    updatedAt: page.updatedAt,
  }));

  const resourceHubs: CoreEntity[] = getResourceHubs().map((hub) => ({
    id: `atlas-resource-hub-${hub.slug}`,
    slug: `atlas-resource-hub-${hub.slug}`,
    kind: "collection",
    title: hub.title,
    description: hub.summary,
    href: `/resources/${hub.slug}`,
    status: "live",
    categories: ["Resource Hubs", ...hub.categoryNames],
    tags: hub.tagTerms,
    keywords: [...hub.audience, ...hub.learnFirst, ...hub.selectionCriteria],
    featured: true,
    updatedAt: hub.updatedAt,
  }));

  const atlasPages: CoreEntity[] = [
    {
      id: "atlas-home",
      slug: "atlas-home",
      kind: "collection",
      title: "Darma Tech Atlas",
      description: "A connected reference for resources, learning paths, careers, ways of working, team structures, and terminology.",
      href: "/tech-atlas",
      status: "live",
      categories: ["Tech Atlas"],
      tags: ["technology reference", "developer learning", "careers", "workflows"],
      featured: true,
      pinned: 10,
    },
    {
      id: "atlas-career-pathfinder",
      slug: "atlas-career-pathfinder",
      kind: "learning",
      title: "Darma Career Pathfinder",
      description: "Answer six practical questions and explore technology roles that match your preferred outcomes, craft, collaboration, and work environment.",
      href: "/career-pathfinder",
      status: "live",
      categories: ["Tech Careers", "Interactive Atlas"],
      tags: ["career quiz", "technology roles", "career exploration", "learning paths"],
      keywords: ["which technology career suits me", "career pathfinder", "frontend", "design", "devops", "product"],
      featured: true,
      pinned: 9,
    },
    {
      id: "atlas-contribute",
      slug: "atlas-contribute",
      kind: "collection",
      title: "Contribute to Darma",
      description: "Suggest a trustworthy resource, improve a learning path, correct Atlas content, or submit a focused pull request.",
      href: "/contribute",
      status: "live",
      categories: ["Open Source", "Tech Atlas"],
      tags: ["contribute", "open source", "resource suggestion", "content correction"],
      featured: true,
    },
  ];

  return [...atlasPages, ...editorial, ...resourceHubs, ...learningPaths, ...careers, ...ways, ...teamModels, ...deliveryStages, ...glossary, ...resources];
}
