import deliveryData from "./delivery-flow.json";
import teamData from "./team-models.json";
import {
  deliveryFlowSchema,
  teamModelsCatalogSchema,
  type DeliveryStage,
  type TeamModel,
} from "./schema";

export const TEAM_MODELS: TeamModel[] = teamModelsCatalogSchema.parse(teamData);
export const DELIVERY_FLOW: DeliveryStage[] = deliveryFlowSchema.parse(deliveryData);
export const getTeamModels = () => TEAM_MODELS;
export const getTeamModel = (slug: string) => TEAM_MODELS.find((model) => model.slug === slug);
export const getDeliveryFlow = () => DELIVERY_FLOW;
