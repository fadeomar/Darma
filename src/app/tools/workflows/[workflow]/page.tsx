import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ workflow: string }> };

export default async function LegacyToolWorkflowPage({ params }: Props) {
  const { workflow } = await params;
  permanentRedirect(`/workflows/${workflow}`);
}
