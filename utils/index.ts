export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  if (typeof dateString === "undefined") {
    return "";
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const getGradientColor = (index: number) => {
  const gradients = [
    { from: "#6366F1", to: "#A855F7" }, // Indigo to Purple
    { from: "#3B82F6", to: "#60A5FA" }, // Blue to Light Blue
    { from: "#10B981", to: "#34D399" }, // Green to Light Green
    { from: "#F59E0B", to: "#FBBF24" }, // Amber to Yellow
    { from: "#EF4444", to: "#F87171" }, // Red to Light Red
    { from: "#8B5CF6", to: "#C4B5FD" }, // Violet to Light Violet
  ];
  return gradients[index % gradients.length];
};
