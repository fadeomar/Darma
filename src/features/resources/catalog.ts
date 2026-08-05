import legacyCatalogData from "./resources.catalog.json";
import curatedCatalogData from "./curated-resources.json";
import iconManifestData from "./resource-icons.json";
import { resourceCatalogSchema, type Resource } from "./schema";

type IconManifest = Record<string,{path:string;sourceUrl:string;checkedAt:string}>;
const legacy=resourceCatalogSchema.parse(legacyCatalogData);
const curated=resourceCatalogSchema.parse(curatedCatalogData);
const iconManifest=iconManifestData as IconManifest;

function mergeCatalogs(catalogs:Resource[][]):Resource[]{
  const byUrl=new Map<string,Resource>();
  const ids=new Set<string>();
  for(const resource of catalogs.flat()){
    const existing=byUrl.get(resource.url);
    if(existing){
      byUrl.set(resource.url,{...existing,categories:[...new Set([...existing.categories,...resource.categories])].sort((a,b)=>a.localeCompare(b)),tags:[...new Set([...existing.tags,...resource.tags])],levels:[...new Set([...existing.levels,...resource.levels])],featured:existing.featured||resource.featured,publisherType:resource.publisherType==="unknown"?existing.publisherType:resource.publisherType,pricing:resource.pricing==="unknown"?existing.pricing:resource.pricing,review:resource.review.status==="verified"?resource.review:existing.review,icon:{...existing.icon,...resource.icon,logoUrl:resource.icon.logoUrl??existing.icon.logoUrl,faviconUrl:resource.icon.faviconUrl??existing.icon.faviconUrl}});
      continue;
    }
    if(ids.has(resource.id)) throw new Error(`Duplicate resource id across catalog sources: ${resource.id}`);
    ids.add(resource.id);byUrl.set(resource.url,resource);
  }
  return [...byUrl.values()].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.name.localeCompare(b.name));
}
const merged=mergeCatalogs([legacy,curated]);
export const RESOURCE_CATALOG:Resource[]=merged.map((resource)=>{const local=iconManifest[resource.id];return local?{...resource,icon:{...resource.icon,localPath:local.path,status:"local"}}:resource;});
export const RESOURCE_CATEGORIES=[...new Set(RESOURCE_CATALOG.flatMap((r)=>r.categories))].sort((a,b)=>a.localeCompare(b));
export const RESOURCE_TYPES=[...new Set(RESOURCE_CATALOG.map((r)=>r.resourceType))].sort((a,b)=>a.localeCompare(b));
export const FEATURED_RESOURCES=RESOURCE_CATALOG.filter((r)=>r.featured);
const BY_ID=new Map(RESOURCE_CATALOG.map((r)=>[r.id,r]));
const BY_SLUG=new Map(RESOURCE_CATALOG.map((r)=>[r.slug,r]));
export const getResourceCatalog=()=>RESOURCE_CATALOG;
export const getFeaturedResources=(limit=10)=>FEATURED_RESOURCES.slice(0,limit);
export const getResourceById=(id:string)=>BY_ID.get(id);
export const getResourceBySlug=(slug:string)=>BY_SLUG.get(slug);
export const getResourcesByIds=(ids:string[])=>ids.map((id)=>BY_ID.get(id)).filter((r):r is Resource=>Boolean(r));
export function getResourceCategoryCounts(){return RESOURCE_CATEGORIES.map((category)=>({category,count:RESOURCE_CATALOG.filter((r)=>r.categories.includes(category)).length})).sort((a,b)=>b.count-a.count||a.category.localeCompare(b.category));}
