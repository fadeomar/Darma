import pathData from "./learning-paths.json";
import { learningPathCatalogSchema, type LearningPath, type LearningPathTrack } from "./schema";
export const LEARNING_PATHS: LearningPath[] = learningPathCatalogSchema.parse(pathData);
export const LEARNING_PATH_TRACKS: LearningPathTrack[] = ["web","mobile","design","devops"];
export const getLearningPaths=()=>LEARNING_PATHS;
export const getLearningPath=(slug:string)=>LEARNING_PATHS.find((path)=>path.slug===slug);
export const getFeaturedLearningPaths=(limit=LEARNING_PATHS.length)=>LEARNING_PATHS.filter((path)=>path.featured).slice(0,limit);
export const getLearningPathResourceIds=(path:LearningPath)=>[...new Set(path.stages.flatMap((stage)=>stage.resourceIds))];
export function getLearningPathLinksByResourceId(){const links:Record<string,Array<{title:string;href:string}>>={};for(const path of LEARNING_PATHS)for(const id of getLearningPathResourceIds(path)){links[id]??=[];links[id].push({title:path.shortTitle,href:`/learning-paths/${path.slug}`});}return links;}
