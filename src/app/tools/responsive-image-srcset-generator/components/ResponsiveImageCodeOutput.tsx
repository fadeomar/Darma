import { CodeOutputPanel } from "@/features/tools/components";

export function ResponsiveImageCodeOutput({ img, picture, nextImage, css, manifest }: { img: string; picture: string; nextImage: string; css: string; manifest: string }) {
  return <CodeOutputPanel title="Generated image delivery code" description="Copy img, picture, Next.js Image, CSS, or a machine-readable candidate manifest." tabs={[{ id: "img", label: "img", code: img, language: "html" }, { id: "picture", label: "picture", code: picture, language: "html" }, { id: "next", label: "Next.js", code: nextImage, language: "tsx" }, { id: "css", label: "CSS", code: css, language: "css" }, { id: "manifest", label: "Manifest", code: manifest, language: "json" }]} />;
}
