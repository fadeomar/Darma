import TooltipCard from "@/components/TooltipCard";
import tooltips from "@/data/tooltips/index.json"; // Import the JSON array

export default function Home() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {tooltips.map((tooltip) => (
        <TooltipCard key={tooltip.id} tooltip={tooltip} />
      ))}
    </div>
  );
}
