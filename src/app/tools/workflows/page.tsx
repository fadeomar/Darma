import { permanentRedirect } from "next/navigation";

export default function LegacyToolWorkflowsPage() {
  permanentRedirect("/workflows");
}
