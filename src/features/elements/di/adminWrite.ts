import { ElementWriteService } from "../application/elementWriteService";
import { getRepositories } from "@/server/repositories";

export function makeElementWriteService() {
  return new ElementWriteService(getRepositories().adminElement);
}
