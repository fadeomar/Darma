import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export default function Article() {
  return (
    <ToolContentCard title="Private browser image conversion">
      <div className="space-y-4 text-sm leading-7 text-[var(--color-text-muted)]">
        <p>
          Use the Image Converter to turn an uploaded image into PNG, JPEG, or WebP directly in your browser. It uses the Canvas API locally, so the source file is not sent to a server.
        </p>
        <p>
          PNG is best for transparent graphics, JPEG is useful for photos, and WebP usually gives smaller files for web pages and UI assets.
        </p>
      </div>
    </ToolContentCard>
  );
}
